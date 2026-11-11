'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSpeech, speechSupported } from './useSpeech';
import { tasksFor } from '@/lib/cv/taskBank';
import { buildFromData, emptyData, emptyJob, jobLines, type BuilderData, type Job } from '@/lib/cv/builder';
import { polishBullet } from '@/lib/cv/rebuild';
import { suggestCompany, suggestCity, suggestTitle, type NameHint } from '@/lib/cv/names';
import { analyzeCv } from '@/lib/cv/analyze';
import { buildDocx, buildPrintHtml } from '@/lib/cv/export';
import { roleGroups, MARKETS, type Market } from '@/lib/cv/data';

type Loc = 'ar' | 'en';
const KEY = 'meplab_cv_builder_v1';

const T = {
  ar: {
    steps: ['بياناتك', 'الوظيفة', 'الخبرة', 'التعليم', 'الـ CV'],
    next: 'التالي', back: 'رجوع', speakLang: 'هتتكلم بأنهي لغة؟', en: 'إنجليزي', ar: 'عربي مصري (هنترجمه للإنجليزي)',
    mic: 'اتكلم', stop: 'خلاص', listening: 'بسمعك…', noMic: 'المتصفح ده مش بيدعم الكلام. افتح الصفحة من Chrome، أو اكتب عادي.',
    denied: 'لازم تسمح للموقع يستخدم المايك. دوس على علامة القفل جنب اللينك واختار Allow.',
    failed: 'المايك ما اشتغلش. جرّب تاني أو اكتب.',
    name: 'الاسم بالإنجليزي زي ما هتكتبه في الـ CV', phone: 'رقم الموبايل', email: 'الإيميل', city: 'المدينة والدولة', linkedin: 'لينك لينكدإن (اختياري)',
    role: 'الوظيفة اللي بتقدّم عليها', pick: 'اختار…', market: 'هتقدّم فين؟',
    job: 'وظيفة', title: 'المسمّى الوظيفي (قوله عربي أو إنجليزي)', company: 'اسم الشركة', jcity: 'المدينة', from: 'من', to: 'لحد', present: 'لسه شغال هنا',
    picks: 'علّم على اللي عملته فعلًا في الشغلانة دي', said: 'احكي بصوتك عملت إيه كمان',
    saidHint: 'اتكلم براحتك: المشروع كان إيه، كنت مسؤول عن إيه، وأي أرقام (عدد أدوار، مساحات، فريق، ميزانية). كل جملة هتبقى سطر في الـ CV.',
    understood: 'اللي فهمناه (ده اللي هيتكتب في الـ CV، وتقدر تعدّله)',
    nameKnown: 'الاسم بالإنجليزي:', nameGuess: 'كتابة تقريبية بالإنجليزي (اتأكد من الاسم الرسمي):',
    lookup: 'دوّر عليها في لينكدإن', lookupD: 'مش متأكد من الاسم الرسمي؟ هتلاقيه مكتوب على صفحة الشركة أو في عقدك.',
    ai: 'حسّن الصياغة بالذكاء الاصطناعي', aiBusy: 'بيفكّر…', aiNote: 'هنبعت الجمل دي بس لخدمة Gemini من جوجل عشان تتفهم وتتترجم بدقة أعلى، من غير اسمك أو رقمك أو إيميلك.',
    aiDone: 'اتحسّنت الصياغة. راجع كل سطر.', aiUnclear: 'الذكاء الاصطناعي ماقدرش يفهم الجملة دي من غير ما يخمّن، فسيبناها زي ما هي.', aiErr: 'الخدمة مشغولة دلوقتي. جرّب كمان شوية.', aiTag: 'ذكاء اصطناعي', fromAr: 'اتترجم من كلامك:', unknownW: 'كلمات مفهمناهاش:', unknownD: 'عدّل السطر بإيدك أو قوله تاني بشكل أوضح.',
    similarT: 'فيه صياغة جاهزة قريبة:', useIt: 'استخدمها', undo: 'رجّع كلامي', facts: 'معلومات طلعناها:', drop: 'شيل السطر ده',
    addJob: '+ ضيف وظيفة تانية', removeJob: 'شيل الوظيفة دي', noExp: 'لسه متخرج ومعنديش خبرة', noExpD: 'تمام. احكيلنا عن مشروع التخرج وأي تدريب صيفي عملته، دول بيعوّضوا الخبرة في الـ CV.',
    proj: 'مشروع / تدريب', ptitle: 'اسم المشروع أو التدريب (مثال: Graduation Project – HVAC Design of a Hospital)', porg: 'الجامعة أو الشركة اللي اتدربت فيها',
    psaid: 'احكي بصوتك عملت إيه في المشروع أو التدريب', addProj: '+ ضيف مشروع أو تدريب تاني', removeProj: 'شيل ده',
    badDate: 'تاريخ «لحد» لازم يكون بعد تاريخ «من».', tipsH: 'عشان الـ CV يبقى أقوى',
    tipNum: 'مفيش ولا رقم في الخبرة. زوّد أرقام زي عدد الأدوار، المساحة، حجم الفريق أو قيمة المشروع.',
    tipFew: 'السطور قليلة. الـ CV القوي فيه من ٤ لـ ٦ سطور لكل وظيفة.',
    tipSkills: 'ضيف البرامج اللي بتشتغل عليها (Revit، AutoCAD، Navisworks…). الـ ATS بيدوّر عليها بالاسم.',
    tipSummary: 'الملخص اتكتب من كلامك. اقراه واتأكد إنه بيوصفك صح.',
    tipMissing: 'كلمات مهمة للوظيفة دي مش موجودة:', checkD: 'هيفتح فاحص الـ CV على النسخة دي ويطلعلك تقرير كامل.',
    degree: 'المؤهل (مثال: B.Sc. Mechanical Engineering)', school: 'الجامعة', year: 'سنة التخرج',
    skills: 'البرامج والمهارات (افصل بفاصلة)', certs: 'الكورسات والشهادات (كل واحدة في سطر)', langs: 'اللغات',
    build: 'اعمل الـ CV', score: 'نتيجة الـ ATS', top: 'أقرب وظيفة', word: 'نزّله Word', pdf: 'نزّله PDF', check: 'افحصه بالتفصيل', edit: 'عدّل',
    note: 'الـ CV ده مكتوب من كلامك إنت بس. راجعه كويس قبل ما تبعته، وزوّد أي أرقام تعرفها.',
    privacy: 'كل اللي بتكتبه بيفضل على جهازك ومش بيتبعتلنا. تحويل الصوت لكلام بيتم عن طريق خدمة المتصفح (في كروم دي خدمة جوجل)، وإحنا مش بنسجّل صوتك.',
    reset: 'ابدأ من الأول', required: 'اكتب اسمك الأول.'
  },
  en: {
    steps: ['Details', 'Target', 'Experience', 'Education', 'CV'],
    next: 'Next', back: 'Back', speakLang: 'Which language will you speak?', en: 'English', ar: 'Egyptian Arabic (we translate it)',
    mic: 'Speak', stop: 'Done', listening: 'Listening…', noMic: 'This browser has no speech support. Open the page in Chrome, or type.',
    denied: 'Allow microphone access: click the lock icon next to the address and choose Allow.',
    failed: 'The microphone did not start. Try again or type.',
    name: 'Full name as it should appear on the CV', phone: 'Mobile', email: 'Email', city: 'City and country', linkedin: 'LinkedIn link (optional)',
    role: 'The job you are applying for', pick: 'Choose…', market: 'Where will you apply?',
    job: 'Job', title: 'Job title', company: 'Company', jcity: 'City', from: 'From', to: 'To', present: 'I still work here',
    picks: 'Tick what you actually did in this job', said: 'Say what else you did',
    saidHint: 'Talk freely: the project, what you were responsible for, and any numbers (floors, areas, team size, budget). Each sentence becomes a CV line.',
    understood: 'What we understood (this goes in the CV; you can edit it)',
    nameKnown: 'English name:', nameGuess: 'Approximate English spelling (check the official name):',
    lookup: 'Search it on LinkedIn', lookupD: 'Not sure of the official name? It is on the company page or your contract.',
    ai: 'Improve the wording with AI', aiBusy: 'Thinking…', aiNote: 'Only these sentences are sent to Google Gemini to understand and translate them more accurately, without your name, phone or email.',
    aiDone: 'Wording improved. Check every line.', aiUnclear: 'The AI could not understand this sentence without guessing, so we left it as it was.', aiErr: 'The service is busy. Try again in a bit.', aiTag: 'AI', fromAr: 'Translated from what you said:', unknownW: 'Words we did not get:', unknownD: 'Edit the line or say it again more clearly.',
    similarT: 'A ready line is close to this:', useIt: 'Use it', undo: 'Back to my words', facts: 'Facts we picked up:', drop: 'Remove this line',
    addJob: '+ Add another job', removeJob: 'Remove this job', noExp: 'Fresh graduate, no experience yet', noExpD: 'Fine. Tell us about your graduation project and any summer training. They stand in for experience on your CV.',
    proj: 'Project / training', ptitle: 'Project or training name (e.g. Graduation Project – HVAC Design of a Hospital)', porg: 'University or training company',
    psaid: 'Say what you did in this project or training', addProj: '+ Add another project or training', removeProj: 'Remove this',
    badDate: 'The "To" date has to be after the "From" date.', tipsH: 'To make this CV stronger',
    tipNum: 'There are no numbers in your experience. Add floors, area, team size or project value.',
    tipFew: 'Only a few lines. A strong CV has 4 to 6 lines per job.',
    tipSkills: 'Add the software you use (Revit, AutoCAD, Navisworks…). ATS systems search for them by name.',
    tipSummary: 'The summary was written from what you said. Read it and make sure it describes you.',
    tipMissing: 'Important keywords for this role that are missing:', checkD: 'Opens the CV checker on this version for a full report.',
    degree: 'Degree (e.g. B.Sc. Mechanical Engineering)', school: 'University', year: 'Graduation year',
    skills: 'Software and skills (comma separated)', certs: 'Courses and certificates (one per line)', langs: 'Languages',
    build: 'Build my CV', score: 'ATS score', top: 'Closest job', word: 'Download Word', pdf: 'Download PDF', check: 'Full check', edit: 'Edit',
    note: 'This CV is written only from what you said. Read it before sending and add any numbers you know.',
    privacy: 'Everything you type stays on your device and is never sent to us. Speech is turned into text by your browser\'s speech service (Google in Chrome); we never record your voice.',
    reset: 'Start over', required: 'Enter your name first.'
  }
};

function Mic({ t, lang, onText, size = 'sm' }: { t: typeof T.ar; lang: string; onText: (s: string) => void; size?: 'sm' | 'lg' }) {
  const s = useSpeech(onText);
  const [supported, setSupported] = useState(false); // decided after hydration, so server and client render the same
  useEffect(() => setSupported(speechSupported()), []);
  if (!supported) return null;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => (s.listening ? s.stop() : s.start(lang))}
        className={`${s.listening ? 'btn-red' : 'btn-ghost'} ${size === 'lg' ? 'px-5 py-3 text-base' : 'btn-sm'} gap-2`}
        aria-pressed={s.listening} aria-label={s.listening ? t.stop : t.mic}>
        <svg viewBox="0 0 24 24" className={`h-5 w-5 ${s.listening ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        {s.listening ? t.stop : t.mic}
      </button>
      {s.listening && <span className="text-xs text-ink-mute" role="status">{s.interim || t.listening}</span>}
      {s.error === 'denied' && <span className="text-xs font-semibold text-brand-red" role="alert">{t.denied}</span>}
      {s.error === 'failed' && <span className="text-xs font-semibold text-brand-red" role="alert">{t.failed}</span>}
    </span>
  );
}

function Understood({ j, roleId, t, ai, onEdit, onReset, onBulk }: { j: Job; roleId: string; t: typeof T.ar; ai: boolean; onEdit: (orig: string, text: string) => void; onReset: (orig: string) => void; onBulk: (e: Record<string, string>) => void }) {
  const lines = useMemo(() => jobLines(j, roleId), [j.said, j.edits, roleId]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [aiLines, setAiLines] = useState<Record<string, 'ok' | 'unclear'>>({});
  if (!lines.length) return null;
  async function improve() {
    const todo = lines.filter((l) => !l.edited || aiLines[l.orig] === 'ok');
    if (!todo.length) return;
    setBusy(true); setMsg('');
    try {
      const r = await fetch('/api/cv-builder/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines: todo.map((l) => l.orig), roleId }) });
      const data = await r.json();
      if (!r.ok || !Array.isArray(data.lines)) throw new Error();
      const edits: Record<string, string> = {}; const marks: Record<string, 'ok' | 'unclear'> = {};
      todo.forEach((l, i) => { const o = data.lines[i]; if (o && !o.unclear && o.text) { edits[l.orig] = o.text; marks[l.orig] = 'ok'; } else marks[l.orig] = 'unclear'; });
      onBulk(edits); setAiLines((x) => ({ ...x, ...marks })); setMsg(t.aiDone);
    } catch { setMsg(t.aiErr); }
    setBusy(false);
  }
  return (
    <div className="mt-4 rounded-sheet border border-line bg-paper/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold text-ink">{t.understood}</div>
        {ai && <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={improve}>{busy ? t.aiBusy : t.ai}</button>}
      </div>
      {ai && <p className="mt-1 text-xs leading-5 text-ink-mute">{t.aiNote}</p>}
      {msg && <p className="mt-2 text-xs font-semibold text-ink-soft" role="status">{msg}</p>}
      <ul className="mt-3 space-y-3">
        {lines.map((l) => {
          const dropped = l.edited && l.text === '';
          const chips = [...l.facts.numbers, ...l.facts.buildings, ...l.facts.systems, ...l.facts.tools];
          return (
            <li key={l.orig} className={`rounded-sheet bg-white p-3 ring-1 ${l.unknown.length && !l.edited ? 'ring-brand-amber' : 'ring-line'} ${dropped ? 'opacity-50' : ''}`}>
              {(l.translated || aiLines[l.orig]) && <div className="mb-1 text-xs text-ink-mute" dir="rtl">{aiLines[l.orig] === 'ok' && <span className="badge me-1 bg-ink/5 text-ink-soft">{t.aiTag}</span>}{t.fromAr} «{l.orig}»</div>}
              {aiLines[l.orig] === 'unclear' && <p className="mb-1 text-xs font-semibold text-brand-amber" role="note">{t.aiUnclear}</p>}
              <textarea className="input min-h-[5rem] resize-y leading-6" rows={3} dir="ltr" value={l.edited ? l.text : polishBullet(l.text).replace(/\.$/, '')} aria-label={t.understood}
                onChange={(e) => onEdit(l.orig, e.target.value)} />
              {chips.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs" dir="ltr"><span className="text-ink-mute" dir="rtl">{t.facts}</span>{chips.map((c) => <span key={c} className="badge bg-ink/5 text-ink-soft">{c}</span>)}</div>}
              {l.unknown.length > 0 && !l.edited && <p className="mt-2 text-xs font-semibold text-brand-amber" role="note">{t.unknownW} {l.unknown.join('، ')}. {t.unknownD}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                {l.similar && !l.edited && (
                  <div className="w-full rounded-sheet bg-paper p-2.5">
                    <div className="text-ink-mute">{t.similarT}</div>
                    <div dir="ltr" className="mt-1 font-semibold text-ink-soft">{l.similar}</div>
                    <button type="button" className="mt-1 font-bold text-brand-red underline" onClick={() => onEdit(l.orig, l.similar!)}>{t.useIt}</button>
                  </div>
                )}
                {l.edited && <button type="button" className="font-semibold text-ink-mute underline" onClick={() => { onReset(l.orig); setAiLines((x) => { const y = { ...x }; delete y[l.orig]; return y; }); }}>{t.undo}</button>}
                {!dropped && <button type="button" className="font-semibold text-ink-mute underline" onClick={() => onEdit(l.orig, '')}>{t.drop}</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Field({ label, value, onChange, t, lang, type = 'text', dir, mic = true, suggest, lookup }: { label: string; value: string; onChange: (v: string) => void; t: typeof T.ar; lang: string; type?: string; dir?: string; mic?: boolean; suggest?: (v: string) => NameHint; lookup?: boolean }) {
  const hint = suggest && value ? suggest(value) : null;
  return (
    <div>
      <label className="block">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="mt-1 flex items-start gap-2">
          <input className="input flex-1" type={type} dir={dir} value={value} onChange={(e) => onChange(e.target.value)} />
          {mic && <Mic t={t} lang={lang} onText={(s) => onChange(s)} />}
        </span>
      </label>
      {hint && (
        <div className={`mt-1.5 rounded-sheet p-2 text-xs ${hint.known ? 'bg-sys-plumb/10' : 'bg-brand-amber/10'}`}>
          <span className="text-ink-soft">{hint.known ? t.nameKnown : t.nameGuess}</span>{' '}
          <span dir="ltr" className="font-bold text-ink">{hint.value}</span>{' '}
          <button type="button" className="font-bold text-brand-red underline" onClick={() => onChange(hint.value)}>{t.useIt}</button>
          {!hint.known && lookup && (
            <div className="mt-1 text-ink-soft">
              {t.lookupD}{' '}
              <a className="font-bold text-ink underline" target="_blank" rel="noopener" href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(value.replace(/^(?:شركة|شركه)\s+/, ''))}`}>{t.lookup}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CvBuilder({ locale }: { locale: Loc }) {
  const t = T[locale];
  const ar = locale === 'ar';
  const [d, setD] = useState<BuilderData>(emptyData);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('en-US');
  const [noExp, setNoExp] = useState(false);
  const [err, setErr] = useState('');
  const [hasMic, setHasMic] = useState(true);
  const [aiOn, setAiOn] = useState(false);
  useEffect(() => { fetch('/api/cv-builder/ai').then((r) => r.json()).then((j) => setAiOn(!!j?.enabled)).catch(() => {}); }, []);

  useEffect(() => {
    setHasMic(speechSupported());
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s?.d) { setD({ ...emptyData(), ...s.d }); setStep(s.step || 0); setNoExp(!!s.noExp); } } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ d, step, noExp })); } catch {} }, [d, step, noExp]);

  const set = (patch: Partial<BuilderData>) => setD((x) => ({ ...x, ...patch }));
  const setJob = (i: number, patch: Partial<Job>) => setD((x) => ({ ...x, jobs: x.jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)) }));
  const tasks = useMemo(() => tasksFor(d.roleId), [d.roleId]);

  const out = useMemo(() => (step === 4 ? buildFromData(d, noExp) : null), [step, d, noExp]);
  const res = useMemo(() => (out ? analyzeCv(out.text, d.market) : null), [out, d.market]);

  function go(n: number) {
    if (n > 0 && step === 0 && !d.name.trim()) { setErr(t.required); return; }
    if (n > step && step === 2 && d.jobs.some((j) => j.from && !j.present && j.to && j.to < j.from)) { setErr(t.badDate); return; }
    setErr(''); setStep(n); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const tips = useMemo(() => {
    if (!out || !res) return [] as string[];
    const L: string[] = [];
    const bl = [...(out.model.experience || []), ...(out.model.projects || [])].flatMap((e) => e.bullets);
    if (bl.length && !bl.some((b) => /\d/.test(b))) L.push(t.tipNum);
    const n = Math.max(1, d.jobs.length);
    if (bl.length / n < 4) L.push(t.tipFew);
    if (!d.skills.trim()) L.push(t.tipSkills);
    const miss = (res.roles[0]?.missing || []).slice(0, 6);
    if (miss.length) L.push(`${t.tipMissing}|${miss.join(', ')}`);
    L.push(t.tipSummary);
    return L;
  }, [out, res, d.jobs.length, d.skills, t, ar]);
  function check() {
    if (!out) return;
    try { sessionStorage.setItem('meplab_cv_handoff', JSON.stringify({ text: out.text, market: d.market })); } catch {}
    window.location.href = '/cv-check';
  }
  async function word() {
    if (!out) return;
    const blob = await buildDocx(out.model, out.summary);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(d.name || 'CV').replace(/[^\w ]+/g, '').trim() || 'CV'} - CV (MEP LAB).docx`; a.click();
  }
  function pdf() {
    if (!out) return;
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(buildPrintHtml(out.model, out.summary)); w.document.close();
  }

  return (
    <div className="card p-6 md:p-8">
      {/* steps */}
      <ol className="mb-8 grid grid-cols-5 gap-2 text-center text-xs font-semibold sm:text-sm" aria-label={ar ? 'الخطوات' : 'Steps'}>
        {t.steps.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => (i <= step || d.name ? go(i) : null)} aria-current={i === step ? 'step' : undefined}
              className={`w-full rounded-sheet border-b-4 px-1 pb-2 pt-1 ${i === step ? 'border-brand-red text-ink' : i < step ? 'border-ink/40 text-ink-soft' : 'border-line text-ink-mute'}`}>
              <span className="display block text-xl">{i + 1}</span>{s}
            </button>
          </li>
        ))}
      </ol>

      {step < 4 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-sheet bg-paper p-3 text-sm">
          {hasMic ? (
            <>
              <span className="font-semibold text-ink">{t.speakLang}</span>
              {[['en-US', t.en], ['ar-EG', t.ar]].map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5"><input type="radio" name="lang" className="accent-brand-red" checked={lang === v} onChange={() => setLang(v)} />{l}</label>
              ))}
            </>
          ) : <span className="text-ink-soft">{t.noMic}</span>}
        </div>
      )}

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field t={t} lang={lang} label={t.name} value={d.name} onChange={(v) => set({ name: v })} dir="ltr" /></div>
          <Field t={t} lang={lang} label={t.phone} value={d.phone} onChange={(v) => set({ phone: v })} type="tel" dir="ltr" mic={false} />
          <Field t={t} lang={lang} label={t.email} value={d.email} onChange={(v) => set({ email: v })} type="email" dir="ltr" mic={false} />
          <Field t={t} lang={lang} label={t.city} value={d.location} onChange={(v) => set({ location: v })} dir="auto" suggest={suggestCity} />
          <Field t={t} lang={lang} label={t.linkedin} value={d.linkedin} onChange={(v) => set({ linkedin: v })} dir="ltr" mic={false} />
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">{t.role}</span>
            <select className="input mt-1" value={d.roleId} onChange={(e) => set({ roleId: e.target.value })}>
              <option value="">{t.pick}</option>
              {roleGroups(locale).map((g) => <optgroup key={g.id} label={g.label}>{g.roles.map((r) => <option key={r.id} value={r.id}>{r[locale]}</option>)}</optgroup>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">{t.market}</span>
            <select className="input mt-1" value={d.market} onChange={(e) => set({ market: e.target.value as Market })}>
              {(Object.keys(MARKETS) as Market[]).map((m) => <option key={m} value={m}>{MARKETS[m][ar ? 'name_ar' : 'name_en']}</option>)}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <label className="flex items-center gap-3 text-ink">
            <input type="checkbox" className="h-5 w-5 accent-brand-red" checked={noExp} onChange={(e) => setNoExp(e.target.checked)} />
            <span className="font-semibold">{t.noExp}</span>
          </label>
          {noExp && <p className="text-ink-soft">{t.noExpD}</p>}
          {d.jobs.map((j, i) => (
            <fieldset key={i} className="rounded-sheet border border-line p-4 md:p-5">
              <legend className="px-2 font-bold text-ink">{noExp ? t.proj : t.job} {i + 1}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field t={t} lang={lang} label={noExp ? t.ptitle : t.title} value={j.title} onChange={(v) => setJob(i, { title: v })} dir="auto" suggest={suggestTitle} />
                <Field t={t} lang={lang} label={noExp ? t.porg : t.company} value={j.company} onChange={(v) => setJob(i, { company: v })} dir="auto" suggest={suggestCompany} lookup={!noExp} />
                <Field t={t} lang={lang} label={t.jcity} value={j.location} onChange={(v) => setJob(i, { location: v })} dir="auto" suggest={suggestCity} />
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="text-sm font-semibold text-ink">{t.from}</span><input type="month" className="input mt-1" dir="ltr" value={j.from} onChange={(e) => setJob(i, { from: e.target.value })} /></label>
                  <label className="block"><span className="text-sm font-semibold text-ink">{t.to}</span><input type="month" className="input mt-1" dir="ltr" disabled={j.present} min={j.from || undefined} aria-invalid={!!(j.from && j.to && !j.present && j.to < j.from)} value={j.to} onChange={(e) => setJob(i, { to: e.target.value })} /></label>
                  <label className={`col-span-2 flex items-center gap-2 text-sm ${noExp ? 'hidden' : ''}`}><input type="checkbox" className="accent-brand-red" checked={j.present} onChange={(e) => setJob(i, { present: e.target.checked })} />{t.present}</label>
                </div>
              </div>
              <div className="mt-5">
                <div className="text-sm font-semibold text-ink">{t.picks}</div>
                <div className="mt-2 grid gap-2 md:grid-cols-2" dir="ltr">
                  {tasks.map((task) => (
                    <label key={task} className="flex items-start gap-2 rounded-sheet border border-line p-2.5 text-sm leading-6 text-ink-soft has-[:checked]:border-ink has-[:checked]:text-ink">
                      <input type="checkbox" className="mt-1 accent-brand-red" checked={j.picks.includes(task)}
                        onChange={(e) => setJob(i, { picks: e.target.checked ? [...j.picks, task] : j.picks.filter((p) => p !== task) })} />
                      {task}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div><div className="text-sm font-semibold text-ink">{noExp ? t.psaid : t.said}</div><p className="mt-1 max-w-2xl text-xs leading-5 text-ink-mute">{t.saidHint}</p></div>
                  <Mic t={t} lang={lang} size="lg" onText={(s) => setJob(i, { said: (j.said ? j.said.replace(/\s+$/, '') + (/[.!؟?]$/.test(j.said.trim()) ? ' ' : '. ') : '') + s })} />
                </div>
                <textarea className="input mt-2 min-h-[120px]" dir="auto" value={j.said} onChange={(e) => setJob(i, { said: e.target.value })} />
                <Understood j={j} roleId={d.roleId} t={t} ai={aiOn} onBulk={(e) => setJob(i, { edits: { ...(j.edits || {}), ...e } })} onEdit={(orig, text) => setJob(i, { edits: { ...(j.edits || {}), [orig]: text } })}
                  onReset={(orig) => { const e = { ...(j.edits || {}) }; delete e[orig]; setJob(i, { edits: e }); }} />
              </div>
              {d.jobs.length > 1 && <button type="button" className="mt-4 text-sm font-semibold text-brand-red underline" onClick={() => set({ jobs: d.jobs.filter((_, k) => k !== i) })}>{noExp ? t.removeProj : t.removeJob}</button>}
            </fieldset>
          ))}
          <button type="button" className="btn-ghost" onClick={() => set({ jobs: [...d.jobs, emptyJob()] })}>{noExp ? t.addProj : t.addJob}</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          {d.edu.map((e, i) => (
            <div key={i} className="grid gap-4 sm:grid-cols-3">
              <Field t={t} lang={lang} label={t.degree} value={e.degree} onChange={(v) => set({ edu: d.edu.map((x, k) => (k === i ? { ...x, degree: v } : x)) })} dir="ltr" />
              <Field t={t} lang={lang} label={t.school} value={e.school} onChange={(v) => set({ edu: d.edu.map((x, k) => (k === i ? { ...x, school: v } : x)) })} dir="auto" suggest={suggestCompany} />
              <Field t={t} lang={lang} label={t.year} value={e.year} onChange={(v) => set({ edu: d.edu.map((x, k) => (k === i ? { ...x, year: v } : x)) })} dir="ltr" mic={false} />
            </div>
          ))}
          {[['skills', t.skills], ['certs', t.certs]].map(([k, label]) => (
            <label key={k} className="block">
              <span className="flex items-end justify-between gap-2"><span className="text-sm font-semibold text-ink">{label}</span>
                <Mic t={t} lang={lang} onText={(s) => set({ [k]: ((d as any)[k] ? (d as any)[k] + (k === 'skills' ? ', ' : '\n') : '') + s } as any)} /></span>
              <textarea className="input mt-1 min-h-[80px]" dir="ltr" value={(d as any)[k]} onChange={(e) => set({ [k]: e.target.value } as any)} />
            </label>
          ))}
          <Field t={t} lang={lang} label={t.langs} value={d.languages} onChange={(v) => set({ languages: v })} dir="ltr" mic={false} />
        </div>
      )}

      {step === 4 && out && res && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-sheet bg-ink p-5 text-white">
              <div className="text-sm text-slate-300">{t.score}</div>
              <div className="display text-5xl">{res.score}<span className="text-xl text-slate-300">/100</span></div>
            </div>
            <div className="rounded-sheet bg-paper p-5">
              <div className="text-sm text-ink-mute">{t.top}</div>
              <div className="mt-1 text-lg font-bold text-ink">{res.roles[0]?.role[locale]}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-red" onClick={word}>{t.word}</button>
            <button type="button" className="btn-ghost" onClick={pdf}>{t.pdf}</button>
            <button type="button" className="btn-ghost" onClick={check} title={t.checkD}>{t.check}</button>
            <button type="button" className="btn-ghost" onClick={() => go(2)}>{t.edit}</button>
          </div>
          {tips.length > 0 && (
            <div className="rounded-sheet border-s-4 border-brand-red bg-paper p-5">
              <div className="font-bold text-ink">{t.tipsH}</div>
              <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm leading-6 text-ink-soft">{tips.map((x) => { const [a, k] = x.split('|'); return <li key={x}>{a}{k && <> <bdi dir="ltr" className="font-semibold text-ink">{k}</bdi></>}</li>; })}</ul>
            </div>
          )}
          <p className="text-sm font-semibold text-ink-soft">{t.note}</p>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-sheet border border-line bg-white p-5 font-sans text-sm leading-7 text-ink" dir="ltr">{out.text}</pre>
        </div>
      )}

      {err && <p className="mt-4 text-sm font-semibold text-brand-red" role="alert">{err}</p>}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex gap-2">
          {step > 0 && <button type="button" className="btn-ghost" onClick={() => go(step - 1)}>{t.back}</button>}
          {step < 3 && <button type="button" className="btn-red" onClick={() => go(step + 1)}>{t.next}</button>}
          {step === 3 && <button type="button" className="btn-red" onClick={() => go(4)}>{t.build}</button>}
        </div>
        <button type="button" className="text-sm text-ink-mute underline" onClick={() => { setD(emptyData()); setNoExp(false); setStep(0); }}>{t.reset}</button>
      </div>
      <p className="mt-4 text-xs leading-5 text-ink-mute">{t.privacy}</p>
    </div>
  );
}
