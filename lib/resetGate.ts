/**
 * Guard for the "reset with your WhatsApp number" path (used only while no mail provider is set).
 * Counters and a short log live on Netlify Blobs: hashed keys only, no e-mail or phone is stored in the counters.
 */
import { createHash } from 'crypto';
import { getStore } from '@netlify/blobs';
import { cairoDay } from '@/lib/stats/store';

const MAX_PER_DAY = 5;
const h = (v: string) => createHash('sha256').update(`${v}|${process.env.CRON_SECRET || 'meplab-salt'}`).digest('hex').slice(0, 24);
const store = () => getStore({ name: 'reset-gate', consistency: 'strong' });

/** counts one attempt for this key and says whether the key is over today's limit */
export async function overLimit(kind: 'ip' | 'email', value: string): Promise<boolean> {
  try {
    const s = store();
    const key = `n/${cairoDay()}/${kind}/${h(value)}`;
    const n = Number((await s.get(key, { type: 'text' })) || 0) + 1;
    await s.set(key, String(n));
    return n > MAX_PER_DAY;
  } catch {
    return true; // storage down: fail closed, the page sends the student to WhatsApp instead
  }
}

/** admin can see who changed a password with the phone path */
export async function logPhoneReset(email: string) {
  try { await store().setJSON(`log/${new Date().toISOString()}`, { email }); } catch {}
}

export async function recentPhoneResets(limit = 20): Promise<{ at: string; email: string }[]> {
  try {
    const s = store();
    const { blobs } = await s.list({ prefix: 'log/' });
    const keys = blobs.map((b) => b.key).sort().reverse().slice(0, limit);
    const rows = await Promise.all(keys.map(async (k) => ({ at: k.slice(4), email: ((await s.get(k, { type: 'json' })) as any)?.email || '' })));
    return rows;
  } catch {
    return [];
  }
}
