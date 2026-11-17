/**
 * MEP LAB usage stats + learning signals on Netlify Blobs.
 * Works on Netlify with no keys. Stores only anonymous data: the CV signal
 * (role, score, skill ids…), a hashed visitor id and the event type.
 * Never the CV text, a name, an e-mail or a phone.
 */
import { getStore } from '@netlify/blobs';
import type { CvSignal, SignalRow } from '@/lib/ats/learn';

export const EVENTS = ['visit', 'rewrite', 'word', 'pdf', 'share_dl', 'share_li', 'share_fb', 'share_native', 'jd', 'jd_link', 'jd_image', 'apply', 'apply_word', 'apply_mail'] as const;
export type EventType = (typeof EVENTS)[number];

const store = (name: string) => getStore({ name, consistency: 'strong' });

/** Cairo calendar day, YYYY-MM-DD */
export const cairoDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const dayBefore = (day: string, n: number) => cairoDay(new Date(Date.parse(day + 'T12:00:00Z') - n * 86400000));

export type StoredSignal = CvSignal & { ip_hash: string; created_at: string; confirmed_role: string | null; sb_id?: string | null };

/* ---------------- write side ---------------- */
export async function saveSignal(sig: CvSignal, ip: string, sbId: string | null): Promise<{ id: string } | { error: 'rate' }> {
  const s = store('cv-signals');
  const day = cairoDay();
  const today = await s.list({ prefix: `${day}/${ip}/` });
  if (today.blobs.length >= 60) return { error: 'rate' };
  const key = `${day}/${ip}/${crypto.randomUUID()}`;
  const row: StoredSignal = { ...sig, ip_hash: ip, created_at: new Date().toISOString(), confirmed_role: null, sb_id: sbId };
  await s.setJSON(key, row);
  return { id: key.replace(/\//g, '.') };
}

export const BLOB_ID = /^\d{4}-\d{2}-\d{2}\.[0-9a-f]{24}\.[0-9a-f-]{36}$/;

/** the person confirms or corrects the role (once); returns the Supabase row id if there is one */
export async function confirmSignal(id: string, role: string): Promise<{ ok: boolean; sb_id?: string | null }> {
  const s = store('cv-signals');
  const key = id.replace(/\./g, '/');
  const row = (await s.get(key, { type: 'json' })) as StoredSignal | null;
  if (!row || row.confirmed_role) return { ok: false };
  await s.setJSON(key, { ...row, confirmed_role: role });
  return { ok: true, sb_id: row.sb_id };
}

export async function saveEvent(type: EventType, ip: string) {
  const s = store('cv-events');
  const day = cairoDay();
  // one visit per person per day is enough; other events are counted each time (capped per person per day)
  if (type === 'visit') return s.set(`${day}/visit/${ip}`, '1');
  const mine = await s.list({ prefix: `${day}/${type}/${ip}/` });
  if (mine.blobs.length >= 30) return;
  return s.set(`${day}/${type}/${ip}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, '1');
}

/* ---------------- read side ---------------- */
async function keys(name: string, prefix: string) {
  const out: string[] = [];
  for await (const page of store(name).list({ prefix, paginate: true })) out.push(...page.blobs.map((b) => b.key));
  return out;
}

async function readMany<T>(name: string, ks: string[]): Promise<T[]> {
  const s = store(name); const out: T[] = [];
  for (let i = 0; i < ks.length; i += 50) {
    const part = await Promise.all(ks.slice(i, i + 50).map((k) => s.get(k, { type: 'json' }).catch(() => null)));
    out.push(...(part.filter(Boolean) as T[]));
  }
  return out;
}

/** all signals of one day; days older than 2 days are packed into one blob so later reads are a single get */
export async function signalsOfDay(day: string): Promise<StoredSignal[]> {
  const packs = store('cv-signal-packs');
  const packed = (await packs.get(day, { type: 'json' }).catch(() => null)) as StoredSignal[] | null;
  if (packed) return packed;
  const rows = await readMany<StoredSignal>('cv-signals', await keys('cv-signals', `${day}/`));
  if (day < dayBefore(cairoDay(), 2)) await packs.setJSON(day, rows).catch(() => {});
  return rows;
}

export const LAUNCH_DAY = '2026-11-15';

export function daysSince(from: string, to = cairoDay()) {
  const out: string[] = []; let d = to;
  while (d >= from && out.length < 400) { out.push(d); d = dayBefore(d, 1); }
  return out; // newest first
}

export async function eventCounts(day: string) {
  const ks = await keys('cv-events', `${day}/`);
  const c: Record<string, { n: number; people: number }> = {};
  const ppl: Record<string, Set<string>> = {};
  for (const k of ks) {
    const [, type, ip] = k.split('/');
    (c[type] ||= { n: 0, people: 0 }).n++;
    (ppl[type] ||= new Set()).add(ip);
  }
  for (const t in c) c[t].people = ppl[t].size;
  return c;
}

/* ---------------- learning ---------------- */
/** when the score became 40% format / 60% content; older scores are on a different scale and stay out of the score comparison */
export const SCORE_V2 = '2026-11-17T06:30:00Z';

export async function trainingRows(days = 365): Promise<SignalRow[]> {
  const from = dayBefore(cairoDay(), days) > LAUNCH_DAY ? dayBefore(cairoDay(), days) : LAUNCH_DAY;
  const out: SignalRow[] = [];
  for (const d of daysSince(from)) out.push(...(await signalsOfDay(d)).map((r) => (r.created_at < SCORE_V2 ? { ...r, score: null } : r)));
  return out;
}

export async function getModel<T = any>(): Promise<T | null> {
  return (await store('ats-model').get('latest', { type: 'json' }).catch(() => null)) as T | null;
}
export async function setModel(model: any) { await store('ats-model').setJSON('latest', model); }

/* ---------------- rate limits (shared across all server instances) ---------------- */
/** true when this visitor already used `max` of `bucket` today */
export async function overLimit(bucket: string, ip: string, max: number): Promise<boolean> {
  try {
    const s = store('rate');
    const day = cairoDay();
    const used = await s.list({ prefix: `${day}/${bucket}/${ip}/` });
    if (used.blobs.length >= max) return true;
    await s.set(`${day}/${bucket}/${ip}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, '1');
    return false;
  } catch {
    return false; // never lock real users out because the counter is down
  }
}
