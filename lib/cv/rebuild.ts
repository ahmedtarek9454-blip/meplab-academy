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
import { analyzeCv } from './analyze';
import { suggestTitle, suggestCompany, suggestCity, transliterate } from './names';

export type Entry = { title: string; company: string; location: string; dates: string; start: number; end: number; bullets: string[]; orig?: string[]; notes: string[] };
export type CvModel = {
  name: string; headline: string; email: string; phone: string; linkedin: string; location: string;
  summary: string[]; experience: Entry[]; education: string[]; certifications: string[]; skills: Record<string, string[]>; languages: string[];
  removed: string[]; // personal-data lines dropped for ATS hygiene
  projects?: Entry[]; // academic projects & training (CV builder, fresh graduates)
  keyProjects?: string[]; // the person's own "Projects" section, kept as written
  additional?: string[]; // anything else worth keeping that has no standard section
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
const PERSONAL = /^(date of birth|dob|birth date|birthday|age|marital status|married|single|religion|nationality|gender|sex|military status|national id|passport|driving licen|visa|iqama|residency|الحالة الاجتماعية|الديانة|تاريخ الميلاد|الجنسية|النوع|موقف التجنيد|رقم قومي)\b/i;

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
  [/^(follow(?:ing)?[\s-]*up|followed up)\s+(on|with|of)?\s*(the\s+)?/i, 'Tracked '],
  [/^preparing\s+/i, 'Prepared '], [/^designing\s+/i, 'Designed '], [/^reviewing\s+/i, 'Reviewed '], [/^coordinating\s+/i, 'Coordinated '],
  [/^supervising\s+/i, 'Supervised '], [/^managing\s+/i, 'Managed '], [/^leading\s+/i, 'Led '], [/^performing\s+/i, 'Performed '],
  [/^conducting\s+/i, 'Conducted '], [/^developing\s+/i, 'Developed '], [/^creating\s+/i, 'Created '], [/^modeling\s+|^modelling\s+/i, 'Modelled '],
  [/^calculating\s+/i, 'Calculated '], [/^selecting\s+/i, 'Selected '], [/^attending\s+/i, 'Attended '], [/^issuing\s+/i, 'Issued '],
  [/^producing\s+/i, 'Produced '], [/^supporting\s+/i, 'Supported '], [/^ensuring\s+/i, 'Ensured '], [/^checking\s+/i, 'Checked '],
  [/^monitoring\s+/i, 'Monitored '], [/^updating\s+/i, 'Updated '], [/^running\s+/i, 'Ran '], [/^resolving\s+/i, 'Resolved ']
];

const clean = (s: string) => s.replace(/^[\s•\-–—*▪●○◦>]+/, '').replace(/\s+/g, ' ').trim();
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const IRREG: Record<string, string> = { sell: 'Sold', buy: 'Bought', use: 'Used', run: 'Ran', lead: 'Led', build: 'Built', do: 'Did', make: 'Made', write: 'Wrote', draw: 'Drew', take: 'Took', give: 'Gave', set: 'Set', cut: 'Cut', oversee: 'Oversaw', drive: 'Drove', teach: 'Taught', win: 'Won', hold: 'Held', keep: 'Kept', meet: 'Met', send: 'Sent' };
function pastOf(v: string) {
  const w = v.toLowerCase();
  if (/ed$/.test(w) || Object.values(IRREG).some((x) => x.toLowerCase() === w)) return w[0].toUpperCase() + w.slice(1);
  if (IRREG[w]) return IRREG[w];
  const p = /e$/.test(w) ? w + 'd' : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ied' : /^(plan|ship|stop|drop|map)$/.test(w) ? w + w.slice(-1) + 'ed' : w + 'ed';
  return p[0].toUpperCase() + p.slice(1);
}
/** a long paragraph written as one block becomes separate CV lines ("… and I review …" → "Reviewed …") */
export function splitParagraph(raw: string): string[] {
  const x = clean(raw);
  if (x.length < 140) return [x];
  const COMMON = 'perform|select|prepare|coordinate|review|design|calculate|supervise|follow|manage|check|size|model|draft|install|test|commission|attend|issue|submit|estimate|lead|handle|support|update|monitor|inspect|approve|train|run|build|draw|write|create|develop|track';
  return x.split(/(?<=[.;])\s+(?=[A-Z])|,?\s+(?:and\s+)?(?=(?:I|we)\s+also\s)|,?\s+and\s+(?=I\s)|\s+where\s+(?=I\s)|;\s+/)
    .map((p) => p.trim().replace(/^(?:I|we)\s+(?:also\s+)?([a-z]+)\b/i, (_m, v) => (/^(am|was|were|have|had)$/i.test(v) ? v : pastOf(v)))
      .replace(new RegExp(`\\b(and|,)\\s+(${COMMON})\\b`, 'gi'), (_m, j, v) => `${j} ${pastOf(v).toLowerCase()}`).trim())
    .filter((p) => p.length > 12);
}

const NOUN_VERB: [RegExp, string][] = [
  [/testing\s+(?:and|&)\s+commissioning/i, 'Tested and commissioned'], [/design/i, 'Designed'], [/calculations?/i, 'Calculated'], [/selection/i, 'Selected'],
  [/sizing/i, 'Sized'], [/supervision/i, 'Supervised'], [/installation/i, 'Installed'], [/execution/i, 'Executed'], [/coordination/i, 'Coordinated'],
  [/review/i, 'Reviewed'], [/modell?ing/i, 'Modelled'], [/drafting/i, 'Drafted'], [/pricing/i, 'Priced'], [/preparation/i, 'Prepared'],
  [/inspection/i, 'Inspected'], [/commissioning/i, 'Commissioned'], [/estimation/i, 'Estimated'], [/tracking/i, 'Tracked'], [/follow[\s-]*up/i, 'Tracked']
];
const BASE_VERBS = 'control|lead|prepare|calculate|coordinate|track|sell|visit|collect|fill|participate|perform|follow|manage|support|attend|issue|submit|review|update|design|supervise|check|select|size|model|draft|install|test|commission|inspect|approve|train|lead|handle|monitor|estimate|price|measure|maintain|operate|assist|develop|create|build|run|respond|upload|obtain|ensure|conduct|deliver|implement|organize|organise|plan|schedule|negotiate|present|propose|resolve|liaise|communicate|achieve|reduce|increase|improve|produce|execute|study|analyse|analyze|evaluate|verify|witness|receive|issue|raise|close|follow-up';
/** "Design of …", "Heat load calculation for …", "Prepare …" → a past-tense action verb first */
function actionFirst(b: string) {
  let x = b.replace(/^(?:occasionally|also|daily|weekly|regularly|mainly|actively|directly)\s+/i, '').replace(/^am\s+/i, '');
  const first = x.match(/^([a-z]+)\b/i)?.[1] || '';
  if (/^using$/i.test(first)) return 'Used' + x.slice(first.length);
  if (new RegExp(`^(${BASE_VERBS})$`, 'i').test(first) && !/^\w+\s+(of|for)\b/i.test(x)) return pastOf(first) + x.slice(first.length);
  // a noun phrase whose head is an action noun within the first few words
  const m = x.match(/^((?:[\w/&+().'-]+\s+){0,4}?)(testing\s+(?:and|&)\s+commissioning|design|calculations?|selection|sizing|supervision|installation|execution|coordination|review|modell?ing|drafting|pricing|preparation|inspection|commissioning|estimation|tracking|follow[\s-]*up)\b(?:\s+(of|for|on))?\s*(.*)$/i);
  const pastFirst = /^[a-z]+ed\b/i.test(x) || new RegExp(`^(${Object.values(IRREG).join('|')})\\b`, 'i').test(x);
  if (m && !pastFirst && !/^(as|i|we|the)\b/i.test(x)) {
    const verb = NOUN_VERB.find(([re]) => re.test(m[2]))![1];
    const pre = m[1].trim().replace(/^(the|a|an)\s+/i, '');
    const prep = m[3] ? ` ${m[3]} ` : ' ';
    const rest = m[4] || '';
    // "Design of X" → "Designed X"; "Heat load calculation for X" → "Calculated heat load for X"
    const joinRest = (r: string) => (/^[,;:)]/.test(r) ? r : ' ' + r);
    const out = /^(site|on-site|field)$/i.test(pre) ? `${verb} ${rest} on site`
      : pre ? `${verb} ${pre[0].toLowerCase() + pre.slice(1)}${rest ? (m[3] ? prep + rest : joinRest(rest)) : ''}` : `${verb} ${rest}`;
    return out.replace(/\s+/g, ' ').replace(/\s+([,;:])/g, '$1').trim();
  }
  // documents the person produced: "Quantity take-off of …", "Monthly payment applications …" → "Prepared …"
  if (!pastFirst && /^((?:[\w/&+()-]+\s+){0,3})(take-?offs?|boqs?|submissions?|submittals?|reports?|applications?|valuations?|drawings?|offers?|quotations?)\b/i.test(x) && !/^(as|i|we)\b/i.test(x))
    return 'Prepared ' + x[0].toLowerCase() + x.slice(1);
  return x;
}

export function polishBullet(raw: string) {
  let b = clean(raw).replace(/\.+$/, '').replace(/\s+,/g, ',');
  if (!b) return '';
  for (const [re, rep] of WEAK_START) { if (re.test(b)) { b = rep + b.replace(re, ''); break; } }
  b = b.replace(/\b(i|we)\s+(am|was|were|have|had)\b\s*/gi, '').replace(/^\s*(and|also|then)\s+/i, '');
  if (!WEAK_START.some(([re]) => re.test(clean(raw)))) b = actionFirst(b);
  // keep the tense consistent inside the line: "Prepared X and monitor Y; prepare Z" → past throughout
  if (/^[A-Z][a-z]+ed\b|^(Led|Built|Ran|Drew|Wrote|Sold|Made|Held|Kept|Met|Sent|Oversaw|Cut|Set)\b/.test(b))
    b = b.replace(new RegExp(`(\\band|;|,)\\s+(${BASE_VERBS})\\b(?!\\s+(?:of|for)\\b)`, 'gi'), (_m, j, v) => `${j} ${pastOf(v).toLowerCase()}`);
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
  let parts = joined.split(/\s*[|–—]\s*|\s+-\s+|\s+at\s+|\s+@\s+/i).map((x) => x.trim()).filter(Boolean);
  // "Title, Company, City" on one line
  if (parts.length === 1 && parts[0].split(/\s*,\s*/).length >= 2 && /(engineer|coordinator|manager|modell?er|designer|estimator|supervisor|specialist|technician|draftsman|مهندس)/i.test(parts[0].split(',')[0])) parts = parts[0].split(/\s*,\s*/);
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
  if (name && Object.values(HEAD).some((r) => r.test(name.toLowerCase()))) name = '';
  // OCR often drops the big name line; fall back to the email ("mahmoud.adel@…" → "Mahmoud Adel")
  if (!name && email) { const parts = email.split('@')[0].replace(/\d+/g, '').split(/[._-]+/).filter((x) => x.length > 1); if (parts.length >= 2 && parts.length <= 4) name = parts.map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(' '); }
  if (!name) name = (top[0] || '').split(/\s*[–—|,]\s*/)[0].split(/\s+/).slice(0, 4).join(' ') || 'YOUR NAME';
  const labelledPos = t.match(/^\s*(?:position|title|job title|المسمى الوظيفي)\s*[:：]\s*(.+)$/im)?.[1]?.trim();
  const headline = labelledPos || (firstParts.length > 1 ? firstParts.find((x) => /engineer|coordinator|manager|مهندس/i.test(x)) : '') || top.find((l) => l !== name && /engineer|coordinator|manager|modeler|modeller|estimator|designer|specialist|مهندس|مدير|منسق/i.test(l) && l.length < 80 && !/[:：]/.test(l)) || '';
  // location: any segment of the first lines that names a city or country ("Contact: … | 6th of October City, Giza")
  const PLACE = /\b(cairo|new cairo|nasr city|maadi|heliopolis|giza|6th of october|october city|sheikh zayed|alexandria|mansoura|tanta|zagazig|ismailia|suez|port said|hurghada|aswan|luxor|asyut|assiut|minya|sohag|beni suef|fayoum|damietta|riyadh|jeddah|dammam|khobar|al khobar|jubail|yanbu|makkah|mecca|madinah|medina|tabuk|abha|neom|dubai|abu dhabi|sharjah|ajman|doha|muscat|kuwait|manama|amman|egypt|ksa|saudi arabia|uae|qatar|oman|bahrain|jordan)\b|القاهرة|الجيزة|الإسكندرية|الاسكندرية|الرياض|جدة|الدمام|دبي|أبوظبي|مصر|السعودية/i;
  const location = lines.slice(0, 10).map(clean).flatMap((l) => l.split(/\s*[|•·]\s*/))
    .map((x) => x.replace(/^(contact|address|location|العنوان|المدينة)\s*[:：]\s*/i, '').trim())
    .find((x) => PLACE.test(x) && x.length < 60 && !/@|\d{6,}|linkedin|http/i.test(x) && !/(engineer|manager|مهندس)/i.test(x)) || '';

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
    const dateLineRest = clean(lines[li].replace(r.raw || '', '').replace(/\(\s*(?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2}[^)]*\)/g, '')).replace(/[(\[]\s*[)\]]/g, '').replace(/^[|–\-,:\s]+|[|–\-,:\s]+$/g, '');
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
      // only lines that read like a job header (title / company) move to the next entry; content lines stay here
      if (!/(engineer|coordinator|manager|modell?er|designer|estimator|supervisor|specialist|technician|draftsman|director|intern|trainee|lead|head|officer|company|co\.|consult|contract|group|ltd|llc|inc|holding|مهندس|مدير|منسق|مشرف|رسام|فني|شركة|مكتب|مجموعة)/i.test(x) && !/\s[|–—-]\s/.test(x)) break;
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
      // short lines under an entry that read like content are bullets too; never drop the person's words
      bullets: [...bullets, ...notes.filter((x) => x.length > 25)].flatMap(splitParagraph).map(polishBullet).filter(Boolean).slice(0, 12), orig: [...bullets, ...notes.filter((x) => x.length > 25)].flatMap(splitParagraph).filter(Boolean).slice(0, 12), notes
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

  // experience lines the entry parser didn't place (no dates nearby, odd layout): attach them to the entry above,
  // or keep them as one entry when no dated entry was found, so nothing the person wrote is lost
  const orphan = lines.map((l, i) => [clean(l), i] as const).filter(([l, i]) => sec[i] === 'experience' && l.length > 25 && !headingLine(i) && !used.has(i) && !PERSONAL.test(l));
  if (orphan.length) {
    if (!experience.length) {
      experience.push({ title: headline || '', company: '', location: '', dates: '', start: 0, end: 0, bullets: orphan.map(([l]) => polishBullet(l)).filter(Boolean).slice(0, 12), orig: orphan.map(([l]) => l), notes: [] });
    } else {
      const byLine = work.map((r, idx) => ({ li: r.lineIdx!, e: experience.find((x) => x.start === r.start && x.end === r.end) })).filter((x) => x.e);
      for (const [l, i] of orphan) {
        const owner = [...byLine].reverse().find((x) => x.li < i)?.e || experience[experience.length - 1];
        if (owner.bullets.length < 12 && !owner.orig?.includes(l)) { owner.bullets.push(polishBullet(l)); owner.orig?.push(l); }
      }
    }
  }
  // a degree line that ended up among the experience bullets belongs in Education
  const DEG = /^(b\.?\s?sc|bsc|b\.?\s?eng|bachelor|m\.?\s?sc|msc|master|diploma\s+(?:in|of))\b.*(universit|institute|faculty|college|academy|\b(19|20)\d{2}\b)/i;
  const DEG_BARE = /^(b\.?\s?sc|bsc|b\.?\s?eng|bachelor|m\.?\s?sc|msc|master)\.?(?:'s)?\s+(?:of\s+|in\s+)?[\w ()&-]*(engineering|architecture|science)\.?$/i;
  const UNI = /(universit|institute|faculty|college|academy|جامع)/i;
  // a degree split over two lines ("B.Sc. Mechanical Engineering" / "Pharos University …, 2016 – 2021")
  const degreeAt = (i: number) => {
    const l = clean(lines[i] || '');
    if (DEG.test(l)) return l;
    if (!DEG_BARE.test(l)) return '';
    for (let k = i + 1; k < Math.min(lines.length, i + 4); k++) { const n = clean(lines[k]); if (!n) continue; if (UNI.test(n)) return `${l.replace(/\.$/, '')} – ${n}`; }
    for (let k = i - 1; k >= Math.max(0, i - 3); k--) { const n = clean(lines[k]); if (!n) continue; if (UNI.test(n)) return `${l.replace(/\.$/, '')} – ${n}`; }
    return l;
  };
  for (const e of experience) {
    const keep: string[] = [], keepO: string[] = [];
    e.bullets.forEach((b, i) => {
      const o = e.orig?.[i] ?? b;
      if (DEG.test(o) || DEG_BARE.test(o) || (UNI.test(o) && /\b(19|20)\d{2}\b/.test(o) && o.length < 90 && !/\b(project|hospital|campus|building)\b/i.test(o))) {
        const idx = lines.findIndex((l) => clean(l) === clean(o));
        const d = idx >= 0 ? degreeAt(idx) : o;
        if (d && !education.some((x) => x.includes(clean(o)) || clean(o).includes(x))) education.push(d.replace(/\.$/, ''));
      } else { keep.push(b); keepO.push(o); }
    });
    e.bullets = keep; e.orig = keepO;
  }
  // no Education section at all: take the degree from wherever the CV mentions it (summary paragraph, header line)
  if (!education.length) {
    const i = lines.findIndex((l) => (DEG.test(clean(l)) || DEG_BARE.test(clean(l))) && clean(l).length < 140);
    const line = i >= 0 ? degreeAt(i) : '';
    if (line) education.push(line.replace(/\.$/, ''));
    else {
      const uni = t.match(/\b((?:[A-Z][\w'-]+\s+){1,4}University(?:\s+(?:of|in)\s+[A-Z][\w-]+)?|University\s+of\s+[A-Z][\w-]+(?:\s+[A-Z][\w-]+)?)\b/);
      if (uni && /graduat|degree|bachelor|b\.?sc/i.test(t)) {
        const near = t.slice(Math.max(0, (uni.index || 0) - 120), (uni.index || 0) + 160);
        const year = near.match(/\b(19[89]\d|20[0-4]\d)\b/)?.[0] || '';
        const deg = near.match(/\b(B\.?\s?Sc\.?|Bachelor(?:'s)?(?:\s+(?:of|in)\s+[A-Z][\w ]+?Engineering)?)\b/)?.[0] || '';
        const field = near.match(/\(([A-Z][\w ]{3,30})\)/)?.[1] || near.match(/\b(mechanical|electrical|civil|architectural)\s+(?:power\s+)?engineer/i)?.[0] || '';
        const degree = deg || (field ? `B.Sc. ${field.replace(/\s+engineer$/i, '').replace(/^\w/, (c) => c.toUpperCase())} Engineering` : "Bachelor's degree");
        education.push([degree.replace(/\s+Engineering\s+Engineering/, ' Engineering'), uni[1].trim(), year].filter(Boolean).join(' – '));
      }
    }
  }
  const keyProjects = grab('projects').filter((l) => l.length > 3);
  const additional = grab('military').filter((l) => l.length > 3);
  return { name, headline, email, phone, linkedin, location, summary, experience, education, certifications, skills, languages, removed, keyProjects, additional };
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
  if (m.keyProjects?.length) L.push('', 'KEY PROJECTS', ...m.keyProjects.map((x) => `• ${x}`));
  if (m.education.length) L.push('', 'EDUCATION', ...m.education);
  if (m.certifications.length) L.push('', 'CERTIFICATIONS & TRAINING', ...m.certifications.map((c) => `• ${c}`));
  if (m.languages.length) L.push('', 'LANGUAGES', m.languages.join(' | '));
  if (m.additional?.length) L.push('', 'ADDITIONAL INFORMATION', ...m.additional);
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
const LANG: [RegExp, string][] = [[/(?:ال)?عربي/, 'Arabic'], [/(?:ال)?[اإأ]نجليزي|[اإ]نجلش|انكليزي/, 'English'], [/(?:ال)?فرنسي/, 'French'], [/(?:ال)?[اأ]لماني/, 'German'], [/(?:ال)?[اإ]يطالي/, 'Italian'], [/(?:ال)?[اإ]سباني/, 'Spanish']];
const LEVEL_W: [RegExp, string][] = [[/(?:اللغ[ةه]\s+)?الام|الأم|اللغة الأم/, 'Native'], [/ممتاز/, 'Excellent'], [/جيد\s+جدا/, 'Very good'], [/جيد/, 'Good'], [/متوسط/, 'Intermediate'], [/مبتدئ/, 'Basic']];
const val = (h: { value: string }, raw: string) => (h.value && !AR.test(h.value) ? h.value : raw);
export function enLine(x: string) {
  if (!AR.test(x)) return x;
  const t = arabicToEnglish(x).text.replace(/\b(systems)\s+(Chilled Water|VRF|VRV|DX)\b/i, '$1 ($2)');
  return AR.test(t) ? t.replace(/[\u0600-\u06FF]+/g, '').replace(/\s+/g, ' ').trim() : t;
}
export function enEducation(x: string) {
  if (!AR.test(x)) return x;
  const deg = DEGREE.find(([re]) => re.test(x))?.[1] || '';
  const year = x.match(/(19|20)\d{2}/)?.[0] || '';
  const uni = x.match(/(?:جامع[ةه]|كلي[ةه]|معهد|اكاديمي[ةه]|أكاديمي[ةه])\s*[^–\-|,،\d]+/)?.[0]?.trim() || '';
  const school = uni ? val(suggestCompany(uni), '') : '';
  return [deg, school, year].filter(Boolean).join(' – ') || enLine(x);
}
export function enLanguage(x: string) {
  if (!AR.test(x)) return x;
  return x.split(/\s*[|،,\n]\s*|\s+[-–]\s+/).map((p) => {
    const l = LANG.find(([re]) => re.test(p))?.[1]; if (!l) return '';
    const lv = LEVEL_W.find(([re]) => re.test(p))?.[1];
    return lv ? `${l} (${lv})` : l;
  }).filter(Boolean).join('  |  ');
}
export function englishize(m: CvModel): CvModel {
  const n: CvModel = { ...m };
  if (AR.test(n.name)) n.name = transliterate(n.name);
  if (AR.test(n.headline)) n.headline = val(suggestTitle(n.headline), '');
  if (AR.test(n.location)) n.location = val(suggestCity(n.location.split(/\s*[|•]\s*|\s+(?=\+?\d{6,})|\s+(?=\S+@)/)[0]), '');
  n.location = n.location.replace(/\s*\S+@\S+/g, '').replace(/,\s*Misr\b/i, '').trim();
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
  n.keyProjects = n.keyProjects?.map(enLine).filter(Boolean);
  n.additional = n.additional?.map(enLine).filter(Boolean);
  return n;
}

export function rebuildCv(text: string, market: Market, roleId: string, years: number, level: Level) {
  const m = englishize(parseCv(text));
  let summary = buildSummary(m, years, roleId, level, market);
  // the person's own summary often holds a hard fact ("managing MEP works for a 45-building community"): keep it
  const own = m.summary.join(' ').split(/(?<=[.!])\s+/).find((x) => /\d/.test(x) && !/[\u0600-\u06FF]/.test(x) && !/\b\d+\+?\s*years?\b/i.test(x) && x.length < 220);
  if (own && !summary.includes(own)) summary = `${summary} ${own.replace(/^(currently|now)\s+/i, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())}`.replace(/\s+/g, ' ').trim();
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
  // pick the strongest honest version: if the polished rebuild scores below the original, try keeping the
  // person's own bullet wording; the caller still refuses anything that scores below the original
  let best = { model: m, text: toText(m, summary) };
  try {
    const before = analyzeCv(text, market).score;
    let score = analyzeCv(best.text, market).score;
    if (score < before) {
      const m2: CvModel = { ...m, experience: m.experience.map((e) => ({ ...e, bullets: (e.orig?.length ? e.orig : e.bullets).map((b) => (/[.!]$/.test(b) ? b : b + '.')) })) };
      const t2 = toText(m2, summary); const s2 = analyzeCv(t2, market).score;
      if (s2 > score) { best = { model: m2, text: t2 }; score = s2; }
    }
  } catch { /* scoring is a safety net only */ }
  return { model: best.model, summary, text: best.text, report };
}
