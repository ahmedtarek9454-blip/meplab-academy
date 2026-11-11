/**
 * Builds a CV model from what the person said or typed in the guided builder.
 * Same rules as the rewrite: only their own facts, sharper wording, ATS layout.
 */
import { findSkills } from '@/lib/ats/match';
import { polishBullet, buildSummary, toText, type CvModel, type Entry } from './rebuild';
import { levelFor } from './analyze';
import { ROLES, type Market } from './data';
import { interpretLine, normalizeSpeech } from './speech';

export type Job = { title: string; company: string; location: string; from: string; to: string; present: boolean; picks: string[]; said: string; edits?: Record<string, string> };
export type Edu = { degree: string; school: string; year: string };
export type BuilderData = {
  name: string; phone: string; email: string; location: string; linkedin: string;
  roleId: string; market: Market;
  jobs: Job[]; edu: Edu[]; skills: string; certs: string; languages: string;
};

export const emptyJob = (): Job => ({ title: '', company: '', location: '', from: '', to: '', present: false, picks: [], said: '' });
export const emptyData = (): BuilderData => ({
  name: '', phone: '', email: '', location: '', linkedin: '', roleId: '', market: 'eg',
  jobs: [emptyJob()], edu: [{ degree: '', school: '', year: '' }], skills: '', certs: '', languages: 'Arabic (Native), English'
});

export const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

/** "2021-03" or "2021" → decimal year */
function ym(v: string, present = false) {
  if (present) { const d = new Date(); return d.getFullYear() + d.getMonth() / 12; }
  const m = String(v || '').match(/(\d{4})(?:-(\d{1,2}))?/);
  return m ? +m[1] + (m[2] ? (+m[2] - 1) / 12 : 0) : NaN;
}
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmt(v: string) {
  const m = String(v || '').match(/(\d{4})(?:-(\d{1,2}))?/);
  if (!m) return '';
  return m[2] ? `${MONS[+m[2] - 1]} ${m[1]}` : m[1];
}

/** Spoken text → bullet lines: split on new lines, full stops and "then / also / and also". */
export function splitSaid(said: string) {
  return String(said || '')
    .split(/\n+|(?<=[.!؟?])\s+|\s+(?:and then|then|also|and also|كمان|وكمان|وبعدين|و بعدين)\s+|\s+(?=و(?:كنت|بعمل|عملت|بتابع|تابعت|نسقت|بنسق|صممت|بصمم|راجعت|براجع|حسبت|بحسب|جهزت|بجهز|استلمت|بستلم|سلمت|بسلم|اشتغلت|ركبت|بركب|نفذت|بنفذ|اشرفت|أشرفت|بشرف|دربت|قدمت|حليت|اختار|اخترت|بختار)\s)/i)
    .map((x) => x.replace(/^[\s,،\-•]+|[\s,،]+$/g, '').replace(/^(?:(?:and|then|also|so|after that|later|plus|وكمان|كمان|وبعدين|بعدين|و)\s+)+/i, '').replace(/^و(?=(?:كنت|بعمل|عملت|بتابع|تابعت|نسقت|بنسق|صممت|بصمم|راجعت|براجع|حسبت|بحسب|جهزت|بجهز|استلمت|بستلم|سلمت|بسلم|اشتغلت|ركبت|بركب|نفذت|بنفذ|اشرفت|أشرفت|بشرف|دربت|قدمت|حليت|اختار|اخترت|بختار)\s)/, '').trim())
    .filter((x) => x.split(/\s+/).length >= (/[\u0600-\u06FF]/.test(x) ? 2 : 3));
}

/** Each spoken/typed sentence, cleaned, translated if Arabic, and the person's own edit if they made one. */
export function jobLines(j: Job, roleId: string) {
  return splitSaid(normalizeSpeech(j.said)).map((orig) => {
    const it = interpretLine(orig, roleId);
    const edited = j.edits?.[orig];
    return { ...it, text: edited ?? it.text, edited: edited !== undefined };
  });
}

export function totalYears(jobs: Job[]) {
  // merge overlapping ranges so parallel jobs don't double-count
  const r = jobs.map((j) => [ym(j.from), ym(j.to, j.present)]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a).sort((x, y) => x[0] - y[0]);
  let total = 0, cs = -1, ce = -1;
  for (const [a, b] of r) { if (a > ce) { if (ce > cs) total += ce - cs; cs = a; ce = b; } else ce = Math.max(ce, b); }
  if (ce > cs) total += ce - cs;
  return Math.round(total * 10) / 10;
}

export function buildFromData(d: BuilderData) {
  const role = ROLES.find((r) => r.id === d.roleId);
  const jobs = d.jobs.filter((j) => j.title || j.company);
  const experience: Entry[] = jobs
    .map((j) => {
      const spoken = jobLines(j, d.roleId).map((l) => l.text);
      const bullets = [...j.picks.map(polishBullet), ...spoken.map(polishBullet)].filter(Boolean);
      const start = ym(j.from), end = ym(j.to, j.present);
      return {
        title: j.title.trim(), company: j.company.trim(), location: j.location.trim(),
        dates: [fmt(j.from), j.present ? 'Present' : fmt(j.to)].filter(Boolean).join(' – '),
        start: Number.isFinite(start) ? start : 0, end: Number.isFinite(end) ? end : 0,
        bullets: [...new Set(bullets)], notes: []
      };
    })
    .sort((a, b) => b.end - a.end || b.start - a.start);

  // skills: what they listed + what their own task lines mention, grouped like the rewrite
  const allText = [d.skills, ...experience.flatMap((e) => e.bullets), d.certs].join('\n');
  const skills: Record<string, string[]> = {};
  for (const f of findSkills(allText).values()) {
    const list = (skills[f.cat] ||= []);
    if (!list.includes(f.label)) list.push(f.label);
  }
  const listed = d.skills.split(/[,،\n]+/).map((x) => x.trim()).filter(Boolean);
  const known = new Set(Object.values(skills).flat().map((x) => x.toLowerCase()));
  const extra = listed.filter((x) => !known.has(x.toLowerCase()) && ![...known].some((k) => k.includes(x.toLowerCase())));
  if (extra.length) skills.other = [...(skills.other || []), ...extra];

  const m: CvModel = {
    name: d.name.trim(), headline: jobs[0]?.title?.trim() || role?.en || '',
    email: d.email.trim(), phone: d.phone.trim(), linkedin: d.linkedin.trim(), location: d.location.trim(),
    summary: [], experience,
    education: d.edu.filter((e) => e.degree || e.school).map((e) => [e.degree, e.school, e.year].filter(Boolean).join(' – ')),
    certifications: d.certs.split(/\n+/).map((x) => x.trim()).filter(Boolean),
    skills,
    languages: d.languages.split(/[,،|]+/).map((x) => x.trim()).filter(Boolean),
    removed: []
  };
  const years = totalYears(jobs);
  const level = levelFor(years);
  const summary = buildSummary(m, years, d.roleId || 'tech_office', level, d.market);
  return { model: m, summary, text: toText(m, summary), years, level };
}
