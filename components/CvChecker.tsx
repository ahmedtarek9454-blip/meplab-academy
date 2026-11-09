'use client';
import { useEffect, useRef, useState } from 'react';
import JobCard, { ago } from './JobCard';
import AiReview, { PENDING_KEY } from './AiReview';
import JdMatch from './JdMatch';
import CvRewrite from './CvRewrite';
import EmailGate, { currentUser, type GateUser } from './EmailGate';
import AboutMeplab, { type CourseLite } from './AboutMeplab';
import CvSave from './CvSave';
import { ocrImageFile, ocrPdfPages } from '@/lib/cv/ocr';
import { defaultModel, type AtsModel } from '@/lib/ats/model';
import type { Cat } from '@/lib/ats/taxonomy';
import { analyzeCv, type CvResult, type CheckStatus } from '@/lib/cv/analyze';
import { MARKETS, LEVELS, type Market } from '@/lib/cv/data';

type Loc = 'ar' | 'en';

const T = {
  ar: {
    title: 'فحص الـ CV بنظام ATS',
    sub: 'ارفع الـ CV بتاعك وفي ثواني تعرف: نسبة توافقه مع أنظمة الـ ATS، أقرب وظيفة MEP ليه، والمرتب التقريبي في السوق.',
    free: 'مجاني 100%',
    privacy: '🔒 الـ CV بيتحلل جوه متصفحك بس، ومش بيترفع على أي سيرفر.',
    drop: 'اسحب الـ CV هنا أو اضغط للاختيار',
    types: 'PDF أو Word أو صورة (JPG/PNG) أو CV متصوّر',
    ocr_load: 'بنحمّل قارئ الصور (أول مرة بس، حوالي 10 ثواني)...',
    ocr_run: 'بنقرا النص من الصورة...',
    ocr_note: 'الـ CV ده اتقري كصورة (OCR). ده معناه إن أنظمة الـ ATS الحقيقية غالبًا مش هتقدر تقراه، فالأفضل تبعته كـ PDF نصي من Word. النتيجة اللي تحت مبنية على النص اللي اتعرف من الصورة، وممكن يكون فيه أخطاء قراءة.',
    paste: 'أو الصق نص الـ CV',
    paste_ph: 'الصق محتوى الـ CV هنا...',
    market: 'السوق اللي بتقدّم فيه',
    analyze: 'حلّل الـ CV',
    analyzing: 'بنحلل الـ CV...',
    reading: 'بنقرا الملف...',
    err_read: 'مقدرناش نقرا الملف. جرّب PDF تاني أو الصق النص.',
    err_scan: 'مقدرناش نطلّع نص مقروء من الملف ده. لو صورة، جرّب صورة أوضح وأقرب، أو صدّر الـ CV كـ PDF من Word.',
    err_empty: 'ارفع ملف الـ CV الأول (أو الصق النص).',
    err_type: 'الصيغة دي مش مدعومة. ارفع PDF أو DOCX أو صورة (لو الملف .doc قديم، احفظه DOCX من Word).',
    score: 'نتيجة الـ ATS',
    score_good: 'ممتاز — الـ CV ده جاهز للتقديم',
    score_ok: 'كويس — محتاج شوية تعديلات',
    score_bad: 'ضعيف — غالبًا الـ ATS هيرفضه',
    best_role: 'أقرب وظيفة ليك',
    other_roles: 'وظايف قريبة كمان',
    match: 'توافق',
    exp: 'الخبرة المحسوبة',
    years: 'سنة',
    level: 'المستوى',
    salary: 'المرتب التقريبي',
    per_month: 'شهريًا',
    salary_note: 'تقدير تقريبي من مواقع رواتب عامة، والرقم الفعلي بيختلف حسب الشركة والمشروع والبدلات.',
    checks: 'تفاصيل الفحص',
    found_kw: 'المهارات اللي المحرك لقاها في الـ CV',
    cats: { design: 'تصميم', systems: 'أنظمة', fire: 'حريق', plumbing: 'صحي', software: 'برامج', codes: 'أكواد ومعايير', execution: 'تنفيذ و BIM', office: 'مكتب فني', commercial: 'تجاري', management: 'إدارة', cert: 'شهادات' } as Record<string, string>,
    engine: 'محرك MEP LAB ATS',
    model_prior: 'نسخة أولية من شبكة المعرفة',
    model_trained: 'متدرّب على {n} إعلان وظيفة حقيقي',
    salary_model: 'محسوب من {n} إعلان وظيفة حقيقي فيه مرتب، ومعدّل على مستوى خبرتك.',
    alert_sce: 'للسوق السعودي: اعتماد الهيئة السعودية للمهندسين (SCE) مطلوب في أغلب الوظايف، ومش ظاهر في الـ CV. لو معاك اكتبه بوضوح.',
    alert_syndicate: 'للسوق المصري: عضوية نقابة المهندسين مش ظاهرة في الـ CV. لو عضو، اكتبها.',
    alert_no_skills: 'المحرك ما لقاش مهارات MEP واضحة. اكتب البرامج والأنظمة والأكواد اللي اشتغلت بيها بأسمائها.',
    missing_kw: 'كلمات ناقصة لو عندك الخبرة دي ضيفها',
    again: 'افحص CV تاني',
    cta_t: 'عايز ترفع مستواك في المجال ده؟',
    cta_b: 'شوف الكورسات',
    pages: 'صفحة',
    words: 'كلمة',
    jobs_t: 'وظايف مناسبة ليك دلوقتي',
    jobs_all: 'كل الوظايف',
    apply: 'قدّم',
    today: 'النهارده',
    ago: 'من {n} يوم'
  },
  en: {
    title: 'ATS CV Checker',
    sub: 'Upload your CV and in seconds see its ATS score, the closest MEP job title, and an estimated market salary.',
    free: '100% free',
    privacy: '🔒 Your CV is analysed inside your browser only — it is never uploaded to a server.',
    drop: 'Drop your CV here or click to choose',
    types: 'PDF, Word, image (JPG/PNG) or scanned CV',
    ocr_load: 'Loading the image reader (first time only, ~10 s)...',
    ocr_run: 'Reading text from the image...',
    ocr_note: 'This CV was read as an image (OCR). Real ATS software usually cannot read it, so send a text PDF exported from Word instead. The results below are based on the recognised text and may contain reading errors.',
    paste: 'or paste your CV text',
    paste_ph: 'Paste your CV content here...',
    market: 'Job market',
    analyze: 'Analyse CV',
    analyzing: 'Analysing...',
    reading: 'Reading file...',
    err_read: "We couldn't read this file. Try another PDF or paste the text.",
    err_scan: "We couldn't extract readable text from this file. If it is a photo, try a clearer, closer one, or export your CV to PDF from Word.",
    err_empty: 'Upload your CV first (or paste the text).',
    err_type: 'Unsupported format. Upload a PDF, DOCX or an image (save old .doc files as DOCX in Word).',
    score: 'ATS score',
    score_good: 'Great — this CV is ready to send',
    score_ok: 'Good — needs a few fixes',
    score_bad: 'Weak — an ATS will likely reject it',
    best_role: 'Closest job title',
    other_roles: 'Other close matches',
    match: 'match',
    exp: 'Detected experience',
    years: 'years',
    level: 'Level',
    salary: 'Estimated salary',
    per_month: 'per month',
    salary_note: 'Rough estimate from public salary sources — actual pay varies by company, project and allowances.',
    checks: 'Check details',
    found_kw: 'Skills the engine found in your CV',
    cats: { design: 'Design', systems: 'Systems', fire: 'Fire', plumbing: 'Plumbing', software: 'Software', codes: 'Codes & standards', execution: 'Execution & BIM', office: 'Technical office', commercial: 'Commercial', management: 'Management', cert: 'Certifications' } as Record<string, string>,
    engine: 'MEP LAB ATS engine',
    model_prior: 'initial knowledge-graph version',
    model_trained: 'trained on {n} real job posts',
    salary_model: 'Learned from {n} real job posts that show pay, adjusted to your level.',
    alert_sce: 'KSA: Saudi Council of Engineers (SCE) accreditation is required by most employers and is not visible in your CV. Add it clearly if you hold it.',
    alert_syndicate: 'Egypt: Engineers Syndicate membership is not visible in your CV. Add it if you are a member.',
    alert_no_skills: 'The engine found no clear MEP skills. Name the software, systems and codes you worked with.',
    missing_kw: 'Missing keywords — add them if you have the experience',
    again: 'Check another CV',
    cta_t: 'Want to level up in this field?',
    cta_b: 'Browse courses',
    pages: 'pages',
    words: 'words',
    jobs_t: 'Jobs that fit you right now',
    jobs_all: 'All jobs',
    apply: 'Apply',
    today: 'Today',
    ago: '{n}d ago'
  }
};

const CHECKS: Record<string, { ar: [string, string]; en: [string, string] }> = {
  evidence: { ar: ['المهارات مدعومة بالخبرة', 'كتير من المهارات في قائمة Skills بس ومش ظاهرة في نقاط الخبرة. الـ ATS والمراجع البشري بيعتبروها ادعاء. اذكر كل مهارة مهمة في نقطة خبرة فعلية.'], en: ['Skills backed by experience', 'Many skills appear only in the Skills list, not in experience bullets — recruiters treat that as a claim. Mention every key skill inside a real experience bullet.'] },
  depth: { ar: ['تفاصيل كافية في الخبرة', 'نقاط الخبرة قليلة أو قصيرة. اكتب 3–6 نقاط لكل وظيفة، كل نقطة: فعل + نطاق الشغل + تفصيلة فنية + نتيجة.'], en: ['Enough detail in experience', 'Experience bullets are few or short. Write 3–6 bullets per role: action + scope + technical detail + result.'] },
  readable: { ar: ['النص مقروء للـ ATS', 'لو الـ CV صورة أو Scan، الـ ATS مش هيقراه. صدّره PDF من Word.'], en: ['Text is machine-readable', 'Scanned/image CVs cannot be parsed. Export a text PDF from Word.'] },
  email: { ar: ['إيميل موجود', 'ضيف إيميل احترافي في أول الـ CV.'], en: ['Email present', 'Add a professional email at the top.'] },
  phone: { ar: ['رقم تليفون موجود', 'ضيف رقمك بكود الدولة (+20 / +966).'], en: ['Phone number present', 'Add your number with country code.'] },
  linkedin: { ar: ['لينك LinkedIn', 'ضيف لينك بروفايل LinkedIn بتاعك.'], en: ['LinkedIn link', 'Add your LinkedIn profile URL.'] },
  summary: { ar: ['ملخص مهني (Summary)', 'ابدأ بـ 3–4 سطور تلخّص تخصصك وسنين خبرتك وأهم مهاراتك.'], en: ['Professional summary', 'Open with 3–4 lines on your specialty, years and top skills.'] },
  experience: { ar: ['قسم الخبرات', 'استخدم عنوان واضح زي "Work Experience".'], en: ['Experience section', 'Use a clear heading like "Work Experience".'] },
  education: { ar: ['قسم التعليم', 'ضيف قسم "Education" بالجامعة وسنة التخرج.'], en: ['Education section', 'Add an "Education" section with university and year.'] },
  skills: { ar: ['قسم المهارات', 'ضيف قسم "Skills" فيه البرامج والأكواد (Revit, HAP, NFPA...).'], en: ['Skills section', 'Add a "Skills" section listing software and codes.'] },
  dates: { ar: ['تواريخ الشغل واضحة', 'اكتب كل وظيفة بتاريخها: Jan 2021 – Present.'], en: ['Clear job dates', 'Date every role: Jan 2021 – Present.'] },
  length: { ar: ['طول مناسب', 'الأنسب 1–2 صفحة (حوالي 400–1000 كلمة).'], en: ['Good length', 'Aim for 1–2 pages (~400–1000 words).'] },
  metrics: { ar: ['إنجازات بأرقام', 'حط أرقام: عدد المشاريع، المساحات، الأطنان TR، نسب التوفير.'], en: ['Quantified achievements', 'Add numbers: projects, areas, TR, % savings.'] },
  keywords: { ar: ['كلمات مفتاحية للوظيفة', 'ضيف الكلمات الناقصة اللي تحت لو عندك الخبرة فيها.'], en: ['Role keywords', 'Add the missing keywords below if they apply to you.'] },
  language: { ar: ['مكتوب بالإنجليزي', 'أغلب أنظمة الـ ATS في الخليج بتتعامل أحسن مع CV إنجليزي.'], en: ['Written in English', 'Most ATS in the region work best with English CVs.'] },
  personal: { ar: ['من غير بيانات شخصية زيادة', 'شيل الديانة والحالة الاجتماعية و"References available".'], en: ['No unnecessary personal data', 'Remove religion, marital status and "References available".'] }
};

const ST: Record<CheckStatus, { icon: string; cls: string }> = {
  pass: { icon: '✓', cls: 'bg-green-100 text-green-700' },
  warn: { icon: '!', cls: 'bg-amber-100 text-amber-700' },
  fail: { icon: '✕', cls: 'bg-red-100 text-red-600' }
};

async function readPdf(buf: ArrayBuffer) {
  // Run pdf.js on the main thread (no Web Worker) — works in every browser,
  // sandboxed previews and file:// pages. CVs are small, so speed is fine.
  const [pdfjs, worker]: any[] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.mjs')
  ]);
  (globalThis as any).pdfjsWorker = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, useWorkerFetch: false }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    out += layoutText(tc.items as any[], vp.width) + '\n';
  }
  return { text: out, pages: doc.numPages, doc };
}

/**
 * Rebuild reading order from glyph positions. Multi-column CVs (sidebar + main)
 * are detected by a vertical gap with no text; each column is then read
 * top-to-bottom so that sidebar lines never interleave with experience lines.
 */
function layoutText(items: any[], pageWidth: number) {
  type It = { str: string; x: number; y: number; w: number; h: number };
  const its: It[] = items.filter((it) => it.str && it.str.trim()).map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: Math.abs(it.transform[3]) || 10 }));
  if (!its.length) return '';

  // find a column gap: a vertical band (>= 4% of width) crossed by almost no text
  const bins = 100, cover = new Array(bins).fill(0);
  for (const it of its) {
    const a = Math.max(0, Math.floor((it.x / pageWidth) * bins)), b = Math.min(bins - 1, Math.floor(((it.x + it.w) / pageWidth) * bins));
    for (let k = a; k <= b; k++) cover[k]++;
  }
  let split = -1;
  for (let k = 15, run = 0; k < 85; k++) {
    if (cover[k] <= Math.max(1, its.length * 0.004)) { run++; if (run >= 4) { split = ((k - run / 2) / bins) * pageWidth; } }
    else run = 0;
  }
  const columns: It[][] = [];
  if (split > 0) {
    const L = its.filter((it) => it.x + it.w / 2 < split), R = its.filter((it) => it.x + it.w / 2 >= split);
    if (L.length > 5 && R.length > 5) { columns.push(L, R); }
  }
  if (!columns.length) columns.push(its);

  return columns.map((col) => {
    // group into lines by y (tolerance half the font height), then sort by x
    col.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: It[][] = [];
    for (const it of col) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last[0].y - it.y) <= Math.max(3, last[0].h * 0.5)) last.push(it);
      else lines.push([it]);
    }
    return lines.map((ln) => ln.sort((a, b) => a.x - b.x).map((it, i, arr) => {
      if (i === 0) return it.str;
      const prev = arr[i - 1], gap = it.x - (prev.x + prev.w);
      return (gap > prev.h * 0.25 ? ' ' : '') + it.str; // glue split glyph runs, space real gaps
    }).join('')).join('\n');
  }).join('\n\n');
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

async function readDocx(buf: ArrayBuffer) {
  const mammoth: any = await import('mammoth/mammoth.browser');
  const r = await mammoth.extractRawText({ arrayBuffer: buf });
  return { text: r.value as string, pages: 0 };
}

export default function CvChecker({ locale, coursesHref = '/courses', jobsHref = '/jobs', loginHref = '/login', whatsapp, courses = [], playerUrl, playerVersion, facebook, hrefBase = '' }: {
  locale: Loc; coursesHref?: string; jobsHref?: string; loginHref?: string; whatsapp?: string; courses?: CourseLite[]; playerUrl?: string; playerVersion?: string; facebook?: string; hrefBase?: string;
}) {
  const t = T[locale];
  const [market, setMarket] = useState<Market>('eg');
  const [file, setFile] = useState<File | null>(null);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [res, setRes] = useState<CvResult | null>(null);
  const [drag, setDrag] = useState(false);
  const [needFile, setNeedFile] = useState(false);
  const [ocrUsed, setOcrUsed] = useState(false);
  const [user, setUser] = useState<GateUser | null | undefined>(undefined);
  const [pending, setPending] = useState<{ text: string; pages: number; market: Market } | null>(null);
  useEffect(() => { currentUser().then(setUser).catch(() => setUser(null)); }, []);
  const [jobs, setJobs] = useState<any[]>([]);
  const [cvText, setCvText] = useState('');
  const [jd, setJd] = useState('');
  const [model, setModel] = useState<AtsModel>(defaultModel);

  // load the latest trained MEP LAB ATS model (falls back to the built-in one)
  useEffect(() => {
    const m = (window as any).__ATS_MODEL__;
    if (m) { setModel(m); return; }
    fetch('/api/ats/model').then((r) => r.json()).then((d) => { if (d?.weights) setModel(d); }).catch(() => {});
  }, []);

  // came back from login: restore the CV and re-run the analysis
  useEffect(() => {
    try {
      if (!location.search.includes('resume=1')) return;
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_KEY);
      const p = JSON.parse(raw);
      if (p.market) setMarket(p.market);
      setPaste(p.text || '');
      currentUser().then((u) => { if (u) finish(p.text || '', 0, p.market || 'eg', u); else run({ text: p.text || '', market: p.market || 'eg' }); });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // after analysis: load matching jobs for the detected role & market
  useEffect(() => {
    if (!res) { setJobs([]); return; }
    const role = res.roles[0].role.id;
    const mock = (window as any).__JOBS_MOCK__ as any[] | undefined;
    if (mock) { setJobs(mock.filter((j) => j.market === market && j.role_id === role).slice(0, 5)); return; }
    fetch(`/api/jobs?market=${market}&role=${role}&limit=5`)
      .then((r) => r.json()).then((d) => setJobs(d.jobs || [])).catch(() => setJobs([]));
  }, [res, market]);
  const inp = useRef<HTMLInputElement>(null);

  async function run(override?: { text: string; market: Market }) {
    setErr('');
    const mkt = override?.market || market;
    if (!override && !file && !paste.trim()) { setNeedFile(true); setTimeout(() => setNeedFile(false), 2500); return setErr(t.err_empty); }
    if (file && !override && !/\.(pdf|docx|txt|png|jpe?g|webp|bmp|gif|tiff?|heic|heif)$/i.test(file.name) && !file.type.startsWith('image/')) return setErr(t.err_type);
    try {
      let text = override?.text ?? paste, pages = 0;
      if (file && !override) {
        setBusy(t.reading);
        const buf = await file.arrayBuffer();
        const n = file.name.toLowerCase();
        const isImg = /\.(png|jpe?g|webp|bmp|gif|tiff?|heic|heif)$/i.test(n) || file.type.startsWith('image/');
        const prog = (pct: number, stage: 'load' | 'ocr') => setBusy(stage === 'load' ? t.ocr_load : `${t.ocr_run} ${pct}%`);
        if (isImg) {
          setBusy(t.ocr_load);
          text = await withTimeout(ocrImageFile(file, prog), 180000); pages = 1;
        } else {
          const r: any = n.endsWith('.pdf') ? await withTimeout(readPdf(buf), 30000) : n.endsWith('.docx') ? await withTimeout(readDocx(buf), 30000) : { text: new TextDecoder().decode(buf), pages: 0 };
          text = r.text; pages = r.pages;
          // scanned PDF (no text layer) → OCR the pages
          if (r.doc && text.trim().length < 40) {
            setBusy(t.ocr_load);
            text = await withTimeout(ocrPdfPages(r.doc, prog), 240000);
            setOcrUsed(true);
          }
        }
        if (isImg) setOcrUsed(true);
      }
      if (!text || text.trim().length < 20) { setBusy(''); return setErr(t.err_scan); }
      // membership gate: the result is shown only to signed-up members (email code / Google)
      const u = user === undefined ? await currentUser().catch(() => null) : user;
      if (!u) {
        try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ text, market: mkt })); } catch {}
        setPending({ text, pages, market: mkt }); setBusy('');
        setTimeout(() => document.getElementById('cv-gate')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        return;
      }
      await finish(text, pages, mkt, u);
    } catch (e) {
      console.error(e);
      setErr(t.err_read);
    } finally {
      setBusy('');
    }
  }

  async function finish(text: string, pages: number, mkt: Market, u: GateUser) {
    setBusy(t.analyzing);
    await new Promise((r) => setTimeout(r, 450));
    setCvText(text);
    const r = analyzeCv(text, mkt, pages, model);
    setRes(r); setBusy(''); setPending(null);
    // record the lead (email + result) — never the CV text
    try {
      if (!(window as any).__AUTH_MOCK__) {
        fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_id: r.roles[0].role.id, market: mkt, score: r.score, years: r.years, level: r.level, name: u.name }) }).catch(() => {});
        // keep the member profile up to date with the latest check (+ flush a Google sign-up draft if any)
        let extra: any = {};
        try { const d = sessionStorage.getItem('meplab_profile_draft'); if (d) { extra = JSON.parse(d); sessionStorage.removeItem('meplab_profile_draft'); } } catch {}
        fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...extra, last_ats: r.score, detected_role: r.roles[0].role.id, detected_years: r.years, market: extra.market || mkt, check: true }) }).catch(() => {});
      }
    } catch {}
    setTimeout(() => document.getElementById('cv-result')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  const cur = MARKETS[market][locale === 'ar' ? 'cur_ar' : 'cur_en'];
  const fmt = (n: number) => n.toLocaleString('en-US');

  /* ---------- membership gate ---------- */
  if (!res && pending)
    return (
      <div id="cv-gate" className="scroll-mt-24">
        <EmailGate locale={locale} defaultMarket={pending.market} onDone={(u) => { setUser(u); finish(pending.text, pending.pages, pending.market, u); }} />
      </div>
    );

  /* ---------- form ---------- */
  if (!res)
    return (
      <div className="card mx-auto max-w-3xl p-6 md:p-8">
        <div
          onClick={() => inp.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? 'border-brand-blue bg-blue-50' : needFile ? 'animate-pulse border-red-400 bg-red-50' : file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-brand-blue hover:bg-slate-50'}`}
        >
          <input ref={inp} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-2xl text-white">{file ? '✓' : '⬆'}</div>
          <div className="mt-4 font-bold text-brand-navy">{file ? file.name : t.drop}</div>
          <div className="mt-1 text-sm text-slate-500">{t.types}</div>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-blue">{t.paste}</summary>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={7} placeholder={t.paste_ph} className="input mt-3" dir="auto" />
        </details>

        <div className="mt-6">
          <div className="label">{t.market}</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(MARKETS) as Market[]).map((m) => (
              <button key={m} type="button" onClick={() => setMarket(m)}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${market === m ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {MARKETS[m][locale === 'ar' ? 'name_ar' : 'name_en']}
              </button>
            ))}
          </div>
        </div>

        {err && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">⚠️ {err}</p>}
        <button onClick={() => run()} disabled={!!busy} className="btn-red mt-6 w-full py-3 text-lg">
          {busy ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {busy}</> : t.analyze}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">{t.privacy}</p>
      </div>
    );

  /* ---------- result ---------- */
  const top = res.roles[0];
  const others = res.roles.slice(1, 4).filter((r) => r.pct > 10);
  const col = res.score >= 75 ? '#16a34a' : res.score >= 50 ? '#f59e0b' : '#E53935';
  const verdict = res.score >= 75 ? t.score_good : res.score >= 50 ? t.score_ok : t.score_bad;
  const R = 54, C = 2 * Math.PI * R;
  const sorted = [...res.checks].sort((a, b) => ({ fail: 0, warn: 1, pass: 2 }[a.status] - { fail: 0, warn: 1, pass: 2 }[b.status]));

  return (
    <div id="cv-result" className="mx-auto max-w-5xl scroll-mt-24 space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* score */}
        <div className="card flex flex-col items-center p-6 text-center">
          <div className="text-sm font-bold text-slate-500">{t.score}</div>
          <svg viewBox="0 0 128 128" className="my-3 h-40 w-40 -rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <circle cx="64" cy="64" r={R} fill="none" stroke={col} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - res.score / 100)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x="64" y="64" transform="rotate(90 64 64)" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#0B1B3A">{res.score}</text>
          </svg>
          <div className="font-bold" style={{ color: col }}>{verdict}</div>
          <div className="mt-1 text-xs text-slate-500">{fmt(res.words)} {t.words}</div>
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
            🧠 {t.engine} <span dir="ltr">v{res.model.version}</span> · {res.model.jobs_used ? t.model_trained.replace('{n}', fmt(res.model.jobs_used)) : t.model_prior}
          </div>
        </div>

        {/* role */}
        <div className="card p-6">
          <div className="text-sm font-bold text-slate-500">{t.best_role}</div>
          <div className="mt-2 text-xl font-extrabold leading-snug text-brand-navy">{locale === 'ar' ? top.role.ar : top.role.en}</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${top.pct}%` }} /></div>
            <span className="text-sm font-black text-brand-blue">{top.pct}%</span>
          </div>
          {others.length > 0 && (
            <>
              <div className="mt-5 text-xs font-bold text-slate-500">{t.other_roles}</div>
              <ul className="mt-2 space-y-2">
                {others.map((r) => (
                  <li key={r.role.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-700">{locale === 'ar' ? r.role.ar : r.role.en}</span>
                    <span className="font-bold text-slate-500">{r.pct}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* salary */}
        <div className="card relative overflow-hidden bg-brand-navy p-6 text-white ring-0">
          <div className="bg-grid absolute inset-0 opacity-60" />
          <div className="relative">
            <div className="text-sm font-bold text-slate-300">{t.salary} — {MARKETS[market][locale === 'ar' ? 'name_ar' : 'name_en']}</div>
            <div className="mt-3 text-3xl font-black leading-tight">
              <span dir="ltr">{fmt(res.salary.min)} – {fmt(res.salary.max)}</span>
              <span className="ms-2 text-base font-bold text-red-300">{cur}</span>
            </div>
            <div className="text-sm text-slate-300">{t.per_month}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-300">{t.exp}</div><div className="font-bold">{res.years} {t.years}</div></div>
              <div className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-300">{t.level}</div><div className="font-bold">{LEVELS[res.level][locale]}</div></div>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">{res.salary.source === 'model' ? t.salary_model.replace('{n}', String(res.salary.n)) : t.salary_note}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* checks */}
        <div className="card p-6 lg:col-span-3">
          <h3 className="mb-4 text-lg font-bold text-brand-navy">{t.checks}</h3>
          <ul className="space-y-3">
            {sorted.map((c) => {
              const [title, tip] = CHECKS[c.id][locale];
              return (
                <li key={c.id} className="flex gap-3">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${ST[c.status].cls}`}>{ST[c.status].icon}</span>
                  <div>
                    <div className={`font-semibold ${c.status === 'pass' ? 'text-slate-600' : 'text-brand-navy'}`}>{title}</div>
                    {c.status !== 'pass' && <div className="text-sm text-slate-500">{tip}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* keywords */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h3 className="mb-3 font-bold text-brand-navy">{t.missing_kw}</h3>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {top.missing.map((k) => <span key={k} className="rounded-lg border border-dashed border-red-300 bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700">+ {k}</span>)}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="mb-3 font-bold text-brand-navy">{t.found_kw} ({res.skills.length})</h3>
            <div className="space-y-3">
              {Object.entries(res.skills.reduce((g: Record<string, typeof res.skills>, k) => ((g[k.cat] ||= []).push(k), g), {})).map(([cat, list]) => (
                <div key={cat}>
                  <div className="mb-1 text-xs font-bold text-slate-400">{t.cats[cat as Cat]}</div>
                  <div className="flex flex-wrap gap-1.5" dir="ltr">
                    {list.map((k) => <span key={k.id} title={k.evidence} className="cursor-help rounded-lg bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">✓ {k.label}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card bg-gradient-to-br from-brand-red to-[#b71c1c] p-6 text-white ring-0">
            <div className="font-bold">{t.cta_t}</div>
            <a href={coursesHref} className="btn mt-3 bg-white text-brand-red hover:bg-red-50">{t.cta_b}</a>
          </div>
        </div>
      </div>

      {ocrUsed && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">📷 {t.ocr_note}</p>}

      {res.alerts.length > 0 && (
        <div className="space-y-2">
          {res.alerts.map((a) => <p key={a} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">⚠️ {(t as any)[`alert_${a}`]}</p>)}
        </div>
      )}

      <CvSave file={file} locale={locale} profileHref={`${hrefBase}/profile`} />
      <CvRewrite locale={locale} text={cvText} res={res} market={market} model={model} whatsapp={whatsapp} />

      <JdMatch locale={locale} cvText={cvText} years={res.years} jd={jd} setJd={setJd} />

      <AiReview locale={locale} text={cvText} res={res} market={market} jd={jd} loginHref={loginHref} />

      {jobs.length > 0 && (
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-xl font-extrabold text-brand-navy">💼 {t.jobs_t}</h3>
            <a href={`${jobsHref}?market=${market}&role=${top.role.id}`} className="text-sm font-bold text-brand-blue">{t.jobs_all} {locale === 'ar' ? '←' : '→'}</a>
          </div>
          <div className="space-y-3">
            {jobs.map((j) => <JobCard key={j.id} j={j} locale={locale} applyLabel={t.apply} when={ago(j.posted_at, locale, t.today, t.ago)} />)}
          </div>
        </div>
      )}

      <AboutMeplab locale={locale} courses={courses} playerUrl={playerUrl} playerVersion={playerVersion} facebook={facebook} whatsapp={whatsapp}
        hrefs={{ courses: coursesHref, course: (slug) => `${hrefBase}/courses/${slug}`, download: `${hrefBase}/download`, tools: `${hrefBase}/tools` }} />

      <div className="text-center">
        <button onClick={() => { setRes(null); setFile(null); setPaste(''); setJd(''); setOcrUsed(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-ghost">↺ {t.again}</button>
      </div>
    </div>
  );
}
