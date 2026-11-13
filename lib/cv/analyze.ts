import { SECTIONS, BANDS, LEVELS, MARKETS, type Market, type Level, type Role } from './data';
import { findSkills, rankRoles, detectDisciplines } from '@/lib/ats/engine';
import { DISCIPLINES } from './roles-extra';
import { defaultModel, learnedSkills, type AtsModel } from '@/lib/ats/model';
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
  salary: { min: number; max: number; market: Market; source: 'model' | 'bands'; n?: number; unclear?: boolean };
  /** the CV is outside the engineering fields the role model knows: scored on universal ATS rules only */
  general?: boolean;
  words: number;
  skills: Found[];
  ranges: Range[];
  alerts: string[]; // market-specific alerts (e.g. SCE for KSA)
  discipline: { id: string; ar: string; en: string } | null;
  model: { version: string; jobs_used: number; trained_at: string | null };
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function kwRegex(k: string) {
  const body = esc(k.toLowerCase()).replace(/\s+/g, '[\\s\\-_/]*');
  return /[a-z]/.test(k) ? new RegExp(`(^|[^a-z0-9])${body}(?=[^a-z0-9]|$)`, 'i') : new RegExp(body);
}

/** "— Skills —", "=== EXPERIENCE ===", "■ Education ■", "Skills ———" → plain heading text (decoration only, never bullets) */
const DECO = '[—–\\-=_~*#•▪●■◆◇★☆»«>|/\\\\\\[\\](){}:：.]';
const DECO_BOTH = new RegExp(`^\\s*(${DECO}+)\\s*(\\S.{0,38}?)\\s*(${DECO}+)\\s*$`);
const DECO_TAIL = new RegExp(`^\\s*([^\\d\\s—–\\-=_~*#•▪●■].{0,38}?)\\s*[—–\\-=_~*#•▪●■◆★]{2,}\\s*$`);
export function undecorate(text: string) {
  return text.split('\n').map((l) => {
    const b = l.match(DECO_BOTH);
    // both sides decorated, and the tail is real decoration (not a sentence's full stop / colon / bracket)
    const both = b && (!/^[.:：)\]]+$/.test(b[3]) || /[(\[]/.test(b[1])) && !(b[1].length === 1 && /[-•*▪●]/.test(b[1]) && b[3].length === 1 && b[2].split(/\s+/).length > 3) ? b[2] : null;
    const t = !both ? l.match(DECO_TAIL)?.[1] : null;
    const h = both || t;
    return h && h.split(/\s+/).length <= 5 && !/\d{3,}|@/.test(h) ? h.trim() : l;
  }).join('\n');
}

/** find section headings and their positions */
export function findSections(text: string) {
  const lines = text.split(/\n/);
  const found: { key: string; pos: number }[] = [];
  let pos = 0;
  for (const raw of lines) {
    const line = raw.trim().toLowerCase().replace(/[:：\-–•|#*]+$/g, '').replace(/^[\s•\-–#*]+/, '').trim();
    // a heading can also carry its content on the same line: "المؤهل: بكالوريوس…" / "Skills: Revit, …"
    const lab = /[:：]/.test(line) ? line.split(/[:：]/)[0].trim() : '';
    if (lab && lab.length <= 25 && Object.values(SECTIONS).some((names) => names.includes(lab))) {
      const key = Object.entries(SECTIONS).find(([, names]) => names.includes(lab))![0];
      found.push({ key, pos }); pos += raw.length + 1; continue;
    }
    if (line && line.length <= 40 && !/^\s*[•\-–—*▪●○◦>]\s*\S/.test(raw)) {
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


const STRONG_VERB = new RegExp(`^(?:lead|led|manag|design|develop|built|build|supervis|prepar|review|implement|reduc|increas|improv|deliver|coordinat|perform|conduct|creat|optimi[sz]|install|commission|plann?|execut|launch|analy[sz]|maintain|test|programm?|achiev|sav|model+|calculat|select|produc|drove|driv|establish|introduc|negotiat|won|win|train|mentor|automat|migrat|deploy|integrat|monitor|inspect|audit|estimat|pric|survey|draft|complet|handl|operat|troubleshoot|troubleshot|repair|ran|run|wrote|writ|author|own|cut|rais|boost|secur|set\s+up|approv|sen[dt]|attend|support|issu|evaluat|assess|check|verif|updat|track|report|organi[sz]|control|direct|head|oversaw|oversee|spearhead|generat|resolv|fix|refactor|ship|scal|engineer|configur|instal|implement|apply|appli|recommend|present|propos|submitt?|obtain|ensur|follow|carri|carry|liais|communicat|prioriti[sz]|schedul|forecast|budget|procur|purchas|sourc|tender|bid|quantif|measur|mapp?|digiti[sz])(?:e|es|ed|d|s|ing|ied|ies)?\\b|^(?:اشرفت|أشرفت|صممت|نفذت|نفّذت|أعددت|اعددت|قمت|أدرت|ادرت|طورت|متابعة|الإشراف|تصميم|إعداد|تنفيذ|إدارة|مراجعة)`, 'i');
const WEAK_START = /^(responsible\s+for|responsibilities|duties|worked\s+on|working\s+on|helped|helping|involved\s+in|participated\s+in|tasks?\s+included|in\s+charge\s+of)/i;

export function levelFor(y: number): Level {
  if (y >= LEVELS.lead.min) return 'lead';
  if (y >= LEVELS.senior.min) return 'senior';
  if (y >= LEVELS.mid.min) return 'mid';
  return 'junior';
}

/** the person's own skills list, as written (stops at the next heading such as Languages / Certifications) */
export function listedSkills(text: string): string[] {
  text = undecorate(text);
  const sections = findSections(text);
  const st = sections.find((x) => x.key === 'skills');
  if (!st) return [];
  const nx = sections.filter((x) => x.pos > st.pos).sort((a, b) => a.pos - b.pos)[0]?.pos ?? text.length;
  const lines = text.slice(st.pos, nx).split('\n').slice(1);
  const stop = lines.findIndex((l) => /^\s*(languages?|اللغات|certifications?|courses|training|hobbies|interests|references|personal|الشهادات|الدورات|الهوايات)(?=\s|:|：|$)\s*[:：]?\s*$/i.test(l) || /^\s*(languages?|اللغات)\s*[:：]/i.test(l));
  return [...new Set((stop >= 0 ? lines.slice(0, stop) : lines).join('\n').split(/[,،|•·;\n]+|\s{2,}/).map((x) => x.replace(/^[\s\-–*▪●]+/, '').trim()).filter((x) => x.length > 1 && x.length < 40))];
}

export function analyzeCv(rawText: string, market: Market, pages = 0, model: AtsModel = defaultModel(), opts: { general?: boolean } = {}): CvResult {
  const text = undecorate(rawText.replace(/\r/g, '').replace(/[ \t]+/g, ' '));
  const lower = text.toLowerCase();
  const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.+#&-]*/gu) || []).length;
  const sections = findSections(text);
  const has = (k: string) => sections.some((s) => s.key === k);

  /* ---- roles (MEP LAB ATS engine, learned weights) ---- */
  const found = findSkills(text, learnedSkills(model));
  const exp0 = extractExperience(text);
  const firstWork = exp0.ranges.filter((r) => r.kind === 'work').sort((a, b) => b.end - a.end || b.start - a.start)[0]?.line;
  const ds = detectDisciplines(text, found);
  const roles = rankRoles(found, model, market, text, firstWork, ds);
  const top = roles[0];
  const discId = top.role.disc !== 'any' ? top.role.disc : ds.best >= 3 ? ds.top : null;
  const discipline = discId && DISCIPLINES[discId] ? { id: discId, ar: DISCIPLINES[discId].ar, en: DISCIPLINES[discId].en } : null;

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
  // a CV that doesn't show its discipline can't be priced honestly: say so instead of a number
  (salary as CvResult['salary']).unclear = top.pct < 35;
  // outside engineering (accounting, sales, HR, software…): the MEP role model can't judge it, so score universal rules only
  const ENG_DISC = ['mep', 'mech', 'civil', 'elec', 'arch', 'survey', 'process', 'petroleum', 'automation', 'telecom', 'biomedical'];
  const engWords = /\b(hvac|mep|plumbing|fire\s*(?:fighting|protection|alarm)|revit|autocad|navisworks|site engineer|technical office|shop drawings?|civil|structural|electrical|mechanical)\b|مهندس|هندس[هة]|تكييف|حريق|صحي/i.test(text);
  const textDisc = ds.best >= 3 ? ds.top : null; // from the CV itself, not from the closest MEP role
  const engCue = engWords || /\bengineer(?:s|ing)?\b/i.test(text) || (!!textDisc && ENG_DISC.includes(textDisc));
  const itCv = textDisc === 'it' || (top.role.disc === 'it' && top.pct >= 30);
  // opts.general keeps a rewritten CV in the same mode as the original it came from
  const general = opts.general ?? (!engCue && !itCv);
  if (general) (salary as CvResult['salary']).unclear = true;

  /* ---- ATS checks ---- */
  const checks: Check[] = [];
  const add = (id: string, weight: number, status: CheckStatus, detail?: string) => checks.push({ id, weight, status, detail });

  add('readable', 15, words >= 120 ? 'pass' : words >= 40 ? 'warn' : 'fail', `${words}`);
  add('email', 8, /[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(text) ? 'pass' : 'fail');
  add('phone', 6, /(\+?\d[\d\s\-().]{7,}\d)/.test(text) && (text.match(/\+?\d[\d\s\-().]{7,}\d/g) || []).some((x: string) => x.replace(/\D/g, '').length >= 9 && !/(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}/.test(x)) ? 'pass' : 'fail');
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
  const metrics = (lower.match(/\d[\d,.]*\s*-?\s*(?:%|percent|projects?|buildings?|tr\b|tons?|cfm|m2|m²|m3|m³|sqm|sq\.?\s*m|million|mn|billion|bn|k\b|units|floors?|stor(?:ey|ies)|rooms?|keys|beds?|m\b|lm\b|meters?|metres?|gpm|l\/s|villas?|towers?|engineers|members|workers|operators|users|customers|clients|sites|wells|km|kv|mw|kw|bopd|mmscfd|hospitals|schools|lines|machines|stores|apps?|hours|days|weeks|months|egp|sar|aed|usd|\$)|(?:egp|sar|aed|usd|\$)\s*\d/g) || []).length;
  add('metrics', 7, metrics >= 3 ? 'pass' : metrics >= 1 ? 'warn' : 'fail', `${metrics}`);
  // general CVs: the skills list itself (how many concrete skills are named) instead of role keywords
  const skillItems = listedSkills(text);
  if (general) add('keywords', 12, skillItems.length >= 8 ? 'pass' : skillItems.length >= 4 ? 'warn' : 'fail', `${skillItems.length}`);
  else add('keywords', 12, top.pct >= 60 ? 'pass' : top.pct >= 35 ? 'warn' : 'fail', `${top.matched.length}`);
  // skills backed by experience: an ATS/recruiter discounts a long skills list that never appears in the experience bullets
  {
    const expStart = sections.find((x) => x.key === 'experience')?.pos ?? -1;
    const nextAfterExp = sections.filter((x) => x.pos > expStart).sort((a, b) => a.pos - b.pos)[0]?.pos ?? text.length;
    const expText = expStart >= 0 ? text.slice(expStart, nextAfterExp) : '';
    const inExp = expText ? findSkills(expText) : new Map();
    const nonCert = [...found.values()].filter((f) => SKILL_BY_ID.get(f.id)?.cat !== 'cert');
    let evidenced = nonCert.filter((f) => inExp.has(f.id)).length, total = nonCert.length;
    if (general) {
      // the person's own listed skills that show up again in their experience
      const el = expText.toLowerCase();
      const items = skillItems.map((x) => x.toLowerCase());
      total = items.length;
      evidenced = items.filter((x) => el.includes(x) || x.split(/\s+/).filter((w) => w.length > 3).some((w) => el.includes(w))).length;
    }
    const ratio = total ? evidenced / total : 1;
    add('evidence', 10, !expText ? 'warn' : ratio >= 0.5 ? 'pass' : ratio >= 0.3 ? 'warn' : 'fail', `${evidenced}/${total}`);
    // experience depth: how many bullets with real content
    const bullets = (expText.match(/^\s*[•\-–*▪●]\s*\S.{25,}/gm) || []).length;
    add('depth', 8, bullets >= 6 || (expText.length > 1200 && !/^\s*[•\-–*]/m.test(expText)) ? 'pass' : bullets >= 3 || expText.length > 600 ? 'warn' : 'fail', `${bullets}`);
    // impact language: bullets that open with an action verb, not "responsible for / duties"
    const blts = (expText.match(/^\s*[•\-–*▪●]\s*\S.{15,}/gm) || []).map((b) => b.replace(/^\s*[•\-–*▪●]\s*/, '').toLowerCase());
    const strong = blts.filter((b) => STRONG_VERB.test(b)).length;
    const weak = blts.filter((b) => WEAK_START.test(b)).length;
    const vr = blts.length ? strong / blts.length : 0;
    add('verbs', 5, blts.length < 3 ? 'warn' : vr >= 0.6 && weak <= 1 ? 'pass' : vr >= 0.35 ? 'warn' : 'fail', `${strong}/${blts.length}`);
  }
  const arabic = (text.match(/[؀-ۿ]/g) || []).length / Math.max(1, text.replace(/\s/g, '').length);
  add('language', 3, arabic < 0.15 ? 'pass' : 'warn');
  add('personal', 2, /(religion|marital status|date of birth|\bdob\b|references available|الديانة|الحالة الاجتماعية)/i.test(text) ? 'warn' : 'pass');

  const totalW = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + c.weight * (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  const score = Math.round((100 * got) / totalW);

  const alerts: string[] = [];
  const engineer = !general && engCue && textDisc !== 'it';
  if (engineer && market === 'sa' && !found.has('sce')) alerts.push('sce');
  if (engineer && market === 'eg' && !found.has('syndicate')) alerts.push('syndicate');
  if (!general && (!found.size || ![...found.values()].some((f) => SKILL_BY_ID.get(f.id)?.cat !== 'cert'))) alerts.push('no_skills');

  return {
    score, checks, roles, years, level, salary, words,
    skills: [...found.values()].sort((a, b) => b.hits - a.hits),
    ranges: exp.ranges,
    alerts, discipline, general,
    model: { version: model.version, jobs_used: model.jobs_used, trained_at: model.trained_at }
  };
}
