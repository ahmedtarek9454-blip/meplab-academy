/**
 * =====================================================================
 *  MEP LAB ATS — learning from the CVs people check
 *  The CV itself never leaves the browser. After each check we send only
 *  an anonymous "signal": detected role, discipline, market, rounded years,
 *  score, the taxonomy skill ids found, and unknown words from the CV's
 *  SKILLS section (candidates for new vocabulary). No name, e-mail, phone,
 *  company or free text. The person can then confirm or correct the role —
 *  that confirmation is the label the training job learns from.
 * =====================================================================
 */
import { SKILLS, SKILL_BY_ID, type Skill } from './taxonomy';
import { findSkills } from './match';
import { ROLES } from '@/lib/cv/data';

export type CvSignal = {
  role_id: string; pct: number; discipline: string | null; market: string; years: number; score: number;
  skills: string[]; terms: string[]; failing: string[]; model_version: string;
};

const ROLE_IDS = new Set(ROLES.map((r) => r.id));
export const isRole = (r: unknown): r is string => typeof r === 'string' && ROLE_IDS.has(r);

const STOP = new Set(('and or the of in with for to using use good very strong excellent basic advanced intermediate fluent native ' +
  'english arabic french german language languages skills skill tools software computer microsoft office word powerpoint outlook windows ' +
  'communication teamwork team work leadership problem solving time management hard soft working under pressure self motivated ' +
  'presentation negotiation creativity adaptability attention to detail fast learner hardworking honest punctual driving license ' +
  'technical other others etc knowledge experience ability years ms office suite internet email e-mail typing research reporting analytical thinking critical creative quick learner multitasking organized organizational interpersonal collaboration management planning').split(/\s+/));

/** a word/phrase is a valid vocabulary candidate (no personal data, no numbers that could be IDs) */
export function cleanTerm(raw: string): string | null {
  const t = raw.toLowerCase().replace(/[()[\]{}"“”'’:]+/g, ' ').replace(/^[\s•·▪●*\-–—]+|[\s.\-–—]+$/g, '').replace(/\s+/g, ' ').trim();
  if (t.length < 2 || t.length > 32) return null;
  if (!/^[a-z0-9][a-z0-9+#./& -]*$/.test(t)) return null; // latin only — Arabic free text is too likely to be personal
  if (!/[a-z]/.test(t) || /\d{4,}/.test(t) || /@|https?|www\.|\.com\b/.test(t)) return null;
  const words = t.split(' ');
  if (words.length > 4 || words.every((w) => STOP.has(w))) return null;
  if (STOP.has(t)) return null;
  return t;
}

/** unknown terms from the SKILLS section (what the engine does not understand yet) */
export function unknownSkillTerms(skillsSectionText: string, max = 25): string[] {
  const out = new Set<string>();
  for (const part of skillsSectionText.split(/[,،;|•·▪●\n/]+|\s-\s|\s–\s/)) {
    const t = cleanTerm(part.replace(/^[^:]{0,25}:\s*/, '')); // "Software: X" → X
    if (!t) continue;
    if (findSkills(t).size) continue; // already known
    out.add(t);
    if (out.size >= max) break;
  }
  return [...out];
}

/** server-side validation of a signal coming from the browser */
export function sanitizeSignal(b: any): CvSignal | null {
  if (!b || !isRole(b.role_id)) return null;
  const skills = Array.isArray(b.skills) ? [...new Set(b.skills.filter((x: any) => typeof x === 'string' && SKILL_BY_ID.has(x)))].slice(0, 80) as string[] : [];
  const terms = Array.isArray(b.terms) ? [...new Set(b.terms.map((x: any) => (typeof x === 'string' ? cleanTerm(x) : null)).filter(Boolean))].slice(0, 25) as string[] : [];
  const failing = Array.isArray(b.failing) ? b.failing.filter((x: any) => typeof x === 'string' && /^[a-z_]{2,20}$/.test(x)).slice(0, 20) : [];
  const num = (v: any, lo: number, hi: number) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : lo);
  return {
    role_id: b.role_id,
    pct: Math.round(num(b.pct, 0, 100)),
    discipline: typeof b.discipline === 'string' && /^[a-z]{2,15}$/.test(b.discipline) ? b.discipline : null,
    market: ['eg', 'sa', 'ae'].includes(b.market) ? b.market : 'eg',
    years: Math.round(num(b.years, 0, 50)), // whole years only
    score: Math.round(num(b.score, 0, 100)),
    skills, terms, failing,
    model_version: typeof b.model_version === 'string' ? b.model_version.slice(0, 30) : ''
  };
}

/* ---------------- training side ---------------- */
export type SignalRow = { role_id: string; confirmed_role: string | null; pct: number; market?: string; skills: string[] | null; terms: string[] | null };

/** learned vocabulary becomes skills the engine matches, scoped to the roles that use it */
export function learnedSkill(term: string): Skill {
  return { id: `l:${term}`, label: term, cat: 'learned' as Skill['cat'], syn: [term], roles: {} };
}

export const LEARN = {
  minCvs: 8,        // a term must appear in at least this many CVs of a role
  minShare: 0.12,   // ... and in at least 12% of that role's CVs
  lift: 2.5,        // ... and be 2.5× more common there than in other roles
  confidentPct: 75  // unconfirmed checks count (at half weight) only when the engine was this sure
};

/** label of a signal: the person's confirmation wins; confident unconfirmed checks count at half weight */
export function labelOf(s: SignalRow): { role: string; w: number } | null {
  if (s.confirmed_role && isRole(s.confirmed_role)) return { role: s.confirmed_role, w: 1 };
  if (s.pct >= LEARN.confidentPct && isRole(s.role_id)) return { role: s.role_id, w: 0.5 };
  return null;
}

export function learnTerms(rows: SignalRow[], blocked: Set<string>) {
  const covered = new Set(SKILLS.flatMap((s) => s.syn.map((x) => x.toLowerCase())));
  const perRole: Record<string, Record<string, number>> = {};
  const n: Record<string, number> = {};
  const total: Record<string, number> = {};
  let N = 0;
  for (const s of rows) {
    const l = labelOf(s); if (!l) continue;
    n[l.role] = (n[l.role] || 0) + l.w; N += l.w;
    for (const t of new Set(s.terms || [])) {
      if (blocked.has(t) || covered.has(t)) continue;
      (perRole[l.role] ||= {})[t] = (perRole[l.role][t] || 0) + l.w;
      total[t] = (total[t] || 0) + l.w;
    }
  }
  const learned: Record<string, { term: string; n: number; share: number }[]> = {};
  for (const [role, terms] of Object.entries(perRole)) {
    for (const [t, c] of Object.entries(terms)) {
      const share = c / n[role];
      const otherN = N - n[role], otherC = total[t] - c;
      const otherShare = otherN > 0 ? otherC / otherN : 0;
      if (c >= LEARN.minCvs && share >= LEARN.minShare && share >= LEARN.lift * otherShare) (learned[role] ||= []).push({ term: t, n: Math.round(c), share: Math.round(share * 100) / 100 });
    }
    learned[role]?.sort((a, b) => b.share - a.share).splice(15);
  }
  return learned;
}
