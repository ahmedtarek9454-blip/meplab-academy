import { SECTIONS, BANDS, LEVELS, MARKETS, type Market, type Level, type Role } from './data';
import { findSkills, rankRoles } from '@/lib/ats/engine';
import { defaultModel, type AtsModel } from '@/lib/ats/model';
import { SKILL_BY_ID } from '@/lib/ats/taxonomy';
import type { Found } from '@/lib/ats/match';
import { extractExperience, type Range } from '@/lib/ats/experience';

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type Check = { id: string; status: CheckStatus; weight: number; detail?: string };

export type RoleMatch = { role: Role; pct: number; matched: string[]; missing: string[]; missingIds?: string[] };

export type CvResult = {
  score: number;
  checks: Check[];
  roles: RoleMatch[];
  years: number;
  level: Level;
  salary: { min: number; max: number; market: Market; source: 'model' | 'bands'; n?: number };
  words: number;
  skills: Found[];
  ranges: Range[];
  alerts: string[]; // market-specific alerts (e.g. SCE for KSA)
  model: { version: string; jobs_used: number; trained_at: string | null };
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function kwRegex(k: string) {
  const body = esc(k.toLowerCase()).replace(/\s+/g, '[\\s\\-_/]*');
  return /[a-z]/.test(k) ? new RegExp(`(^|[^a-z0-9])${body}(?=[^a-z0-9]|$)`, 'i') : new RegExp(body);
}

/** find section headings and their positions */
export function findSections(text: string) {
  const lines = text.split(/\n/);
  const found: { key: string; pos: number }[] = [];
  let pos = 0;
  for (const raw of lines) {
    const line = raw.trim().toLowerCase().replace(/[:：\-–•|#*]+$/g, '').replace(/^[\s•\-–#*]+/, '').trim();
    if (line && line.length <= 40) {
      for (const [key, names] of Object.entries(SECTIONS)) {
        if (names.some((n) => line === n || (line.startsWith(n) && line.length - n.length <= 12) || (line.endsWith(n) && line.length - n.length <= 14))) {
          found.push({ key, pos });
          break;
        }
      }
    }
    pos += raw.length + 1;
  }
  return found;
}

export function sectionAt(sections: { key: string; pos: number }[], pos: number) {
  let cur = '';
  for (const s of sections) if (s.pos <= pos) cur = s.key;
  return cur;
}


export function levelFor(y: number): Level {
  if (y >= LEVELS.lead.min) return 'lead';
  if (y >= LEVELS.senior.min) return 'senior';
  if (y >= LEVELS.mid.min) return 'mid';
  return 'junior';
}

export function analyzeCv(rawText: string, market: Market, pages = 0, model: AtsModel = defaultModel()): CvResult {
  const text = rawText.replace(/\r/g, '').replace(/[ \t]+/g, ' ');
  const lower = text.toLowerCase();
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.+#&-]*/gu) || []).length;
  const sections = findSections(text);
  const has = (k: string) => sections.some((s) => s.key === k);

  /* ---- roles (MEP LAB ATS engine, learned weights) ---- */
  const found = findSkills(text);
  const exp0 = extractExperience(text);
  const firstWork = exp0.ranges.filter((r) => r.kind === 'work').sort((a, b) => b.end - a.end || b.start - a.start)[0]?.line;
  const roles = rankRoles(found, model, market, text, firstWork);
  const top = roles[0];

  /* ---- experience & salary ---- */
  const exp = exp0;
  const years = exp.years;
  const level = levelFor(years);
  const [bmin, bmax] = BANDS[market][level];
  const r = MARKETS[market].round;
  const nice = (v: number) => Math.round(v / r) * r;
  // learned salary (from real job posts) when the model has enough data, else reference bands
  const LEVEL_F: Record<Level, number> = { junior: 0.7, mid: 1, senior: 1.25, lead: 1.6 }; // posts mostly advertise mid-level pay
  const st = model.salary[top.role.id]?.[market];
  const salary = st && st.n >= 8
    ? { min: nice(st.p25 * LEVEL_F[level]), max: nice(st.p75 * LEVEL_F[level]), market, source: 'model' as const, n: st.n }
    : { min: nice(bmin * top.role.mult), max: nice(bmax * top.role.mult), market, source: 'bands' as const };

  /* ---- ATS checks ---- */
  const checks: Check[] = [];
  const add = (id: string, weight: number, status: CheckStatus, detail?: string) => checks.push({ id, weight, status, detail });

  add('readable', 15, words >= 120 ? 'pass' : words >= 40 ? 'warn' : 'fail', `${words}`);
  add('email', 8, /[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(text) ? 'pass' : 'fail');
  add('phone', 6, /(\+?\d[\d\s\-().]{7,}\d)/.test(text) && (text.match(/\+?\d[\d\s\-().]{7,}\d/g) || []).some((x) => x.replace(/\D/g, '').length >= 9 && !/(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}/.test(x)) ? 'pass' : 'fail');
  add('linkedin', 4, /linkedin\.com\/in\//i.test(text) || /linkedin/i.test(text) ? 'pass' : 'warn');
  add('summary', 5, has('summary') ? 'pass' : 'warn');
  add('experience', 10, has('experience') ? 'pass' : 'fail');
  add('education', 6, has('education') ? 'pass' : 'fail');
  add('skills', 8, has('skills') ? 'pass' : 'fail');
  const dateCount = exp.ranges.filter((r) => r.kind === 'work').length;
  add('dates', 6, dateCount >= 1 ? 'pass' : 'fail', `${dateCount}`);
  add('length', 8,
    words >= 350 && words <= 1100 && (!pages || pages <= 3) ? 'pass' : words >= 200 && words <= 1600 ? 'warn' : 'fail',
    `${words}${pages ? ` / ${pages}p` : ''}`);
  const metrics = (lower.match(/\d[\d,.]*\s*(?:%|percent|projects?|buildings?|tr\b|tons?|cfm|m2|m²|sqm|sq\.?\s*m|million|mn|k\b|units|floors|villas|towers|engineers|members)/g) || []).length;
  add('metrics', 7, metrics >= 3 ? 'pass' : metrics >= 1 ? 'warn' : 'fail', `${metrics}`);
  add('keywords', 12, top.pct >= 60 ? 'pass' : top.pct >= 35 ? 'warn' : 'fail', `${top.matched.length}`);
  // skills backed by experience: an ATS/recruiter discounts a long skills list that never appears in the experience bullets
  {
    const expStart = sections.find((x) => x.key === 'experience')?.pos ?? -1;
    const nextAfterExp = sections.filter((x) => x.pos > expStart).sort((a, b) => a.pos - b.pos)[0]?.pos ?? text.length;
    const expText = expStart >= 0 ? text.slice(expStart, nextAfterExp) : '';
    const inExp = expText ? findSkills(expText) : new Map();
    const nonCert = [...found.values()].filter((f) => SKILL_BY_ID.get(f.id)?.cat !== 'cert');
    const evidenced = nonCert.filter((f) => inExp.has(f.id)).length;
    const ratio = nonCert.length ? evidenced / nonCert.length : 1;
    add('evidence', 10, !expText ? 'warn' : ratio >= 0.5 ? 'pass' : ratio >= 0.3 ? 'warn' : 'fail', `${evidenced}/${nonCert.length}`);
    // experience depth: how many bullets with real content
    const bullets = (expText.match(/^\s*[•\-–*▪●]\s*\S.{25,}/gm) || []).length;
    add('depth', 8, bullets >= 6 || (expText.length > 1200 && !/^\s*[•\-–*]/m.test(expText)) ? 'pass' : bullets >= 3 || expText.length > 600 ? 'warn' : 'fail', `${bullets}`);
  }
  const arabic = (text.match(/[؀-ۿ]/g) || []).length / Math.max(1, text.replace(/\s/g, '').length);
  add('language', 3, arabic < 0.15 ? 'pass' : 'warn');
  add('personal', 2, /(religion|marital status|date of birth|\bdob\b|references available|الديانة|الحالة الاجتماعية)/i.test(text) ? 'warn' : 'pass');

  const totalW = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  const score = Math.round((100 * got) / totalW);

  const alerts: string[] = [];
  if (market === 'sa' && !found.has('sce')) alerts.push('sce');
  if (market === 'eg' && !found.has('syndicate')) alerts.push('syndicate');
  if (!found.size || ![...found.values()].some((f) => SKILL_BY_ID.get(f.id)?.cat !== 'cert')) alerts.push('no_skills');

  return {
    score, checks, roles, years, level, salary, words,
    skills: [...found.values()].sort((a, b) => b.hits - a.hits),
    ranges: exp.ranges,
    alerts,
    model: { version: model.version, jobs_used: model.jobs_used, trained_at: model.trained_at }
  };
}
