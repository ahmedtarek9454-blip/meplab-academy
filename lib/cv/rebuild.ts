/**
 * =====================================================================
 *  MEP LAB CV Rebuilder — turns a parsed CV into an ATS-friendly version.
 *  Rule-based and truthful: it re-structures, re-formats and sharpens the
 *  wording using ONLY facts already in the CV. It never invents employers,
 *  dates, numbers or skills. Runs fully in the browser.
 * =====================================================================
 */
import { extractExperience, type Range } from '@/lib/ats/experience';
import { findSkills } from '@/lib/ats/match';
import { SKILL_BY_ID, type Cat } from '@/lib/ats/taxonomy';
import { ROLES, LEVELS, type Market, type Level } from './data';
import { arabicToEnglish } from './speech';
import { suggestTitle, suggestCompany, suggestCity, transliterate } from './names';

export type Entry = { title: string; company: string; location: string; dates: string; start: number; end: number; bullets: string[]; orig?: string[]; notes: string[] };
export type CvModel = {
  name: string; headline: string; email: string; phone: string; linkedin: string; location: string;
  summary: string[]; experience: Entry[]; education: string[]; certifications: string[]; skills: Record<string, string[]>; languages: string[];
  removed: string[]; // personal-data lines dropped for ATS hygiene
  projects?: Entry[]; // academic projects & training (CV builder, fresh graduates)
};

const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (y: number, present: boolean) => {
  if (present) return 'Present';
  const yr = Math.floor(y + 1e-6), m = Math.round((y - yr) * 12);
  return m >= 12 ? `Dec ${yr}` : `${MONS[Math.max(0, Math.min(11, m))]} ${yr}`;
};

const HEAD: Record<string, RegExp> = {
  summary: /^(professional\s+)?(summary|profile|objective|career objective|about me)\b|^(نبذة|الملخص|الهدف)/i,
  experience: /^(work\s+|professional\s+|employment\s+)?(experience|history|career history|employment)\b|^(الخبرات|الخبرة|الوظائف السابقة|سجل العمل)/i,
  education: /^(education|academic|qualifications?|التعليم|المؤهل|الدراسة)/i,
  skills: /^(technical\s+|core\s+|key\s+)?(skills|competencies|software|tools|expertise)\b|^(المهارات|البرامج)/i,
  certifications: /^(certifications?|certificates?|courses?|training|licen[cs]es?|professional development)\b|^(الشهادات|الدورات|التدريب)/i,
  languages: /^(languages?)\b|^اللغات/i,
  projects: /^(key\s+|selected\s+|major\s+)?projects?\b|المشاريع/i,
  personal: /^(personal\s+(details|information|data)|البيانات الشخصية)/i,
  references: /^(references?|المراجع)/i,
  contact: /^(contact|البيانات|الاسم|الهاتف|الموبايل|البريد|العنوان|الجنسية|تاريخ الميلاد|الحالة الاجتماعية|الديانة)/i,
  military: /^(military|الخدمة العسكرية|التجنيد)/i
};
const PERSONAL = /^(date of birth|dob|birth date|birthday|age|marital status|married|single|religion|nationality|gender|sex|military status|national id|passport|driving licen|الحالة الاجتماعية|الديانة|تاريخ الميلاد|الجنسية|النوع|موقف التجنيد|رقم قومي)\b/i;

const WEAK_START: [RegExp, string][] = [
  [/^(i\s+)?(was\s+)?responsible\s+for\s+(the\s+)?/i, 'Managed '],
  [/^(i\s+)?(am\s+)?in\s+charge\s+of\s+(the\s+)?/i, 'Led '],
  [/^(i\s+)?worked\s+on\s+(the\s+)?/i, 'Delivered '],
  [/^(i\s+)?worked\s+as\s+(an?\s+)?/i, 'Served as '],
  [/^(i\s+)?(helped|assisted)\s+(in|with)\s+(the\s+)?/i, 'Supported '],
  [/^(i\s+)?participated\s+in\s+(the\s+)?/i, 'Contributed to '],
  [/^(i\s+)?involved\s+in\s+(the\s+)?/i, 'Contributed to '],
  [/^(i\s+)?(did|doing|do)\s+(the\s+)?/i, 'Performed '],
  [/^(i\s+)?(made|make|making)\s+(the\s+)?/i, 'Prepared '],
  [/^(duties|tasks)\s+(include[ds]?|:)\s*/i, ''],
  [/^(i\s+)?(have\s+)?(been\s+)?(working|work)\s+(on|in)\s+(the\s+)?/i, 'Delivered '],
  [/^(handling|handled)\s+(the\s+)?/i, 'Managed '],
  [/^(dealing|dealt)\s+with\s+(the\s+)?/i, 'Coordinated with '],
  [/^(follow(?:ing)?[\s-]*up|followed up)\s+(on|with)?\s*(the\s+)?/i, 'Tracked '],
  [/^preparing\s+/i, 'Prepared '], [/^designing\s+/i, 'Designed '], [/^reviewing\s+/i, 'Reviewed '], [/^coordinating\s+/i, 'Coordinated '],
  [/^supervising\s+/i, 'Supervised '], [/^managing\s+/i, 'Managed '], [/^leading\s+/i, 'Led '], [/^performing\s+/i, 'Performed '],
  [/^conducting\s+/i, 'Conducted '], [/^developing\s+/i, 'Developed '], [/^creating\s+/i, 'Created '], [/^modeling\s+|^modelling\s+/i, 'Modelled '],
  [/^calculating\s+/i, 'Calculated '], [/^selecting\s+/i, 'Selected '], [/^attending\s+/i, 'Attended '], [/^issuing\s+/i, 'Issued '],
  [/^producing\s+/i, 'Produced '], [/^supporting\s+/i, 'Supported '], [/^ensuring\s+/i, 'Ensured '], [/^checking\s+/i, 'Checked '],
  [/^monitoring\s+/i, 'Monitored '], [/^updating\s+/i, 'Updated '], [/^running\s+/i, 'Ran '], [/^resolving\s+/i, 'Resolved ']
];

const clean = (s: string) => s.replace(/^[\s•\-–—*▪●○◦>]+/, '').replace(/\s+/g, ' ').trim();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function polishBullet(raw: string) {
  let b = clean(raw).replace(/\.+$/, '').replace(/\s+,/g, ',');
  if (!b) return '';
  for (const [re, rep] of WEAK_START) { if (re.test(b)) { b = rep + b.replace(re, ''); break; } }
  b = b.replace(/\b(i|we)\s+(am|was|were|have|had)\b\s*/gi, '').replace(/^\s*(and|also|then)\s+/i, '');
  b = b.replace(/\bmy\b/gi, 'the').replace(/\bour\b/gi, 'the').replace(/\s+/g, ' ').trim();
  b = cap(b);
  // normalise common tokens
  b = b.replace(/\bhvac\b/gi, 'HVAC').replace(/\bmep\b/gi, 'MEP').replace(/\bbim\b/gi, 'BIM').replace(/\bahu\b/gi, 'AHU').replace(/\bfcu\b/gi, 'FCU').replace(/\bvrf\b/gi, 'VRF')
    .replace(/\bboq\b/gi, 'BOQ').replace(/\bnfpa\b/gi, 'NFPA').replace(/\bashrae\b/gi, 'ASHRAE').replace(/\bsmacna\b/gi, 'SMACNA').replace(/\brevit\b/gi, 'Revit').replace(/\bnavisworks\b/gi, 'Navisworks').replace(/\bautocad\b/gi, 'AutoCAD');
  return b.endsWith('.') ? b : b + '.';
}

function splitHeader(lines: string[]): { title: string; company: string; location: string } {
  // typical: "Title – Company, City" | "Title | Company | City" | two lines: Title / Company – City
  const joined = lines.filter(Boolean).join(' | ');
  const parts = joined.split(/\s*[|–—]\s*|\s+-\s+|\s+at\s+|\s+@\s+/i).map((x) => x.trim()).filter(Boolean);
  const isCompany = (x: string) => /(co\.|company|contracting|consultants?|consultancy|engineering|group|llc|ltd|inc|holding|developments?|services|systems|technologies|industries|office|bureau|شركة|مكتب|مجموعة)/i.test(x);
  const isTitle = (x: string) => /(engineer|coordinator|manager|modeler|modeller|designer|estimator|supervisor|lead|head|specialist|technician|draftsman|director|مهندس|مدير|منسق|مشرف)/i.test(x);
  const isPlace = (x: string) => /^(cairo|giza|alexandria|riyadh|jeddah|dammam|khobar|madinah|makkah|neom|dubai|abu dhabi|sharjah|doha|kuwait|muscat|egypt|ksa|saudi|uae|qatar|oman|bahrain|القاهرة|الرياض|جدة|دبي)/i.test(x) || /,\s*(egypt|ksa|saudi arabia|uae|qatar)$/i.test(x);
  let title = parts.find(isTitle) || parts[0] || '';
  let company = parts.find((x) => x !== title && isCompany(x)) || parts.find((x) => x !== title && !isPlace(x)) || '';
  let location = parts.find((x) => x !== title && x !== company && isPlace(x)) || '';
  // "Company, City" inside company
  const m = company.match(/^(.*?),\s*([^,]+(?:,\s*[^,]+)?)$/);
  if (m && isPlace(m[2])) { company = m[1].trim(); location = location || m[2].trim(); }
  return { title: cap(title), company, location };
}

export function parseCv(text: string): CvModel {
  const t = text.replace(/\r/g, '').replace(/[–—]/g, '–').replace(/ /g, ' ');
  const lines = t.split('\n').map((l) => l.replace(/\s+$/, ''));
  const exp = extractExperience(text);
  const work = exp.ranges.filter((r) => r.kind === 'work' && r.lineIdx !== undefined).sort((a, b) => a.lineIdx! - b.lineIdx!);

  const email = (t.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/) || [''])[0];
  const phone = (t.match(/\+?\d[\d\s\-().]{7,}\d/g) || []).find((x: string) => x.replace(/\D/g, '').length >= 9 && !/(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}/.test(x))?.replace(/\s+/g, ' ').trim() || '';
  const linkedin = (t.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w\-%]+/i) || [''])[0];

  // name & headline from the top (skip contact-ish lines)
  const labelled = t.match(/^\s*(?:name|الاسم)\s*[:：]\s*(.+)$/im)?.[1]?.trim();
  const top = lines.slice(0, 8).map(clean).filter((l) => l && !/@|\+?\d{7,}|linkedin|http|^(cv|curriculum vitae|resume|السيرة الذاتية)$|^(languages?|skills|nationality|position|location|mobile|email|phone|address|اللغات|المهارات|الجنسية)\s*[:：]/i.test(l));
  // "Name – Title – email – phone" on one line
  const firstParts = (top[0] || '').split(/\s*[–—|]\s*/);
  let name = labelled || (firstParts.length > 1 && firstParts[0].split(/\s+/).length <= 5 ? firstParts[0] : '') || top.find((l) => l.split(/\s+/).length <= 5 && !/engineer|manager|coordinator|مهندس|مدير|summary|profile|[:：]/i.test(l)) || '';
  name = name.replace(/^(eng\.?|م\.|الاسم\s*:)\s*/i, '').replace(/,?\s*(pmp|leed ap|cfps|p\.?e\.?)$/i, '').trim();
  if (!name) name = (top[0] || '').split(/\s*[–—|,]\s*/)[0].split(/\s+/).slice(0, 4).join(' ') || 'YOUR NAME';
  const labelledPos = t.match(/^\s*(?:position|title|job title|المسمى الوظيفي)\s*[:：]\s*(.+)$/im)?.[1]?.trim();
  const headline = labelledPos || (firstParts.length > 1 ? firstParts.find((x) => /engineer|coordinator|manager|مهندس/i.test(x)) : '') || top.find((l) => l !== name && /engineer|coordinator|manager|modeler|modeller|estimator|designer|specialist|مهندس|مدير|منسق/i.test(l) && l.length < 80 && !/[:：]/.test(l)) || '';
  const locLine = lines.slice(0, 10).map(clean).find((l) => /^(cairo|giza|alexandria|riyadh|jeddah|dammam|dubai|abu dhabi|sharjah|doha|madinah|القاهرة|الرياض|جدة|دبي)/i.test(l) || /\b(egypt|ksa|saudi arabia|uae|qatar)\b/i.test(l) && l.length < 60 && !/@/.test(l));
  const location = locLine ? locLine.split(/\s*[|•]\s*/).find((x) => /egypt|ksa|saudi|uae|qatar|cairo|riyadh|jeddah|dubai|القاهرة|الرياض|جدة|دبي/i.test(x)) || '' : '';

  // section map
  // "المؤهل: بكالوريوس…" / "Skills: Revit, …": a heading with its content on the same line
  const inline: Record<number, { key: string; value: string }> = {};
  lines.forEach((raw, i) => {
    const m = clean(raw).match(/^([^:：]{2,25})[:：]\s*(.+)$/);
    if (!m) return;
    for (const k in HEAD) if (HEAD[k].test(m[1].trim())) { inline[i] = { key: k, value: m[2].trim() }; break; }
  });
  const sec: (string | null)[] = []; let cur: string | null = null;
  lines.forEach((raw, i) => {
    const l = clean(raw).replace(/[:：\-–\s]+$/, '');
    if (inline[i]) cur = inline[i].key;
    else if (l && l.length <= 45) for (const k in HEAD) if (HEAD[k].test(l)) { cur = k; break; }
    sec.push(cur);
  });
  const headingLine = (i: number) => { if (inline[i]) return true; const l = clean(lines[i]).replace(/[:：\-–\s]+$/, ''); return !!l && l.length <= 45 && Object.values(HEAD).some((re) => re.test(l)); };

  // experience entries anchored on work date lines
  const experience: Entry[] = [];
  const used = new Set<number>();
  work.forEach((r, idx) => {
    const li = r.lineIdx!;
    const nextLi = work[idx + 1]?.lineIdx ?? lines.length;
    // header: the date line (minus the date) + up to 3 non-empty lines above that are not bullets/headings/sidebar
    const headerLines: string[] = [];
    const dateLineRest = clean(lines[li].replace(r.raw || '', '')).replace(/^[|–\-,:\s]+|[|–\-,:\s]+$/g, '');
    if (dateLineRest) headerLines.push(dateLineRest);
    for (let k = li - 1, got = 0; k >= 0 && got < 3; k--) {
      const x = clean(lines[k]);
      if (!x) { if (got) break; continue; }
      if (headingLine(k) || /^[•\-–*▪●]/.test(lines[k].trim()) || used.has(k) || /(19|20)\d{2}/.test(x)) break;
      if (/@|\+?\d{7,}|linkedin|^(arabic|english|french)\b/i.test(x)) continue;
      headerLines.unshift(x); used.add(k); got++;
    }
    used.add(li);
    // lines just above the next date line that are not bullets belong to the next entry's header
    let stopAt = nextLi;
    for (let k = nextLi - 1; k > li && k >= nextLi - 4; k--) {
      const x = lines[k].trim();
      if (!x) { stopAt = k; break; }
      if (/^[•\-–*▪●○◦>]/.test(x) || x.length > 90) break;
      stopAt = k;
    }
    const bullets: string[] = [], notes: string[] = [];
    for (let k = li + 1; k < stopAt; k++) {
      if (headingLine(k)) break;
      const x = lines[k];
      if (!x.trim()) continue;
      if (/(19|20)\d{2}\s*[–\-]|present|حتى الآن/i.test(x) && !/^[•\-–*▪●]/.test(x.trim())) break; // next entry header
      if (/^[•\-–*▪●○◦>]/.test(x.trim()) || x.trim().length > 50) bullets.push(x);
      else if (headerLines.length < 3 && bullets.length === 0) headerLines.push(clean(x)); // title on the line after the dates
      else notes.push(clean(x));
      used.add(k);
    }
    const h = splitHeader(headerLines);
    experience.push({
      title: h.title, company: h.company, location: h.location,
      // year-only ranges ("2019 – 2021") stay year-only: no invented months
      dates: (() => {
        const yo = !/[a-z]{3}|(?<!\d)\d{1,2}[\/.\-](?:19|20)?\d{2}\b|يناير|فبراير|مارس|ابريل|أبريل|إبريل|مايو|يونيو|يونيه|يوليو|يوليه|اغسطس|أغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر/i.test((r.raw || '').replace(/present|current|now/gi, ''));
        const now = r.end >= new Date().getFullYear() + (new Date().getMonth() + 1) / 12 - 0.05;
        const f = (y: number) => (yo ? String(Math.floor(y + 1e-6)) : fmtDate(y, false));
        return `${f(r.start)} – ${now ? 'Present' : yo ? String(Math.abs(r.end - Math.round(r.end)) < 0.02 ? Math.round(r.end) - 1 : Math.floor(r.end)) : fmtDate(r.end, false)}`;
      })(),
      start: r.start, end: r.end,
      bullets: bullets.map(polishBullet).filter(Boolean).slice(0, 8), orig: bullets.map(clean).filter(Boolean).slice(0, 8), notes
    });
  });
  experience.sort((a, b) => b.start - a.start);

  // other sections by heading
  const grab = (key: string) => lines.map((l, i) => [l, i] as const).filter(([l, i]) => sec[i] === key && (inline[i] || !headingLine(i)) && l.trim() && !used.has(i)).map(([l, i]) => (inline[i] ? inline[i].value : clean(l))).filter(Boolean);
  const summary = grab('summary').filter((l) => l.length > 20);
  const education = grab('education');
  const certifications = grab('certifications');
  const languages = grab('languages');
  const removed = lines.map(clean).filter((l) => PERSONAL.test(l) || /^(references?\s+available|المراجع)/i.test(l));

  // skills: taxonomy skills found anywhere, grouped by category (labels are ATS-friendly canonical names)
  const found = findSkills(text);
  const skills: Record<string, string[]> = {};
  for (const f of found.values()) {
    const sk = SKILL_BY_ID.get(f.id); if (!sk || sk.cat === 'cert') continue;
    (skills[sk.cat] ||= []).push(sk.label);
  }
  // keep literal software names the user wrote (e.g. "PIPENET") that the taxonomy may not label
  const skillLines = grab('skills').join(', ').split(/[,•|/]|\s{2,}/).map((x) => x.trim()).filter((x) => x && x.length < 30);
  const extra = skillLines.filter((x) => !findSkills(x).size && /^[A-Za-z][\w .+#-]{1,25}$/.test(x));
  if (extra.length) skills.other = [...new Set(extra)].slice(0, 12);

  return { name, headline, email, phone, linkedin, location, summary, experience, education, certifications, skills, languages, removed };
}

/* ---------------- rebuilding ---------------- */
const CAT_LABEL: Record<string, string> = { civil: 'Civil Works', structural: 'Structural Design', survey: 'Surveying & GIS', arch: 'Architecture & Interior', electrical: 'Electrical', mech: 'Mechanical & Manufacturing', process: 'Process Engineering', petroleum: 'Petroleum', automation: 'Automation & Control', it: 'Software & IT', telecom: 'Telecom & Electronics', biomed: 'Biomedical', cert: 'Certifications', learned: 'Other Skills', design: 'HVAC Design', systems: 'HVAC Systems', fire: 'Fire Protection', plumbing: 'Plumbing', software: 'Software', codes: 'Codes & Standards', execution: 'Execution & BIM', office: 'Technical Office', commercial: 'Commercial', management: 'Management', other: 'Other Tools' };

export function buildSummary(m: CvModel, years: number, roleId: string, level: Level, market: Market) {
  const role = ROLES.find((r) => r.id === roleId);
  const title = m.headline || role?.en || 'Engineer';
  const yrs = years >= 1 ? `${Math.floor(years)}+ years` : 'early-career';
  const topSkills = Object.entries(m.skills).filter(([c]) => c !== 'other' && c !== 'software').flatMap(([, v]) => v).slice(0, 4);
  const tools = (m.skills.software || []).slice(0, 4);
  const sectors = [...new Set((m.experience.flatMap((e) => e.bullets).join(' ').match(/\b(hospitals?|healthcare|airports?|hotels?|residential|commercial|towers?|malls?|data cent(?:er|re)s?|industrial|infrastructure|universit(?:y|ies)|schools?|villas?|mixed-use)\b/gi) || []).map((x) => x.toLowerCase()))].slice(0, 3);
  const countries = [...new Set((m.experience.map((e) => e.location).join(' ') + ' ' + m.location).match(/\b(Egypt|KSA|Saudi Arabia|UAE|Qatar|Oman|Kuwait|Bahrain)\b/gi) || [])].slice(0, 3);
  const sing = (w: string) => w.replace(/^hospitals$/, 'hospital').replace(/^airports$/, 'airport').replace(/^hotels$/, 'hotel').replace(/^towers$/, 'tower').replace(/^malls$/, 'mall').replace(/^schools$/, 'school').replace(/^villas$/, 'villa').replace(/^universities$/, 'university').replace(/^data centres$|^data centers$/, 'data centre');
  const sec = [...new Set(sectors.map(sing))];
  const list = (a: string[]) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const lc = (x: string) => x.replace(/^Cooling\/heating load calculation$/, 'cooling and heating load calculations').replace(/^Duct design & sizing$/, 'duct design and sizing').replace(/^Equipment selection$/, 'equipment selection').replace(/^Static pressure \/ fan calculations$/, 'static pressure and fan calculations').replace(/^Chilled-water systems$/, 'chilled-water systems').replace(/^Clash detection & coordination$/, 'clash detection and coordination').replace(/^Revit \/ Revit MEP$/, 'Revit MEP').replace(/^Carrier HAP \/ TRACE$/, 'Carrier HAP').replace(/^([A-Z][a-z])/, (m) => m.toLowerCase()).replace(/^(hvac|mep|bim|ahu|fcu|vrf|boq|nfpa|ashrae|smacna|ipc|upc|cmms|bms|cfd|iso|sbc|leed|pmp)/i, (m) => m.toUpperCase());
  const where = `${sec.length ? ` on ${list(sec)} projects` : ''}${countries.length ? ` in ${list(countries)}` : ''}`;
  const s1 = years >= 1 ? `${title} with ${yrs} of experience${where}.` : `Early-career ${title}${where ? ` with experience${where}` : ''}.`;
  const s2 = topSkills.length ? `Hands-on experience in ${list(topSkills.map(lc))}${tools.length ? `, working with ${list(tools.map(lc).map((x) => x.replace(/^([a-z])/, (c) => c.toUpperCase())))}` : ''}.` : tools.length ? `Proficient in ${list(tools)}.` : '';
  // Never claim what the CV doesn't say: leadership only when the bullets show it, otherwise a neutral focus line.
  const bulletsText = m.experience.flatMap((e) => e.bullets).join(' ');
  const leads = /\b(?:led|lead|leading|mentor(?:ed|ing)?|supervis(?:ed|ing|ion of)|manag(?:ed|ing))\b[^.]{0,60}\b(?:engineers?|team|teams|technicians|foremen|draftsmen|staff|crew)\b/i.test(bulletsText);
  const s3 = leads
    ? 'Experienced in leading and supervising engineering teams.'
    : role?.disc === 'it' ? 'Focused on clean code, testing and on-time delivery.'
    : role?.disc === 'mep' ? 'Focused on coordinated, code-compliant work delivered on schedule.'
    : 'Focused on quality, coordination and on-time delivery.';
  // keep the candidate's own quantified achievement from the old summary (numbers are what recruiters scan for)
  const own = m.summary.join(' ').split(/(?<=[.!])\s+/).find((x) => /\d[\d,.]*\s*(?:%|million|billion|bn|mn|engineers|projects?|buildings?|towers|users|sites|wells|km|mw|kv|tr\b|sar|egp|aed|usd)|(?:sar|egp|aed|usd|\$)\s*\d/i.test(x) && x.length < 220);
  const s4 = own ? own.trim().replace(/([^.!])$/, '$1.') : '';
  return [s1, s2, s4, s3].filter(Boolean).join(' ');
}

/** plain-text version (what an ATS will parse) */
export function toText(m: CvModel, summary: string) {
  const L: string[] = [];
  L.push(m.name.toUpperCase());
  if (m.headline) L.push(m.headline);
  L.push([m.location, m.phone, m.email, m.linkedin].filter(Boolean).join(' | '));
  L.push('', 'PROFESSIONAL SUMMARY', summary);
  const cats = Object.keys(m.skills);
  if (cats.length) { L.push('', 'CORE SKILLS'); for (const c of cats) L.push(`${CAT_LABEL[c] || c}: ${m.skills[c].join(', ')}`); }
  if (m.experience.length) {
    L.push('', 'PROFESSIONAL EXPERIENCE');
    for (const e of m.experience) {
      L.push('', `${e.title}${e.company ? ' – ' + e.company : ''}${e.location ? ', ' + e.location : ''}`, e.dates);
      for (const b of e.bullets) L.push(`• ${b}`);
    }
  }
  if (m.projects?.length) {
    L.push('', 'ACADEMIC PROJECTS & TRAINING');
    for (const e of m.projects) {
      L.push('', `${e.title}${e.company ? ' – ' + e.company : ''}${e.location ? ', ' + e.location : ''}`, e.dates);
      for (const b of e.bullets) L.push(`• ${b}`);
    }
  }
  if (m.education.length) L.push('', 'EDUCATION', ...m.education);
  if (m.certifications.length) L.push('', 'CERTIFICATIONS & TRAINING', ...m.certifications.map((c) => `• ${c}`));
  if (m.languages.length) L.push('', 'LANGUAGES', m.languages.join(' | '));
  return L.join('\n');
}

export type RebuildReport = { changes: string[]; removed: string[]; weakBullets: number; entries: number; pairs: { before: string; after: string }[] };

/* ---------------- Arabic CVs → an English, ATS-readable CV ---------------- */
const AR = /[\u0600-\u06FF]/;
const DEGREE: [RegExp, string][] = [
  [/بكالوري?وس\s+(?:ال)?هندس[ةه]\s+(?:ال)?ميكاني?ك[اي]?/, 'B.Sc. Mechanical Engineering'], [/بكالوري?وس\s+(?:ال)?هندس[ةه]\s+(?:ال)?كهرب(?:اء|ا|ائي[ةه]?)/, 'B.Sc. Electrical Engineering'],
  [/بكالوري?وس\s+(?:ال)?هندس[ةه]\s+(?:ال)?مدني[ةه]?/, 'B.Sc. Civil Engineering'], [/بكالوري?وس\s+(?:ال)?هندس[ةه]\s+(?:ال)?معماري[ةه]?|(?:ال)?عمار[ةه]/, 'B.Sc. Architecture'],
  [/بكالوري?وس\s+(?:ال)?هندس[ةه]\s+(?:ال)?(?:قوى|قوي)\s+(?:ال)?ميكاني?كي[ةه]?/, 'B.Sc. Mechanical Power Engineering'], [/بكالوري?وس\s+(?:ال)?هندس[ةه]/, 'B.Sc. Engineering'],
  [/ماجستير/, 'M.Sc.'], [/دبلوم/, 'Diploma'], [/بكالوري?وس/, "Bachelor's degree"]
];
const LANG: [RegExp, string][] = [[/العربي[ةه]?/, 'Arabic'], [/الانجليزي[ةه]?|الإنجليزي[ةه]?/, 'English'], [/الفرنسي[ةه]?/, 'French'], [/الالماني[ةه]?|الألماني[ةه]?/, 'German']];
const LEVEL_W: [RegExp, string][] = [[/(?:اللغ[ةه]\s+)?الام|الأم|اللغة الأم/, 'Native'], [/ممتاز/, 'Excellent'], [/جيد\s+جدا/, 'Very good'], [/جيد/, 'Good'], [/متوسط/, 'Intermediate'], [/مبتدئ/, 'Basic']];
const val = (h: { value: string }, raw: string) => (h.value && !AR.test(h.value) ? h.value : raw);
function enLine(x: string) {
  if (!AR.test(x)) return x;
  const t = arabicToEnglish(x).text.replace(/\b(systems)\s+(Chilled Water|VRF|VRV|DX)\b/i, '$1 ($2)');
  return AR.test(t) ? t.replace(/[\u0600-\u06FF]+/g, '').replace(/\s+/g, ' ').trim() : t;
}
function enEducation(x: string) {
  if (!AR.test(x)) return x;
  const deg = DEGREE.find(([re]) => re.test(x))?.[1] || '';
  const year = x.match(/(19|20)\d{2}/)?.[0] || '';
  const uni = x.match(/(?:جامع[ةه]|كلي[ةه]|معهد|اكاديمي[ةه]|أكاديمي[ةه])\s*[^–\-|,،\d]+/)?.[0]?.trim() || '';
  const school = uni ? val(suggestCompany(uni), '') : '';
  return [deg, school, year].filter(Boolean).join(' – ') || enLine(x);
}
function enLanguage(x: string) {
  if (!AR.test(x)) return x;
  return x.split(/\s*[|،,\n]\s*/).map((p) => {
    const l = LANG.find(([re]) => re.test(p))?.[1]; if (!l) return '';
    const lv = LEVEL_W.find(([re]) => re.test(p))?.[1];
    return lv ? `${l} (${lv})` : l;
  }).filter(Boolean).join('  |  ');
}
export function englishize(m: CvModel): CvModel {
  const n: CvModel = { ...m };
  if (AR.test(n.name)) n.name = transliterate(n.name);
  if (AR.test(n.headline)) n.headline = val(suggestTitle(n.headline), '');
  if (AR.test(n.location)) n.location = val(suggestCity(n.location), '');
  n.summary = n.summary.filter((x) => !AR.test(x));
  n.experience = n.experience.map((e) => ({
    ...e,
    title: AR.test(e.title) ? val(suggestTitle(e.title), e.title) : e.title,
    company: AR.test(e.company) ? val(suggestCompany(e.company), e.company) : e.company,
    location: AR.test(e.location) ? val(suggestCity(e.location), '') : e.location,
    bullets: e.bullets.map((b) => (AR.test(b) ? polishBullet(enLine(b)) : b)).filter((b) => b && b.length > 3)
  }));
  n.education = n.education.map(enEducation).filter(Boolean);
  n.certifications = n.certifications.map(enLine).filter(Boolean);
  n.languages = n.languages.map(enLanguage).filter(Boolean);
  return n;
}

export function rebuildCv(text: string, market: Market, roleId: string, years: number, level: Level) {
  const m = englishize(parseCv(text));
  const summary = buildSummary(m, years, roleId, level, market);
  const changes: string[] = [];
  changes.push('headings');
  if (m.summary.length === 0) changes.push('summary_added'); else changes.push('summary_rewritten');
  const weak = m.experience.reduce((n, e) => n + e.bullets.filter((b) => /^(Managed|Led|Delivered|Served as|Supported|Contributed to|Performed|Prepared|Coordinated with|Tracked)\b/.test(b)).length, 0);
  if (weak) changes.push('bullets');
  if (Object.keys(m.skills).length) changes.push('skills_grouped');
  if (m.removed.length) changes.push('personal_removed');
  changes.push('dates');
  // concrete before → after examples (bullets whose opening actually changed)
  const pairs: { before: string; after: string }[] = [];
  const norm = (x: string) => x.replace(/[.\s]+$/, '').toLowerCase();
  for (const e of m.experience) {
    e.orig?.forEach((o: string, i: number) => {
      const a = e.bullets[i];
      if (a && pairs.length < 3 && norm(o) !== norm(a) && norm(o).split(' ')[0] !== norm(a).split(' ')[0]) pairs.push({ before: o, after: a });
    });
  }
  const report: RebuildReport = { changes, removed: m.removed, weakBullets: weak, entries: m.experience.length, pairs };
  return { model: m, summary, text: toText(m, summary), report };
}
