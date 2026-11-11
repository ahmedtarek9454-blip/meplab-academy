/**
 * =====================================================================
 *  Speech interpreter for the voice CV builder (runs in the browser).
 *  1. cleans what the speech service heard: fillers, misheard engineering
 *     terms ("rivet" → Revit, "h vac" → HVAC), spoken numbers → digits
 *  2. turns Egyptian / Arabic engineering sentences into English CV lines
 *     with a domain phrase table (no guessing: unknown words are kept and flagged)
 *  3. pulls out the facts in each sentence (numbers + units, building types,
 *     systems, software) and finds the closest ready-made task line
 *  Everything stays on the device; nothing here calls a server.
 * =====================================================================
 */
import { tasksFor } from './taskBank';
import { replaceCompanies } from './names';

/* ---------------------------------------------------------------- digits */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toLatinDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.').replace(/٬/g, ',');

/* -------------------------------------------------- spoken numbers → digits */
const EN_UNITS: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const EN_TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const AR_NUM: Record<string, number> = {
  واحد: 1, واحده: 1, واحدة: 1, اتنين: 2, اثنين: 2, اثنان: 2, تلاته: 3, تلاتة: 3, ثلاثة: 3, ثلاث: 3, تلات: 3, اربعه: 4, اربعة: 4, أربعة: 4, اربع: 4, أربع: 4,
  خمسه: 5, خمسة: 5, خمس: 5, سته: 6, ستة: 6, ست: 6, سبعه: 7, سبعة: 7, سبع: 7, تمانيه: 8, تمانية: 8, ثمانية: 8, تمن: 8, تسعه: 9, تسعة: 9, تسع: 9,
  عشره: 10, عشرة: 10, عشر: 10, حداشر: 11, احداشر: 11, 'أحد عشر': 11, اتناشر: 12, اطناشر: 12, 'اثنا عشر': 12, تلتاشر: 13, اربعتاشر: 14, خمستاشر: 15, ستاشر: 16, سبعتاشر: 17, تمنتاشر: 18, تسعتاشر: 19,
  عشرين: 20, تلاتين: 30, ثلاثين: 30, اربعين: 40, أربعين: 40, خمسين: 50, ستين: 60, سبعين: 70, تمانين: 80, ثمانين: 80, تسعين: 90
};
const AR_SCALE: Record<string, number> = { مية: 100, ميه: 100, مائة: 100, ميت: 100, ميتين: 200, مئتين: 200, الف: 1000, ألف: 1000, آلاف: 1000, الاف: 1000, الفين: 2000, ألفين: 2000, مليون: 1e6, ملايين: 1e6 };

function enNumbers(s: string) {
  return s.replace(/\b((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|and|-)\s*)+)\b/gi, (m) => {
    const words = m.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter((w) => w && w !== 'and');
    if (!words.length || words.every((w) => w === 'hundred' || w === 'thousand' || w === 'million')) return m;
    let total = 0, cur = 0;
    for (const w of words) {
      if (w in EN_UNITS) cur += EN_UNITS[w];
      else if (w in EN_TENS) cur += EN_TENS[w];
      else if (w === 'hundred') cur = (cur || 1) * 100;
      else if (w === 'thousand') { total += (cur || 1) * 1000; cur = 0; }
      else if (w === 'million') { total += (cur || 1) * 1e6; cur = 0; }
    }
    const n = total + cur;
    return (m.match(/^\s*/)![0]) + String(n) + (m.match(/\s*$/)![0]);
  });
}

function arNumbers(s: string) {
  // "تلاتة آلاف" "خمسة وعشرين" "ميتين وخمسين" "12 دور"
  const words = s.split(/(\s+)/);
  const out: string[] = [];
  let i = 0;
  const val = (w: string) => { const x = w.replace(/^و/, ''); return x in AR_NUM ? AR_NUM[x] : undefined; };
  const scale = (w: string) => { const x = w.replace(/^و/, ''); return x in AR_SCALE ? AR_SCALE[x] : undefined; };
  while (i < words.length) {
    const w = words[i];
    if (val(w) === undefined && scale(w) === undefined && !/^\d+$/.test(w)) { out.push(w); i++; continue; }
    let total = 0, cur = 0, used = 0, j = i, any = false;
    while (j < words.length) {
      const x = words[j];
      if (/^\s+$/.test(x)) { j++; continue; }
      const v = val(x), sc = scale(x), d = /^\d+(?:[.,]\d+)?$/.test(x) ? parseFloat(x.replace(/,/g, '')) : undefined;
      if (v !== undefined) { cur += v; any = true; }
      else if (d !== undefined && !any) { cur += d; any = true; }
      else if (sc !== undefined) { if (sc >= 1000) { total += (cur || 1) * sc; cur = 0; } else cur = (cur || 1) * sc; any = true; }
      else break;
      used = j + 1; j++;
    }
    const n = total + cur;
    // a lone "واحد"/"ست" etc. is often a word, not a number: only convert clear cases
    const span = words.slice(i, used).join('');
    const lone = span.trim().split(/\s+/).length === 1 && /^(واحد|واحده|واحدة|ست|عشر|تسع|سبع|خمس)$/.test(span.trim());
    if (!any || lone || n === 0) { out.push(w); i++; continue; }
    out.push((/^و/.test(w) ? 'و ' : '') + String(n));
    i = used;
  }
  return out.join('');
}

/* ------------------------------------------------- speech-to-text clean-up */
const FILLERS_EN = /\b(um+|uh+|erm+|hmm+|like,?|you know,?|i mean,?|basically,?|actually,?|so yeah|okay so|ok so)\b/gi;
const FILLERS_AR = /(^|\s)(يعني|اممم*|ااه*|آآ*|بص|بقى|خلاص|طيب|اه|ايوه|يعني ايه|حاجة زي كدة|حاجه زي كده|زي ما بقولك)(?=\s|$)/g;

/** What speech services commonly mishear for engineering words (EN + Arabic transliterations). */
const MISHEARD: [RegExp, string][] = [
  [/\b(?:h\.?\s?vac|age vac|each vac|h vack|hvac's|ach vac|eight vac)\b/gi, 'HVAC'],
  [/\b(?:m\.?\s?e\.?\s?p|m e p|amp systems)\b/gi, 'MEP'],
  [/\b(?:b\.?\s?i\.?\s?m)\b/gi, 'BIM'],
  [/\b(?:rivet|revert|reveal it|rev it|revit's)\b/gi, 'Revit'],
  [/\b(?:auto ?cad|autocat|auto card|otto cad)\b/gi, 'AutoCAD'],
  [/\b(?:navis ?works|navy works|navies works)\b/gi, 'Navisworks'],
  [/\b(?:a\.?\s?h\.?\s?u|a h u)\b/gi, 'AHU'], [/\b(?:f\.?\s?c\.?\s?u|f c u)\b/gi, 'FCU'], [/\b(?:v\.?\s?r\.?\s?f|v r f)\b/gi, 'VRF'],
  [/\b(?:b\.?\s?o\.?\s?q|b o q)\b/gi, 'BOQ'], [/\b(?:r\.?\s?f\.?\s?i|r f i)\b/gi, 'RFI'], [/\b(?:n\.?\s?f\.?\s?p\.?\s?a|n f p a)\b/gi, 'NFPA'],
  [/\b(?:ash ?ray|ashray|ash rae)\b/gi, 'ASHRAE'], [/\b(?:smack ?na|smacna)\b/gi, 'SMACNA'], [/\b(?:hap software|carrier hap|h a p)\b/gi, 'HAP'],
  [/\b(?:shop drawing|shop drawings|shop drawn)\b/gi, 'shop drawings'], [/\b(?:etabs|e tabs|it tabs)\b/gi, 'ETABS'], [/\b(?:primavera|prima vera)\b(?!\s*P6)/gi, 'Primavera P6'],
  [/\b(?:chiller's|chillers?)\b/gi, 'chillers'], [/\b(?:dukt|ducked|ducts? work|duck work)\b/gi, 'ductwork'],
  [/(?:اتش ?فاك|اتش في ايه سي|إتش فاك|اتش فاك)/g, 'HVAC'], [/(?:ام اي بي|إم إي بي|ام ي بي)/g, 'MEP'], [/(?:بي اي ام|بيم)(?=\s|$)/g, 'BIM'],
  [/(?:ريفيت|ريفت|ريفيد)/g, 'Revit'], [/(?:اوتوكاد|أوتوكاد|اوتو كاد)/g, 'AutoCAD'], [/(?:نافيس ?ووركس|نافيز|نافيس)/g, 'Navisworks'],
  [/(?:بريمافيرا(?:\s*بي\s*[6٦])?)/g, 'Primavera P6'], [/(?:ايتابس|إيتابس)/g, 'ETABS'], [/(?:سيف)(?=\s|$)/g, 'SAFE'],
  [/(?:ال)?شوب ?(?:دروينجز|دروينج|دراوينج|درونج|درويج)|(?:ال)?شوب(?=\s|$)/g, 'shop drawings'], [/(?:اي ار|آي آر)(?=\s|$)/g, 'IR'], [/(?:ار اف اي|آر إف آي)/g, 'RFI'],
  [/(?:بي او كيو|بوك|البوك)(?=\s|$)/g, 'BOQ'], [/(?:ان اف بي ايه|إن إف بي إيه)/g, 'NFPA'], [/(?:اشري|أشري|اشراي)/g, 'ASHRAE'], [/(?:سماكنا)/g, 'SMACNA'],
  [/(?:اتش ايه بي|هاب)(?=\s|$)/g, 'HAP'], [/(?:اي اتش يو|ايه اتش يو)/g, 'AHU'], [/(?:اف سي يو)/g, 'FCU'], [/(?:في ار اف)/g, 'VRF']
];

export function normalizeSpeech(raw: string) {
  let s = toLatinDigits(String(raw || ''));
  for (const [re, rep] of MISHEARD) s = s.replace(re, rep);
  s = s.replace(/(^|\s)(?:وبال|بال|وال|لل|ال|ب|ل)(?=[A-Za-z])/g, '$1'); // "الRevit" → "Revit"
  s = s.replace(/(^|\s)الـ?\s+(?=[A-Z])/g, '$1the '); // "الـ BOQ" → "the BOQ"
  s = s.replace(FILLERS_EN, ' ').replace(FILLERS_AR, '$1');
  s = enNumbers(s);
  s = arNumbers(s);
  return s.replace(/\s+([,.؟?!])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

/** Arabic spelling variants spoken text often mixes (أ/إ/آ → ا, ة → ه, ى → ي). */
const arFold = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/ة(?=$|[\s،,.)])/g, 'ه').replace(/ى(?=$|[\s،,.)])/g, 'ي').replace(/ـ/g, '');

/* -------------------------------------------- Arabic → English phrase table */
// Order matters: longer phrases first. Values are CV English.
const AR_VERBS: [RegExp, string][] = [
  [/^(?:انا\s+)?(?:كنت|اشتغلت)\s+(?=(?:مهندس|مدير|منسق|رسام|فني|مشرف|مساعد)\s)/, 'Worked as '],
  [/^(?:انا\s+)?(?:اشتغلت|كنت شغال|اشتغل)\s+(?=at\s)/, 'Worked '],
  [/^(?:كنت|كان)\s+(?:مسؤول|مسئول|المسؤول|المسئول)\s+(?:عن|عل[ىي]|علي)\s+/, 'Responsible for '],
  [/^(?:كنت\s+)?(?:ماسك|مسكت)\s+(?:فريق|تيم)\s+(?:من\s+)?/, 'Led a team of '],
  [/^(?:كنت\s+)?(?:بقود|قدت|قائد)\s+(?:فريق|تيم)\s+(?:من\s+)?/, 'Led a team of '],
  [/^(?:كنت\s+)?(?:ماسك|مسكت|استلمت)\s+(?:مشروع|المشروع)\s+/, 'Managed the project of '],
  [/^(?:كنت\s+)?(?:بشرف|اشرف|اشرفت|باشرف)\s+(?:علي\s+|عل[ىي]\s+)?/, 'Supervised '],
  [/^(?:كنت\s+)?(?:بتابع|بأتابع|تابعت|متابعة|بتابعت)\s+/, 'Followed up '],
  [/^(?:كنت\s+)?(?:بصمم|بأصمم|صممت|تصميم)\s+/, 'Designed '],
  [/^(?:كنت\s+)?(?:بحسب|حسبت|بعمل حسابات|عملت حسابات|حسابات)\s+/, 'Calculated '],
  [/^(?:كنت\s+)?(?:براجع|راجعت|مراجعة)\s+/, 'Reviewed '],
  [/^(?:كنت\s+)?(?:بنسق|نسقت|تنسيق|بعمل تنسيق|عملت تنسيق)\s+(?:بين\s+|مع\s+)?/, 'Coordinated '],
  [/^(?:كنت\s+)?(?:باختار|اخترت|اختيار)\s+/, 'Selected '],
  [/^(?:كنت\s+)?(?:برسم|رسمت|رسم)\s+/, 'Drafted '],
  [/^(?:كنت\s+)?(?:بعمل|عملت)\s+(?:موديل|موديلنج|مودلينج)\s+/, 'Modelled '],
  [/^(?:كنت\s+)?(?:بعمل|عملت)\s+(?:حصر(?:\s+(?:ال)?كميات)?|كميات)\s+/, 'Prepared quantity take-offs for '],
  [/^(?:كنت\s+)?(?:بعمل|عملت)\s+(?:تست|تستات|اختبار|اختبارات)\s+(?:ال)?ضغط\s+/, 'Performed pressure tests '],
  [/^(?:كنت\s+)?(?:بعمل|عملت)\s+(?:تست|تستات|اختبار|اختبارات)\s+/, 'Performed tests '],
  [/^(?:كنت\s+)?(?:بجهز|جهزت|تجهيز|بحضر|حضرت|تحضير)\s+/, 'Prepared '],
  [/^(?:كنت\s+)?(?:بقدم|قدمت|تقديم)\s+/, 'Submitted '],
  [/^(?:كنت\s+)?(?:بستلم|استلمت|استلام)\s+/, 'Inspected and received '],
  [/^(?:كنت\s+)?(?:بسلم|سلمت|تسليم)\s+/, 'Handed over '],
  [/^(?:كنت\s+)?(?:بركب|ركبت|تركيب)\s+/, 'Installed '],
  [/^(?:كنت\s+)?(?:بنفذ|نفذت|تنفيذ)\s+/, 'Executed '],
  [/^(?:كنت\s+)?(?:بدرب|دربت|تدريب)\s+/, 'Trained '],
  [/^(?:كنت\s+)?(?:بحل|حليت|حلّيت|حل)\s+(?:ال)?(?:مشاكل|تعارضات)\s+/, 'Resolved clashes and issues '],
  [/^(?:كنت\s+)?(?:بحل|حليت|حلّيت)\s+/, 'Resolved '],
  [/^(?:كنت\s+)?(?:بختار|باختار|اختار|اخترت)\s+/, 'Selected '],
  [/^(?:كنت\s+)?(?:بكتب|كتبت|كتابة)\s+/, 'Wrote '],
  [/^(?:كنت\s+)?(?:بعمل|عملت)\s+/, 'Prepared '],
  [/^(?:اشتغلت|اشتغل|كنت شغال|شغال|عملت)\s+(?:في|عل[ىي])\s+/, 'Contributed to ']
];

const AR_TERMS: [string, string][] = [
  // work nouns ("مسؤول عن تنفيذ …")
  ['تنفيذ', 'execution of'], ['تصميم', 'design of'], ['تركيب', 'installation of'], ['توريد', 'supply of'], ['مراجعة', 'review of'], ['متابعة', 'follow-up of'],
  ['إعداد', 'preparation of'], ['اعداد', 'preparation of'], ['حساب', 'calculation of'], ['إدارة', 'management of'], ['ادارة', 'management of'], ['تشغيل', 'operation of'],
  ['الحسابات الهيدروليكيه', 'hydraulic calculations'], ['حسابات هيدروليكيه', 'hydraulic calculations'], ['الحسابات', 'calculations'], ['حسابات', 'calculations'],
  ['شبكات الرشاشات', 'sprinkler networks'], ['شبكه الرشاشات', 'sprinkler network'], ['شبكات المواسير', 'piping networks'], ['شبكات الصرف', 'drainage networks'],
  ['شبكات التغذيه', 'water supply networks'], ['شبكات المياه', 'water networks'], ['شبكات التكييف', 'HVAC networks'],
  ['تقارير يوميه واسبوعيه', 'daily and weekly reports'], ['تقارير يوميه', 'daily reports'], ['تقارير اسبوعيه', 'weekly reports'], ['تقارير شهريه', 'monthly reports'],
  ['المستخلصات الشهريه', 'monthly interim payment applications'], ['مستخلصات شهريه', 'monthly interim payment applications'], ['صيانه', 'maintenance of'], ['الصيانه', 'maintenance of'],
  ['شبكات', 'networks'], ['شبكه', 'network'], ['اعمال الكهرباء', 'electrical works'], ['اعمال التكييف', 'HVAC works'], ['اعمال الصحي', 'plumbing works'],
  ['اعمال الحريق', 'fire fighting works'], ['اعمال الموقع', 'site works'], ['الاعمال', 'the works'], ['اعمال', 'works'], ['الضغط', 'pressure'],
  ['في الموقع', 'on site'], ['فى الموقع', 'on site'], ['في الميعاد', 'on schedule'], ['في المعاد', 'on schedule'], ['في معاده', 'on schedule'],
  ['فيلات كمبوند', 'villas in a compound'], ['فيلات في كمبوند', 'villas in a compound'], ['قبل ما', 'before'], ['بعد ما', 'after'], ['تتقدم', 'submission'], ['تقديمها', 'submission'],
  ['بتاعة', 'of the'], ['بتاعت', 'of the'], ['بتاع', 'of the'], ['بتوع', 'of the'], ['جداد', 'new'], ['الاداره', 'management'], ['الادارة', 'management'],
  ['مهندس موقع', 'site engineer'], ['مهندس تصميم', 'design engineer'], ['مهندس مكتب فني', 'technical office engineer'], ['مكتب فني', 'technical office'], ['مدير مشروع', 'project manager'],
  ['شركه مقاولات', 'a contracting company'], ['شركه استشاريه', 'a consultancy firm'], ['مكتب استشاري', 'a consultancy firm'], ['شركه', 'company'],
  ['انظمه انذار الحريق', 'fire alarm systems'], ['انظمه الحريق', 'fire fighting systems'], ['انظمه التكييف', 'HVAC systems'], ['انظمه', 'systems'], ['نظام', 'system'],
  ['الخامات', 'materials'], ['خامات', 'materials'], ['المواد', 'materials'], ['وبراجعها', 'and reviewed them'], ['وبراجعه', 'and reviewed it'],
  ['علي المواصفات', 'against the specifications'], ['مشاكل الاسقف', 'ceiling issues'], ['كاستشاري', 'as the consultant'], ['كمقاول', 'as the contractor'], ['التسعير', 'pricing'], ['تسعير', 'pricing'], ['عشان', 'to'], ['علشان', 'to'], ['نحل', 'resolve'], ['احل', 'resolve'], ['مشاكل', 'issues'], ['الاسقف', 'ceilings'], ['السقف', 'ceiling'],
  ['المشروع كله', 'the entire project'], ['كله', 'entire'], ['فريق من', 'a team of'], ['فريق', 'team'], ['رسامين', 'draftsmen'], ['رسام', 'draftsman'],
  ['مشروع مستشفي جامعي', 'a university hospital project'], ['مستشفي جامعي', 'university hospital'], ['فيه', 'with'], ['فيها', 'with'], ['سرير', 'beds'], ['غرفه', 'rooms'],
  // building + adjective (Arabic puts the adjective after the noun)
  ['برج إداري', 'office tower'], ['برج اداري', 'office tower'], ['برج سكني', 'residential tower'], ['مول تجاري', 'shopping mall'], ['مجمع سكني', 'residential complex'],
  ['مجمع تجاري', 'commercial complex'], ['مستشفى حكومي', 'public hospital'], ['مستشفى خاص', 'private hospital'], ['مبنى سكني', 'residential building'], ['مبنى تجاري', 'commercial building'],
  ['مشروع سكني', 'residential project'], ['مشروع تجاري', 'commercial project'], ['مشروع حكومي', 'government project'],
  ['مقاولين باطن', 'subcontractors'], ['مقاول باطن', 'subcontractor'], ['فني', 'technicians'], ['فنيين', 'technicians'],
  ['مساحته', 'with an area of'], ['مساحتها', 'with an area of'], ['بمساحة', 'with an area of'], ['مساحة', 'area of'], ['حوالي', 'about'], ['حوالى', 'about'], ['تقريبا', 'about'], ['تقريباً', 'about'],
  ['الشهرية', 'monthly'], ['الشهري', 'monthly'], ['شهرية', 'monthly'], ['اليومية', 'daily'], ['يومية', 'daily'], ['الأسبوعية', 'weekly'], ['الاسبوعية', 'weekly'], ['أسبوعية', 'weekly'],
  // systems
  ['مواسير المياه المثلجة', 'chilled water piping'], ['المياه المثلجة', 'chilled water'], ['مياه مثلجة', 'chilled water'], ['مواسير التكييف', 'HVAC piping'],
  ['مجاري الهواء', 'ductwork'], ['الدكت', 'ductwork'], ['دكت', 'ductwork'], ['الدكتات', 'ductwork'], ['دكتات', 'ductwork'],
  ['التكييف المركزي', 'central air conditioning'], ['التكييف', 'HVAC'], ['تكييف', 'HVAC'], ['التهوية', 'ventilation'], ['تهوية', 'ventilation'],
  ['شفط الدخان', 'smoke extraction'], ['عادم الجراج', 'car park exhaust'], ['الجراج', 'car park'],
  ['مكافحة الحريق', 'fire fighting'], ['إطفاء الحريق', 'fire fighting'], ['اطفاء الحريق', 'fire fighting'], ['الحريق', 'fire fighting'], ['حريق', 'fire fighting'],
  ['الرشاشات', 'sprinklers'], ['رشاشات', 'sprinklers'], ['انذار الحريق', 'fire alarm'], ['إنذار الحريق', 'fire alarm'],
  ['الصرف الصحي', 'drainage'], ['الصرف', 'drainage'], ['التغذية', 'water supply'], ['تغذية المياه', 'water supply'], ['الصحي', 'plumbing'], ['صحي', 'plumbing'],
  ['الكهرباء', 'electrical'], ['كهرباء', 'electrical'], ['الإنارة', 'lighting'], ['الانارة', 'lighting'], ['اللوحات', 'panels'], ['لوحات', 'panels'], ['الكابلات', 'cables'], ['كابلات', 'cables'],
  ['التيار الخفيف', 'low-current (ELV) systems'], ['الكاميرات', 'CCTV'],
  // equipment
  ['وحدات التكييف', 'air-conditioning units'], ['الشيلرات', 'chillers'], ['شيلرات', 'chillers'], ['الشيلر', 'chillers'], ['شيلر', 'chillers'],
  ['المضخات', 'pumps'], ['مضخات', 'pumps'], ['الطلمبات', 'pumps'], ['طلمبات', 'pumps'], ['طلمبة', 'pump'], ['المراوح', 'fans'], ['مراوح', 'fans'],
  ['الخزانات', 'tanks'], ['خزانات', 'tanks'], ['خزان', 'tank'], ['المعدات', 'equipment'], ['معدات', 'equipment'], ['الفلاتر', 'filters'],
  // documents & work
  ['الرسومات التنفيذية', 'shop drawings'], ['رسومات تنفيذية', 'shop drawings'], ['الرسومات', 'drawings'], ['رسومات', 'drawings'], ['اللوحات التنفيذية', 'shop drawings'],
  ['المخططات', 'drawings'], ['مخططات', 'drawings'], ['حسابات الأحمال', 'load calculations'], ['حسابات الاحمال', 'load calculations'], ['الأحمال', 'loads'], ['الاحمال', 'loads'],
  ['اختيار المعدات', 'equipment selection'], ['المستخلصات', 'interim payment applications'], ['مستخلصات', 'interim payment applications'], ['المستخلص', 'interim payment application'],
  ['الحصر', 'quantity take-off'], ['حصر', 'quantity take-off'], ['الكميات', 'quantities'], ['كميات', 'quantities'], ['عروض الأسعار', 'quotations'], ['عروض اسعار', 'quotations'],
  ['المناقصات', 'tenders'], ['مناقصات', 'tenders'], ['المواصفات', 'specifications'], ['مواصفات', 'specifications'], ['الكود', 'code'], ['كود', 'code'],
  ['طلبات الاستلام', 'inspection requests'], ['طلبات الفحص', 'inspection requests'], ['طلب استلام', 'inspection request'], ['اعتماد الخامات', 'material submittals'], ['اعتماد المواد', 'material submittals'],
  ['التقارير', 'reports'], ['تقارير', 'reports'], ['اليوميه', 'daily'], ['يوميه', 'daily'], ['الاسبوعيه', 'weekly'], ['اسبوعيه', 'weekly'], ['الشهريه', 'monthly'], ['شهريه', 'monthly'], ['تقرير', 'report'], ['الاجتماعات', 'meetings'], ['اجتماعات', 'meetings'], ['الجدول الزمني', 'schedule'], ['البرنامج الزمني', 'schedule'],
  ['التعارضات', 'clashes'], ['تعارضات', 'clashes'], ['الموديل', 'model'], ['موديل', 'model'], ['الفاميليز', 'families'], ['فاميليز', 'families'],
  ['اختبار الضغط', 'pressure tests'], ['اختبارات الضغط', 'pressure tests'], ['التشغيل التجريبي', 'testing and commissioning'], ['الاستلام', 'handover inspections'], ['التسليم', 'handover'],
  ['الصيانة', 'maintenance'], ['صيانة', 'maintenance'], ['الأعطال', 'breakdowns'], ['الاعطال', 'breakdowns'], ['الجودة', 'quality'], ['السلامة', 'HSE'],
  // people & parties
  ['مقاولين الباطن', 'subcontractors'], ['مقاولي الباطن', 'subcontractors'], ['المقاولين', 'subcontractors'], ['مقاولين', 'subcontractors'], ['المقاول', 'contractor'], ['مقاول', 'contractor'],
  ['الاستشاري', 'the consultant'], ['استشاري', 'consultant'], ['المالك', 'the client'], ['العميل', 'the client'], ['الموردين', 'suppliers'], ['موردين', 'suppliers'],
  ['المهندسين', 'engineers'], ['مهندسين', 'engineers'], ['مهندس', 'engineer'], ['الفنيين', 'technicians'], ['فنيين', 'technicians'], ['العمال', 'workers'], ['عمال', 'workers'], ['الرسامين', 'draftsmen'],
  ['المعماري', 'architecture'], ['الإنشائي', 'structure'], ['الانشائي', 'structure'], ['التخصصات', 'disciplines'], ['باقي التخصصات', 'other disciplines'],
  // places & buildings
  ['المستشفى', 'hospital'], ['مستشفى', 'hospital'], ['المواسير', 'piping'], ['مواسير', 'piping'], ['مستشفيات', 'hospitals'], ['البرج', 'tower'], ['برج', 'tower'], ['أبراج', 'towers'], ['ابراج', 'towers'],
  ['المول', 'mall'], ['مول', 'mall'], ['الفندق', 'hotel'], ['فندق', 'hotel'], ['فنادق', 'hotels'], ['المطار', 'airport'], ['مطار', 'airport'],
  ['مبنى إداري', 'office building'], ['مبنى اداري', 'office building'], ['المبنى', 'building'], ['مبنى', 'building'], ['مباني', 'buildings'], ['عمارات', 'residential buildings'], ['عمارة', 'residential building'],
  ['سكني', 'residential'], ['تجاري', 'commercial'], ['إداري', 'office'], ['اداري', 'office'], ['فيلات', 'villas'], ['فيلا', 'villa'], ['كمبوند', 'compound'],
  ['مدرسة', 'school'], ['مدارس', 'schools'], ['جامعة', 'university'], ['مصنع', 'factory'], ['مصانع', 'factories'], ['محطة', 'plant'], ['داتا سنتر', 'data centre'],
  ['الموقع', 'site'], ['موقع', 'site'], ['المشروع', 'the project'], ['مشروع', 'project'], ['مشاريع', 'projects'], ['المكتب', 'office'],
  // units & time
  ['متر مربع', 'm²'], ['متر مكعب', 'm³'], ['طن تبريد', 'TR'], ['أدوار', 'floors'], ['ادوار', 'floors'], ['دور', 'floors'], ['طوابق', 'floors'], ['طابق', 'floors'],
  ['يوميا', 'daily'], ['يومياً', 'daily'], ['كل يوم', 'daily'], ['أسبوعيا', 'weekly'], ['اسبوعيا', 'weekly'], ['كل أسبوع', 'weekly'], ['كل اسبوع', 'weekly'], ['شهريا', 'monthly'], ['كل شهر', 'monthly'],
  ['مليون جنيه', 'million EGP'], ['مليون ريال', 'million SAR'], ['جنيه', 'EGP'], ['ريال', 'SAR'], ['درهم', 'AED'],
  // connectors
  ['بالإضافة إلى', 'and'], ['بالاضافة الى', 'and'], ['عن طريق', 'using'], ['باستخدام', 'using'], ['بستخدام', 'using'], ['على برنامج', 'using'], ['ببرنامج', 'using'],
  ['طبقا لـ', 'per'], ['طبقًا لـ', 'per'], ['حسب', 'per'], ['قبل', 'before'], ['بعد', 'after'], ['أثناء', 'during'], ['اثناء', 'during'],
  ['وكمان', 'and'], ['كمان', 'also'], ['بين', 'between'], ['مع', 'with'], ['في', 'in'], ['فى', 'in'], ['على', 'on'], ['علي', 'on'], ['من', 'from'], ['الى', 'to'], ['إلى', 'to'], ['لحد', 'until'],
  ['كل', 'all'], ['جميع', 'all'], ['و', 'and']
];
const AR_TERMS_SORTED = [...AR_TERMS].sort((a, b) => b[0].length - a[0].length);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// glued prefixes: و (and) + ب/ل (with/for) + ال (the): "والدكت" → "and ductwork", "للمستخلصات" → "for interim payment applications", "لمول" → "for mall"
const core = (ar: string) => arFold(ar).replace(/^ال/, '');
const AR_TERM_RES = AR_TERMS_SORTED.map(([ar, en]) => [new RegExp(`(^|[\\s،,(])(و)?(ب|ل)?(?:ال|ل)?${escapeRe(core(ar))}(?=$|[\\s،,.)])`, 'g'), en] as [RegExp, string]);

export type Translation = { text: string; unknown: string[]; translated: boolean };

export function arabicToEnglish(sentence: string): Translation {
  let s = replaceCompanies(arFold(normalizeSpeech(sentence))).replace(/[؟]/g, '?').replace(/،/g, ',').trim();
  if (!/[؀-ۿ]/.test(s)) return { text: tidyEnglish(s), unknown: [], translated: false };
  // "12 دور" / "مستشفى 12 دور" → "a 12-floor hospital"
  const ADJ: Record<string, string> = { سكني: 'residential', اداري: 'office', تجاري: 'commercial', حكومي: 'government', جامعي: 'university', طبي: 'medical' };
  const BLD: Record<string, string> = { مستشفي: 'hospital', برج: 'tower', مبني: 'building', عماره: 'building', فندق: 'hotel', مول: 'mall' };
  s = s.replace(/(^|\s)(و)?(ب|ل|في\s+)?(?:ال)?(مستشفي|برج|مبني|عماره|فندق|مول)(?:\s+(سكني|اداري|تجاري|حكومي|جامعي|طبي))?\s+(?:من\s+)?(\d+)\s+(?:دور|ادوار|طابق|طوابق)/g,
    (_m, pre, w, bl, b, adj, n) => `${pre}${w ? 'and ' : ''}${bl === 'ل' ? 'for ' : bl === 'ب' || (bl && bl.trim() === 'في') ? 'in ' : ''}a ${n}-floor ${adj ? ADJ[adj] + ' ' : ''}${BLD[b]}`);
  s = s.replace(/(\d+)\s+(مهندسين|فنيين|رسامين)\s+(?:جداد|جدد)/g, '$1 new $2');
  s = s.replace(/(\d[\d,.]*)\s*(?:الف|ألف|آلاف)?\s*متر\s*مربع/g, '$1 m²');
  let lead = '';
  for (const [re, en] of AR_VERBS) { if (re.test(s)) { lead = en; s = s.replace(re, ''); break; } }
  for (const [re, en] of AR_TERM_RES) s = s.replace(re, (_m, pre, w, bl) => `${pre}${w && en !== 'and' ? 'and ' : ''}${bl === 'ل' && /^(the consultant|consultant|the client|contractor|subcontractors?|suppliers|management|engineers)$/.test(en) ? 'to ' : bl === 'ل' && en && !/^(for|to|in|on|with|from|and)$/.test(en) ? 'for ' : bl === 'ب' && !/^(with|using|in)\b/.test(en) ? 'with ' : ''}${en}`);
  // strip leftover Arabic article/prefixes on known English words, then collect unknown Arabic words
  const unknown = [...new Set((s.match(/[؀-ۿ]+/g) || []).filter((w: string) => w.length > 1))];
  let text = (lead + s).replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
  // tidy common English shapes
  text = text.replace(/\bin (\d+)-floor (\w+)/g, 'in a $1-floor $2').replace(/\bthe the\b/g, 'the').replace(/\band and\b/g, 'and').replace(/\bLed a team of (\d+) (engineers|technicians|workers|draftsmen)\b/g, 'Led a team of $1 $2');
  text = tidyEnglish(text);
  return { text, unknown, translated: true };
}

const BUILDING_NOUN = '(?:office tower|residential tower|shopping mall|public hospital|private hospital|residential building|commercial building|office building|residential complex|commercial complex|data centre|hospital|tower|mall|hotel|airport|villa|compound|school|university|factory|plant)';
/** English clean-up shared by spoken English and translated Arabic. */
export function tidyEnglish(t: string) {
  let x = t.replace(/^(?:so\s+|and\s+)?(?:I|we)\s+(?:also\s+)?(?=[a-z])/i, '');
  x = x.replace(/(\b(?:a|an|the)\s+)?\b(\d+)[\s-]+floors?\s+(tower|building|hospital|hotel|office tower|residential tower)\b/gi, (_m, art, n, b) => `${art ? art.replace(/an/i, 'a') : 'a '}${n}-floor ${b}`);
  x = x.replace(/\bon (Revit|AutoCAD|Navisworks|HAP|ETABS|SAFE|Primavera P6|Excel|DIALux|MS Project)\b/g, 'using $1');
  x = x.replace(new RegExp(`\\b(in|on|for|at|of|from|to|with|inside|within)\\s+(${BUILDING_NOUN})\\b(?!s)`, 'gi'), (_m, p, b) => `${p} ${/^[aeiou]/i.test(b) ? 'an' : 'a'} ${b}`);
  x = x.replace(new RegExp(`^(\\w+(?:ed|d))\\s+(${BUILDING_NOUN})\\b(?!s)`, 'i'), (_m, v, b) => `${v} ${/^[aeiou]/i.test(b) ? 'an' : 'a'} ${b}`);
  x = x.replace(/\b(a|an) (\d+-floor)/g, 'a $2').replace(/\ba ([aeiou])/gi, (m, v) => (m[0] === 'A' ? 'An ' : 'an ') + v).replace(/\ban (\d)/g, 'a $1').replace(/\b(a|A)n (uni|use|eu|one)/g, '$1 $2');
  x = x.replace(new RegExp(`(${BUILDING_NOUN})\\s+about\\s+(\\d)`, 'gi'), '$1 of about $2');
  x = x.replace(/,\s+(a \d+-floor \w+(?: \w+)?)\s*\.?$/, ' for $1');
  x = x.replace(/\b(\d{4,})(?=\s*(?:m²|m³|TR|EGP|SAR|AED|kW|units|million))/g, (n) => Number(n).toLocaleString('en-US'));
  x = x.replace(/\b(for|to|in|on|with|of|and)\s+\1\b/gi, '$1').replace(/\bof the (the|a|an)\b/gi, 'of $1');
  x = x.replace(/\s+(?:of|for|to|with|in|on|and)\s*\.?$/i, '');
  x = x.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1').trim();
  return x.replace(/^(\w)/, (c) => c.toUpperCase());
}

/* ---------------------------------------------------------- fact extraction */
export type Facts = { numbers: string[]; buildings: string[]; systems: string[]; tools: string[] };
const BUILDINGS = /\b(hospitals?|towers?|malls?|hotels?|airports?|office buildings?|residential buildings?|villas?|compounds?|schools?|universit(?:y|ies)|factor(?:y|ies)|plants?|data cent(?:re|er)s?)\b/gi;
const SYSTEMS = /\b(chilled[- ]water(?: piping)?|ductwork|VRF|AHU|FCU|chillers?|pumps?|ventilation|smoke extraction|fire fighting|sprinklers?|fire alarm|drainage|water supply|plumbing|lighting|panels|cables|HVAC|low-current \(ELV\) systems|CCTV)\b/gi;
const TOOLS = /\b(Revit|AutoCAD|Navisworks|HAP|ETABS|SAFE|Primavera P6|MS Project|Excel|DIALux|SolidWorks|Civil 3D|Dynamo)\b/g;
const NUMS = /\b\d[\d,.]*\s*(?:-floor|floors?|m²|m³|TR|kW|MW|kV|engineers|technicians|workers|subcontractors|projects?|buildings?|villas?|units|million(?: EGP| SAR| AED)?|EGP|SAR|AED|%)/gi;

export function extractFacts(en: string): Facts {
  const uniq = (a: string[]) => [...new Set(a.map((x) => x.trim()))];
  return {
    numbers: uniq(en.match(NUMS) || []),
    buildings: uniq((en.match(BUILDINGS) || []).map((x: string) => x.toLowerCase())),
    systems: uniq(en.match(SYSTEMS) || []),
    tools: uniq(en.match(TOOLS) || [])
  };
}

/* ------------------------------------------------- closest ready-made task */
const STOP = new Set('a an the of and or to in on for with from by at as is was were be been i we my our per using all also daily weekly monthly'.split(' '));
const stem = (w: string) => w.toLowerCase().replace(/(ings|ing|ed|es|s)$/, '');
const bag = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem));

export function closestTask(en: string, roleId: string): string | null {
  const a = bag(en);
  if (a.size < 2) return null;
  let best: string | null = null, score = 0;
  for (const t of tasksFor(roleId)) {
    const b = bag(t);
    let inter = 0; for (const w of a) if (b.has(w)) inter++;
    const s = inter / Math.min(a.size, b.size);
    if (inter >= 2 && s > score) { score = s; best = t; }
  }
  return score >= 0.5 ? best : null;
}

/* ------------------------------------------------------------- one call */
export type Interpreted = { orig: string; text: string; translated: boolean; unknown: string[]; facts: Facts; similar: string | null };

export function interpretLine(orig: string, roleId: string): Interpreted {
  const tr = arabicToEnglish(orig);
  return { orig, text: tr.text, translated: tr.translated, unknown: tr.unknown, facts: extractFacts(tr.text), similar: closestTask(tr.text, roleId) };
}
