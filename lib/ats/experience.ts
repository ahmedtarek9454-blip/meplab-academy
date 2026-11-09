/**
 * =====================================================================
 *  MEP LAB ATS — experience extraction
 *  Finds every date range in a CV, decides whether each one is real work
 *  (vs education, military service, training, career gaps), merges
 *  overlaps, and returns total years + the ranges used (for transparency).
 * =====================================================================
 */

export type Range = { start: number; end: number; kind: 'work' | 'education' | 'military' | 'training' | 'gap' | 'other'; line: string; lineIdx?: number; raw?: string };

const EN_MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
const AR_MONTHS: [RegExp, number][] = [
  [/يناير|كانون الثاني/, 0], [/فبراير|شباط/, 1], [/مارس|آذار/, 2], [/[اأإ]بريل|نيسان/, 3], [/مايو|أيار|ايار/, 4], [/يونيو|يونيه|حزيران/, 5],
  [/يوليو|يوليه|تموز/, 6], [/[اأ]غسطس|آب/, 7], [/سبتمبر|أيلول|ايلول/, 8], [/[اأ]كتوبر|تشرين الأول/, 9], [/نوفمبر|تشرين الثاني/, 10], [/ديسمبر|كانون الأول/, 11]
];
const MON = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const ARMON = '(?:يناير|فبراير|مارس|[اأإ]بريل|مايو|يونيو|يونيه|يوليو|يوليه|[اأ]غسطس|سبتمبر|[اأ]كتوبر|نوفمبر|ديسمبر|كانون الثاني|شباط|آذار|نيسان|أيار|ايار|حزيران|تموز|آب|أيلول|ايلول|تشرين الأول|تشرين الثاني|كانون الأول)';
const YEAR = '((?:19|20)\\d{2})';
const SEP = '\\s*(?:-|–|—|to|till|until|through|thru|إلى|الى|حتى|لـ?غاية|-)\\s*';
const PRESENT = '(present|current|currently|now(?![a-z])|today(?![a-z])|till\\s*now|till\\s*date|to\\s*date|up\\s*to\\s*date|(?<=to\\s{0,3})date(?![a-z\\s]*(?:of\\s+birth|birth))|ongoing|continuing|حتى الآن|الآن|حاليا|حالياً|حتى تاريخه|مستمر)';

/** month index from an English or Arabic month token */
function mon(tok?: string | null): number | null {
  if (!tok) return null;
  const t = tok.toLowerCase().replace(/\./g, '');
  for (const k in EN_MONTHS) if (t.startsWith(k)) return EN_MONTHS[k];
  for (const [re, i] of AR_MONTHS) if (re.test(tok)) return i;
  return null;
}
const toYear = (y: number, m: number | null, endOfPeriod = false) => y + ((m ?? (endOfPeriod ? 11 : 0)) + (endOfPeriod ? 1 : 0)) / 12;
const now = () => { const d = new Date(); return d.getFullYear() + (d.getMonth() + 1) / 12; };

/** build the list of range patterns (all case-insensitive, global) */
function patterns() {
  const P = (s: string) => new RegExp(s, 'giu');
  return [
    // Mar 2021 – Present | March 2018 to date | Sep. 2015 – Aug. 2018 | مارس 2020 – حتى الآن
    { re: P(`(${MON}|${ARMON})\\s*,?\\s*${YEAR}${SEP}(?:(${MON}|${ARMON})\\s*,?\\s*${YEAR}|${PRESENT})`), g: (m: RegExpExecArray) => ({ sm: mon(m[1]), sy: +m[2], em: mon(m[3]), ey: m[4] ? +m[4] : null, present: !!m[5] }) },
    // OCR-damaged end: "Jun 2018 - Feb 1" / "Jun 2018 - Feb" (year cut at page edge) → end resolved later
    { re: P(`(${MON})\\s*,?\\s*${YEAR}${SEP}(${MON})\\.?(?:\\s*\\d{1,3})?(?!\\s*\\d)(?=\\s*(?:$|\\n|[|,;)\\-–—]))`), g: (m: RegExpExecArray) => ({ sm: mon(m[1]), sy: +m[2], em: mon(m[3]), ey: -1, present: false }) },
    // 2021/06 – Present | 2019/03 – 2021/05
    { re: P(`${YEAR}[/.\\-](\\d{1,2})${SEP}(?:${YEAR}[/.\\-](\\d{1,2})|${PRESENT})`), g: (m: RegExpExecArray) => ({ sm: +m[2] - 1, sy: +m[1], em: m[4] ? +m[4] - 1 : null, ey: m[3] ? +m[3] : null, present: !!m[5] }) },
    // 01/03/2019 - 15/06/2021 | 01.03.2019 - Present (day/month/year)
    { re: P(`(?<![\\d/.])\\d{1,2}[/.](\\d{1,2})[/.]${YEAR}${SEP}(?:\\d{1,2}[/.](\\d{1,2})[/.]${YEAR}|${PRESENT})`), g: (m: RegExpExecArray) => ({ sm: +m[1] - 1, sy: +m[2], em: m[3] ? +m[3] - 1 : null, ey: m[4] ? +m[4] : null, present: !!m[5] }) },
    // 03/2019 - 05/2021 | 01.2020 - 12.2022 | 06/2021 - Present
    { re: P(`(\\d{1,2})[/.]${YEAR}${SEP}(?:(\\d{1,2})[/.]${YEAR}|${PRESENT})`), g: (m: RegExpExecArray) => ({ sm: +m[1] - 1, sy: +m[2], em: m[3] ? +m[3] - 1 : null, ey: m[4] ? +m[4] : null, present: !!m[5] }) },
    // 2016 – 2019 | 2017 – Till Now | 2016-2019
    { re: P(`(?<![\\d/.\\-+])${YEAR}${SEP}(?:${YEAR}|${PRESENT})(?![\\d/.])`), g: (m: RegExpExecArray) => ({ sm: null, sy: +m[1], em: null, ey: m[2] ? +m[2] : null, present: !!m[3] }), yearOnly: true },
    // since May 2020 | Since 2020 | منذ 2020 | from February 2018 to April 2020 (prose)
    { re: P(`(?:since|منذ|from|من)\\s+(?:(${MON}|${ARMON})\\s*,?\\s*)?${YEAR}(?:\\s*(?:to|until|till|إلى|الى|حتى)\\s*(?:(${MON}|${ARMON})\\s*,?\\s*)?(?:${YEAR}|${PRESENT}))?`), g: (m: RegExpExecArray) => ({ sm: mon(m[1]), sy: +m[2], em: mon(m[3]), ey: m[4] ? +m[4] : null, present: !m[4] }), prose: true },
    // joined X in March 2023 (prose, open-ended)
    { re: P(`(?:joined|started|hired|employed|working (?:at|with|for|as))\\b[^.\\n]{0,80}?\\b(?:in|since)\\s+(${MON})\\s*,?\\s*${YEAR}(?![^.\\n]{0,40}(?:to|until|till)\\s+(?:${MON}|${YEAR}|${PRESENT}))`), g: (m: RegExpExecArray) => ({ sm: mon(m[1]), sy: +m[2], em: null, ey: null, present: true }) }
  ];
}

const EDU = /(b\.?\s?sc|b\.?\s?eng|bachelor|بكالوريوس|m\.?\s?sc|master|ماجستير|phd|doctor|diploma|دبلوم|university|جامعة|faculty|كلية|college|institute|معهد|graduat|تخرج|degree|student|طالب|gpa|grade|تقدير|school|مدرسة|thesis|semester|academic|chapter|دفعة)/i;
const MIL = /(military\s+service|army|armed\s+forces|national\s+service|conscript|الخدمة العسكرية|الجيش|القوات المسلحة|التجنيد|جندي|خدمة عسكرية)/i;
const MIL_PLACE = /(military|عسكري)\s*(hospital|medical|city|complex|industries|base|academy|college|project|camp|مستشفى|مدينة|مجمع)/i;
const TRAIN = /(internship|\bintern\b|trainee|summer\s+training|summer\s+internship|training\s+program(?:me)?|industrial\s+training|تدريب صيفي|تدريب|متدرب|bootcamp|\bworkshops?\b(?!\s*(?:drawing|dwg))|volunteer|تطوع)/i;
const GAP = /(career\s+break|career\s+gap|\bgap\b|sabbatical|unemployed|job\s+seeking|\bfamily\s+(?:reasons|care|leave)|maternity|paternity|انقطاع|توقف|فترة راحة)/i;
const WORK_HINT = /(engineer|مهندس|coordinator|منسق|manager|مدير|supervisor|مشرف|specialist|lead|head|rئيس|رئيس|technician|فني|draftsman|رسام|estimator|modeler|modeller|designer|مصمم|consultant|استشاري|freelanc|contract|co\.|company|شركة|ltd|llc|inc\b|group|contracting|مقاولات|consultants|استشارات|projects?\b|works?\b|experience|خبر)/i;
const HEAD = { edu: /^(education|academic|qualification|التعليم|المؤهل|الدراس)/i, exp: /^(experience|employment|work\s+history|work\s+experience|career\s+history|professional\s+(experience|background|history)|الخبر|العمل|الوظائف)/i, mil: /^(military|الخدمة العسكرية|التجنيد)/i, train: /^(training|courses|internship|certif|التدريب|الدورات|الشهادات)/i, other: /^(skills|languages|personal|contact|summary|profile|objective|references|projects|awards|publications|المهارات|اللغات|البيانات|الملخص|نبذة|المشاريع|الهدف)/i };

/** classify the context around a match */
function classify(tight: string, wide: string, section: keyof typeof HEAD | null): Range['kind'] {
  const jobish = WORK_HINT.test(tight);
  const eduish = /(b\.?\s?sc|b\.?\s?eng|bachelor|بكالوريوس|m\.?\s?sc|\bmaster(?:'?s)?\b(?!\s*plan)|ماجستير|phd|diploma|دبلوم|university|جامعة|faculty|كلية|college|institute|معهد|graduat|تخرج|degree|student|طالب|دفعة|high school|secondary)/i.test(tight);
  if (GAP.test(tight) && !jobish) return 'gap';
  // military SERVICE, not a job on a "Military Hospital" project
  if (MIL.test(tight) && !(jobish && MIL_PLACE.test(tight))) return 'military';
  if (eduish) {
    // a degree line stays education unless the line clearly describes employment (not "Bachelor of Mechanical Engineer")
    const employed = /(worked|working|lecturer|teaching assistant|معيد|engineer\s+(?:at|with|for|in)\b|\b(?:co\.|company|contracting|consultants?|llc|ltd|inc)\b|شركة|مكتب|للمقاولات|للاستشارات)/i.test(tight);
    if (!employed) return 'education';
  }
  const trainish = TRAIN.test(tight) && !/(training\s+(?:engineer|manager|center|centre)|delivered|conducted|trained\s+(?:\d+|team|staff|junior)|supervised)/i.test(tight);
  if (trainish && (!jobish || /(intern|trainee|متدرب|summer)/i.test(tight))) return 'training';
  if (section === 'edu') return jobish ? 'work' : 'education';
  if (section === 'train') return jobish ? 'work' : 'training';
  if (section === 'other' && !jobish) return 'other';
  return 'work';
}

export function extractExperience(text: string): { years: number; ranges: Range[] } {
  const t = text.replace(/\r/g, '').replace(/[–—]/g, '-').replace(/ /g, ' ');
  const lines = t.split('\n');
  const NOW = now();

  // section tracking by line
  const sectionAt: (keyof typeof HEAD | null)[] = [];
  let cur: keyof typeof HEAD | null = null, lastExpAt = -99;
  lines.forEach((raw, i) => {
    const l = raw.trim().replace(/^[#*•\-\s]+/, '').replace(/[:：\-\s]+$/, '');
    if (l && l.length <= 45) {
      for (const k of Object.keys(HEAD) as (keyof typeof HEAD)[]) if (HEAD[k].test(l)) { cur = k; if (k === 'exp') lastExpAt = i; break; }
    }
    // two-column PDFs interleave sidebar headings (SKILLS, LANGUAGES) with the experience column
    sectionAt.push(cur === 'other' && i - lastExpAt <= 8 ? 'exp' : cur);
  });
  const lineStarts: number[] = []; let pos = 0;
  for (const l of lines) { lineStarts.push(pos); pos += l.length + 1; }
  const lineOf = (idx: number) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo; };

  const ranges: Range[] = [];
  const taken: [number, number][] = [];
  const CODE_BEFORE = /(nfpa|iso|sbc|ashrae|smacna|\bbs\b|\ben\b|din|astm|ul\b|tel|mob|mobile|phone|fax|whatsapp|\+?\d[\d\s\-]{3,}|page|no\.?|ref\.?|#)\s*[:\-]?\s*$/i;
  for (const pat of patterns()) {
    const { re, g } = pat as any;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      const a = m.index, b = a + m[0].length;
      if (taken.some(([x, y]) => a < y && b > x)) continue; // already matched by a more specific pattern
      if ((pat as any).yearOnly && CODE_BEFORE.test(t.slice(Math.max(0, a - 14), a))) continue; // "NFPA 2001-2019", "Tel: 010-2019-2021"
      if ((pat as any).prose && !m[4] && !/(since|منذ)/i.test(m[0]) ) {
        // "from 2018" with no end: accept only when the sentence clearly describes a job
        const sent = t.slice(Math.max(0, a - 120), Math.min(t.length, b + 120));
        if (!WORK_HINT.test(sent) || /(code|standard|edition|version|policy|rule)/i.test(sent)) continue;
      }
      const v = g(m);
      if (!v.sy || v.sy < 1960 || v.sy > NOW + 1) continue;
      let start = toYear(v.sy, v.sm);
      let end = v.present || v.ey === null ? NOW : v.ey === -1 ? -1 : toYear(v.ey!, v.em, v.em === null && v.sm === null ? true : v.em === null);
      if (v.ey !== null && v.ey !== -1 && v.ey < v.sy) continue;
      if (end !== -1) {
        if (end > NOW + 0.1) end = NOW;
        if (end - start > 45 || end < start) continue;
      }
      // year-only ranges: assume mid-year start, Dec end → "2016-2019" ≈ 3.5y, "2017 – Till Now" ≈ now-2017.5
      const li = lineOf(a);
      if (v.sm === null && /(certif|license|licence|membership|member|accredit|registered|pmp|leed|nebosh|cem\b|sce\b|syndicate|عضوية|شهادة|اعتماد)/i.test(lines[li]) && !WORK_HINT.test(lines[li].replace(/engineer/i, ''))) { ranges.push({ start: v.sy, end: v.ey ?? v.sy, kind: 'other', line: lines[li].trim().slice(0, 120), lineIdx: li, raw: m[0] }); taken.push([a, b]); continue; }
      if (v.sm === null) start = v.sy + 0.5;
      if (v.em === null && v.ey !== null) end = v.ey + 1;
      // context = the matched line plus the previous and next two lines (titles usually sit next to dates)
      // tight context = the date line + the line before (title/company usually sit there); wide = ±2 lines
      const bare = /^[\s\d\/.,\-–—a-z\u0600-\u06FF]*$/i.test(lines[li].replace(m[0], '')) && lines[li].replace(m[0], '').trim().length < 12;
      const SIDEBAR = /^(arabic|english|french|german|native|fluent|intermediate|basic|mother tongue|[a-z]+ - (?:native|fluent|good|intermediate|basic)|\+?\d[\d\s\-]{6,}|[\w.+-]+@[\w.-]+|linkedin\.com\S*|https?:\/\/\S+)\s*$/i;
      // walk upwards from the date line: take the nearest 1-2 meaningful lines (title / company), stop at blank lines or other date lines
      const ctx: string[] = [lines[li]];
      for (let k = li - 1, got = 0; k >= 0 && k >= li - 6 && got < (bare ? 2 : 1); k--) {
        const x = lines[k].trim();
        if (!x) { if (got) break; else continue; }
        if (HEAD.other.test(x) || SIDEBAR.test(x)) continue;
        if (/(19|20)\d{2}/.test(x) && k !== li) break; // previous entry's date line
        ctx.unshift(x); got++;
        if (/^[\d)\-.]+\s*\S/.test(x) || /^(?:\d+\)|•|-)/.test(x)) break;
      }
      const tight = ctx.join(' ');
      const wide = lines.slice(Math.max(0, li - 2), Math.min(lines.length, li + 3)).join(' ');
      const kind = classify(tight, wide, sectionAt[li]);
      ranges.push({ start, end, kind, line: lines[li].trim().slice(0, 120), lineIdx: li, raw: m[0] });
      taken.push([a, b]);
    }
  }

  // explicit "X years of experience" statements (used only as a fallback / sanity check)
  let stated = 0;
  const reS = /(\d{1,2})\s*\+?\s*(?:years?|yrs?|سن(?:ة|وات)|عام|أعوام)\s*(?:of\s+)?(?:\w+\s+){0,3}?(?:experience|exp\b|خبرة)/gi;
  let ms: RegExpExecArray | null;
  while ((ms = reS.exec(t))) stated = Math.max(stated, Math.min(45, +ms[1]));

  // unresolved ends (OCR-cut years): end at the next later job's start, else assume ~2 years
  for (const r of ranges) {
    if (r.end !== -1) continue;
    const next = ranges.filter((x) => x !== r && x.kind === 'work' && x.end !== -1 && x.start > r.start).sort((a, b) => a.start - b.start)[0];
    r.end = next ? Math.min(next.start, r.start + 8) : Math.min(NOW, r.start + 2);
    if (r.end - r.start > 45 || r.end < r.start) r.end = r.start;
  }
  // merge work ranges (overlaps count once)
  const work = ranges.filter((r) => r.kind === 'work').sort((a, b) => a.start - b.start);
  let total = 0, cs = -1, ce = -1;
  for (const r of work) {
    if (r.start > ce) { if (ce > cs) total += ce - cs; cs = r.start; ce = r.end; } else ce = Math.max(ce, r.end);
  }
  if (ce > cs) total += ce - cs;

  let years = Math.round(total * 10) / 10;
  // no usable date ranges → fall back to the stated figure
  if (!work.length && stated) years = stated;
  // dates found but far below the stated figure (e.g. only the last job is dated) → trust the stated figure within reason
  else if (stated && stated > years * 1.6 && stated - years >= 3 && work.length <= 2) years = Math.min(stated, years + (stated - years) * 0.8);

  return { years: Math.round(years * 10) / 10, ranges };
}
