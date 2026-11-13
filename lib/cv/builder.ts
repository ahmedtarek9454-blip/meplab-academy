/**
 * Builds a CV model from what the person said or typed in the guided builder.
 * Same rules as the rewrite: only their own facts, sharper wording, ATS layout.
 */
import { findSkills } from '@/lib/ats/match';
import { polishBullet, buildSummary, toText, enEducation, enLanguage, enLine, type CvModel, type Entry } from './rebuild';
import { transliterate } from './names';
import { levelFor } from './analyze';
import { ROLES, type Market } from './data';
import { interpretLine, normalizeSpeech } from './speech';
import { suggestCompany, suggestCity, suggestTitle } from './names';

/** The CV is English: Arabic left in a name field is replaced by its English form. */
const en = (v: string, f: (x: string) => { value: string } | null) => { const x = v.trim(); return /[\u0600-\u06FF]/.test(x) ? f(x)?.value || x : x; };

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

const PAST = /^(?:\w+ed|ran|led|built|wrote|made|took|set|ran|drew|held|won|sold|taught|brought|kept|met|oversaw|undertook)$/i;
export function splitActions(x: string) {
  // split only where the next piece starts with a past-tense verb; otherwise keep the joiner as it was
  const re = /(,\s+(?:and\s+)?|\s+and\s+)/;
  const toks = x.replace(/\.$/, '').split(re);
  const out: string[] = [toks[0]];
  for (let k = 1; k < toks.length; k += 2) {
    const sep = toks[k], piece = toks[k + 1] || '';
    if (PAST.test(piece.split(/\s+/)[0])) out.push(piece); else out[out.length - 1] += sep + piece;
  }
  return out.length > 1 && out.every((o) => o.split(/\s+/).length >= 3) ? out.map((o) => o.trim().replace(/^(\w)/, (c) => c.toUpperCase())) : [x];
}

export function buildFromData(d: BuilderData, asProjects = false) {
  const role = ROLES.find((r) => r.id === d.roleId);
  const jobs = d.jobs.filter((j) => j.title || j.company);
  const experience: Entry[] = jobs
    .map((j) => {
      // a long run-on sentence ("modeled …, ran clash detection …, resolved …") becomes one bullet per action
      const spoken = jobLines(j, d.roleId).map((l) => l.text).flatMap((x) => (x.split(/\s+/).length >= 14 ? splitActions(x) : [x]));
      // the person's own lines with numbers first: recruiters scan for figures
      const own = spoken.map(polishBullet).filter(Boolean).sort((a, b) => Number(/\d/.test(b)) - Number(/\d/.test(a)));
      const bullets = [...own.filter((x) => /\d/.test(x)), ...j.picks.map(polishBullet), ...own.filter((x) => !/\d/.test(x))].filter(Boolean);
      const start = ym(j.from), end = ym(j.to, j.present);
      return {
        title: en(j.title, suggestTitle), company: en(j.company, suggestCompany), location: en(j.location, suggestCity),
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
    name: hasArabic(d.name) ? transliterate(d.name.trim()) : d.name.trim(), headline: asProjects ? role?.en || 'Engineer' : (jobs[0] ? en(jobs[0].title, suggestTitle) : '') || role?.en || '',
    email: d.email.trim(), phone: d.phone.trim(), linkedin: d.linkedin.trim(), location: en(d.location, suggestCity),
    summary: [], experience: asProjects ? [] : experience, projects: asProjects ? experience : undefined,
    education: d.edu.filter((e) => e.degree || e.school).map((e) => [hasArabic(e.degree) ? enEducation(e.degree).split(' – ')[0] : e.degree.trim(), e.school && en(e.school, suggestCompany), e.year].filter(Boolean).join(' – ')),
    certifications: d.certs.split(/\n+/).map((x) => enLine(x.trim())).filter(Boolean),
    skills,
    languages: d.languages.split(/[,،|]+|\s+و(?=\S)/).map((x) => enLanguage(x.trim())).filter(Boolean),
    removed: []
  };
  const years = asProjects ? 0 : totalYears(jobs);
  const level = levelFor(years);
  let summary = buildSummary(asProjects ? { ...m, experience } : m, years, d.roleId || 'tech_office', level, d.market);
  if (asProjects) {
    // fresh graduate: say so plainly instead of an experience line
    const e0 = d.edu.find((e) => e.degree || e.school);
    const deg = (e0 && hasArabic(e0.degree) ? enEducation(e0.degree).split(' – ')[0] : e0?.degree.trim()) || 'engineering';
    const when = [e0?.school && en(e0.school, suggestCompany), e0?.year].filter(Boolean).join(', ');
    const t = m.headline;
    const art = /^(?:[AEIOU]|HVAC|MEP|FM\b|SCADA)/i.test(t) ? 'an' : 'a';
    const rest = summary.replace(/^[^]*?\.\s+/, '').replace(/^Hands-on experience in/, 'Academic and training experience in');
    summary = `Recent ${deg} graduate${when ? ` (${when})` : ''} seeking ${art} ${t} role.${rest && rest !== summary ? ' ' + rest : ''}`;
  }
  return { model: m, summary, text: toText(m, summary), years, level };
}
