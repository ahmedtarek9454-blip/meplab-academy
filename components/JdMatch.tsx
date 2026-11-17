'use client';
import { useState } from 'react';
import { track } from '@/lib/stats/track';
import { findSkills, matchJd, type JdMatch as Result } from '@/lib/ats/engine';
import { buildApplication, type Application } from '@/lib/cv/apply';
import { ocrImageFile } from '@/lib/cv/ocr';

type Loc = 'ar' | 'en';
const T = {
  ar: {
    title: 'جرّب الـ CV على إعلان وظيفة، زي الـ ATS بالظبط',
    desc: 'الصق إعلان الوظيفة اللي هتقدّم عليها، والمحرك هيعمل اللي أنظمة الـ ATS بتعمله: فلاتر الاستبعاد الأول، وبعدين المتطلبات الأساسية والإضافية، والكلمات المفتاحية الحرفية، والمسمى الوظيفي.',
    ph: 'الصق نص الإعلان، أو لينك الوظيفة من LinkedIn، أو ارفع صورة الإعلان...',
    btn: 'طابق الـ CV مع الإعلان',
    empty: 'الصق نص الإعلان أو لينكه أو ارفع صورته الأول.',
    score: 'درجة الترتيب في الـ ATS',
    v: { strong: 'فرصتك قوية، غالبًا هتعدّي للمراجعة البشرية', possible: 'فرصة متوسطة، عدّل الـ CV على الإعلان قبل ما تقدّم', weak: 'فرصة ضعيفة، الـ CV بعيد عن المطلوب', rejected: 'غالبًا هيترفض أوتوماتيك بسبب فلتر استبعاد' } as Record<string, string>,
    ko: 'فلاتر الاستبعاد (Knock-out)',
    ko_years: 'سنين الخبرة', ko_degree: 'المؤهل', ko_cert: 'شهادة/اعتماد مطلوب',
    need: 'المطلوب', have: 'عندك',
    must: 'المتطلبات الأساسية', nice: 'متطلبات إضافية (Plus)', literal: 'الكلمات الحرفية اللي الـ ATS بيدوّر عليها',
    lit_tip: 'الـ ATS ساعات بيدوّر على الكلمة بنفس الكتابة بالظبط. لو عندك الخبرة دي، اكتبها في الـ CV بنفس ألفاظ الإعلان.',
    none: 'مفيش متطلبات واضحة اتعرفت في الإعلان.',
    parts: { must: 'الأساسي', nice: 'الإضافي', literal: 'الكلمات', title: 'المسمى' } as Record<string, string>,
    engine: 'محرك MEP LAB ATS · بيشتغل على جهازك، ومفيش أي بيانات بتخرج'
  },
  en: {
    title: 'Test your CV against a job post, the way an ATS does',
    desc: 'Paste the job you are applying for. The engine does what ATS software does: knock-out filters first, then must-have and nice-to-have requirements, literal keywords and job title.',
    ph: 'Paste the job text, a LinkedIn job link, or upload a screenshot...',
    btn: 'Match my CV to this job',
    empty: 'Paste the job post text or link, or upload a screenshot first.',
    score: 'ATS ranking score',
    v: { strong: 'Strong — likely to reach a human reviewer', possible: 'Possible — tailor your CV to this post before applying', weak: 'Weak — your CV is far from the requirements', rejected: 'Likely auto-rejected by a knock-out filter' } as Record<string, string>,
    ko: 'Knock-out filters',
    ko_years: 'Years of experience', ko_degree: 'Degree', ko_cert: 'Required certification',
    need: 'Required', have: 'You',
    must: 'Must-have requirements', nice: 'Nice-to-have', literal: 'Literal keywords the ATS searches for',
    lit_tip: 'Many ATS search for the exact wording. If you have this experience, use the same words as the job post.',
    none: 'No clear requirements were detected in the post.',
    parts: { must: 'Must', nice: 'Nice', literal: 'Keywords', title: 'Title' } as Record<string, string>,
    engine: 'MEP LAB ATS engine · runs on your device, nothing is sent anywhere'
  }
};

const VC: Record<string, string> = { strong: 'bg-green-600', possible: 'bg-amber-500', weak: 'bg-orange-600', rejected: 'bg-red-600' };

export default function JdMatch({ locale, cvText, years, jd, setJd }: { locale: Loc; cvText: string; years: number; jd: string; setJd: (v: string) => void }) {
  const t = T[locale];
  const [r, setR] = useState<Result | null>(null);
  const [err, setErr] = useState('');
  const [app, setApp] = useState<Application | null>(null);
  const [tab, setTab] = useState<'email' | 'letter'>('email');
  const [mail, setMail] = useState('');
  const [letter, setLetter] = useState('');
  const [copied, setCopied] = useState('');
  const ar = locale === 'ar';
  const jdEmail = (jd.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/) || [''])[0];

  function prepare() {
    if (!r) return;
    track('apply');
    const a = buildApplication(cvText, jd, r, years);
    setApp(a); setMail(a.email); setLetter(a.letter); setTab('email');
    setTimeout(() => document.getElementById('cv-apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  async function copy(what: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1800); } catch {}
  }
  async function letterDocx() {
    if (!app) return;
    track('apply_word');
    const D: any = await import('docx');
    const { Document, Packer, Paragraph, TextRun } = D;
    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: letter.split('\n').map((l: string, i: number) => new Paragraph({ children: [new TextRun({ text: l, font: 'Calibri', size: i === 0 ? 28 : 22, bold: i === 0 })], spacing: { after: l ? 80 : 40 } })) }] });
    const blob = await Packer.toBlob(doc);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Cover Letter - ${app.title}`.replace(/[\\/:*?"<>|]+/g, '').slice(0, 80) + '.docx'; a.click();
  }

  const [busy, setBusy] = useState('');
  const URL_ONLY = /^\s*(https?:\/\/\S+)\s*$/i;

  async function run() {
    track('jd');
    setErr('');
    let text = jd;
    const link = jd.match(URL_ONLY)?.[1];
    if (link) {
      // a link to the post: read it on our server (the browser can't open LinkedIn or Bayt pages directly)
      setBusy(ar ? 'بنفتح الإعلان من اللينك...' : 'Opening the job post...');
      try {
        const res = await fetch('/api/jd/fetch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: link }) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d.text) {
          setBusy('');
          return setErr(d.error === 'site' || d.error === 'bad_url'
            ? (ar ? 'الموقع ده مش من مواقع الوظايف اللي بنقراها. انسخ نص الإعلان والصقه هنا، أو ارفع صورته.' : 'We can\'t read this site. Paste the job text here, or upload a screenshot.')
            : d.error === 'not_job' ? (ar ? 'اللينك ده مش لينك وظيفة. افتح الوظيفة نفسها وانسخ اللينك بتاعها.' : 'This link is not a job post. Open the job itself and copy its link.')
            : d.error === 'blocked' ? (ar ? 'الموقع ده بيمنع إن حد يقرا إعلاناته أوتوماتيك (Wuzzuf وBayt كده). لينكات LinkedIn بتشتغل. هنا انسخ نص الإعلان والصقه، أو صوّره وارفع الصورة.' : 'This site blocks automatic reading (Wuzzuf and Bayt do). LinkedIn links work. Paste the text or upload a screenshot.')
            : d.error === 'rate' ? (ar ? 'فتحت لينكات كتير النهارده. الصق نص الإعلان أو ارفع صورته.' : 'Too many links today. Paste the text or upload a screenshot.')
            : d.error === 'gone' ? (ar ? 'الإعلان ده اتقفل أو اتشال من الموقع.' : 'This job post was closed or removed.')
            : (ar ? 'مقدرناش نفتح الإعلان ده، ممكن يكون محتاج تسجيل دخول أو اتقفل. انسخ نص الإعلان والصقه هنا، أو ارفع صورته.' : 'We couldn\'t open this post (it may need a login or be closed). Paste the text or upload a screenshot.'));
        }
        text = d.text; setJd(text); track('jd_link');
      } catch { setBusy(''); return setErr(ar ? 'النت فصل وإحنا بنفتح اللينك. جرّب تاني أو الصق النص.' : 'Connection dropped. Try again or paste the text.'); }
      setBusy('');
    }
    if (text.trim().split(/\n/).filter((l) => l.trim()).length < 2 && text.trim().length < 120) return setErr(t.empty);
    setR(matchJd(cvText, findSkills(cvText), years, text)); setApp(null);
  }

  async function readImage(file: File) {
    if (!file || !/^image\//.test(file.type)) return;
    setErr(''); setR(null); setApp(null);
    setBusy(ar ? 'بنقرا الإعلان من الصورة (أول مرة بتاخد حوالي 10 ثواني)...' : 'Reading the post from the image (first time ~10 s)...');
    try {
      const text = await ocrImageFile(file);
      setBusy('');
      if (text.trim().length < 60) return setErr(ar ? 'مقدرناش نقرا كلام كفاية من الصورة. صوّر الإعلان أوضح، أو الصق النص.' : 'Not enough text could be read. Try a sharper screenshot or paste the text.');
      setJd(text); track('jd_image');
      setR(matchJd(cvText, findSkills(cvText), years, text));
    } catch { setBusy(''); setErr(ar ? 'حصلت مشكلة في قراءة الصورة. الصق نص الإعلان بدلها.' : 'Could not read the image. Paste the text instead.'); }
  }

  const koName = (id: string) => (id === 'years' ? t.ko_years : id === 'degree' ? t.ko_degree : t.ko_cert);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-6 md:p-8">
        <h3 className="text-xl font-bold text-ink">{t.title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-soft">{t.desc}</p>
        <textarea value={jd} onChange={(e) => { setJd(e.target.value); setR(null); setApp(null); }} rows={5} placeholder={t.ph} className="input mt-4 text-sm" dir="auto"
          onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => /^image\//.test(x.type)); if (f) { e.preventDefault(); readImage(f); } }} />
        {busy && <p className="mt-3 text-sm font-semibold text-ink">{busy}</p>}
        {err && <p role="alert" className="mt-3 rounded-sheet border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={run} disabled={!!busy} className="btn-blue px-6 disabled:opacity-60">{t.btn}</button>
            <label className={`btn-ghost cursor-pointer px-4 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
              {ar ? 'ارفع صورة الإعلان' : 'Upload a screenshot'}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) readImage(f); }} />
            </label>
          </div>
          <span className="text-xs text-ink-mute">{t.engine}</span>
        </div>
      </div>

      {r && (
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[260px,1fr]">
          {/* score */}
          <div>
            <div className="text-sm font-bold text-ink-mute">{t.score}</div>
            <div className="mt-1 text-6xl font-bold text-ink">{r.score}<span className="text-2xl text-slate-400">/100</span></div>
            <div className={`mt-3 rounded-sheet px-3 py-2 text-sm font-bold text-white ${VC[r.verdict]}`}>{t.v[r.verdict]}</div>
            {r.title && <div className="mt-3 text-xs text-ink-mute" dir="auto">{r.title}</div>}
            <div className="mt-5 space-y-2">
              {(['must', 'nice', 'literal', 'title'] as const).map((k) => (
                <div key={k}>
                  <div className="flex justify-between text-xs font-semibold text-ink-mute"><span>{t.parts[k]}</span><span>{Math.round(r.parts[k] * 100)}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden bg-line"><div className="h-full bg-brand-blue" style={{ width: `${Math.round(r.parts[k] * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {r.knockouts.length > 0 && (
              <div>
                <h4 className="mb-2 font-bold text-ink">{t.ko}</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {r.knockouts.map((k, i) => (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-sheet p-3 text-sm ${k.ok ? 'bg-green-50' : k.near ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-red-50 ring-1 ring-red-200'}`}>
                      <span className="font-semibold">{k.ok ? '✓' : k.near ? '!' : '✕'} {koName(k.id)}{k.near ? (ar ? ' (ناقص أقل من سنة)' : ' (under a year short)') : ''}</span>
                      <span className="text-xs text-ink-soft">{t.need}: <b dir="ltr" style={{ unicodeBidi: 'isolate' }}>{k.need}</b> · {t.have}: <b dir="ltr" style={{ unicodeBidi: 'isolate' }}>{k.have}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 font-bold text-ink">{t.must}</h4>
              {r.must.length ? (
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {r.must.map((m) => (
                    <span key={m.id} title={m.evidence || ''} className={`rounded-sheet px-2.5 py-1 text-sm font-semibold ${m.ok ? 'bg-green-50 text-green-700' : 'border border-dashed border-red-300 bg-red-50 text-red-700'}`}>{m.ok ? '✓' : '✕'} {m.label}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-mute">{t.none}</p>}
            </div>

            {r.nice.length > 0 && (
              <div>
                <h4 className="mb-2 font-bold text-ink">{t.nice}</h4>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {r.nice.map((m) => <span key={m.id} className={`rounded-sheet px-2.5 py-1 text-sm font-semibold ${m.ok ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-ink-mute'}`}>{m.ok ? '✓' : '○'} {m.label}</span>)}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-1 font-bold text-ink">{t.literal}</h4>
              <p className="mb-2 text-xs text-ink-mute">{t.lit_tip}</p>
              <div className="flex flex-wrap gap-2" dir="ltr">
                {r.literal.map((l) => <span key={l.kw} className={`rounded-sheet px-2 py-0.5 text-xs font-semibold ${l.ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{l.ok ? '✓' : '+'} {l.kw}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {r && (
        <div className="border-t border-line p-6 md:p-8">
          {!app ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-ink">{ar ? 'هتقدّم على الوظيفة دي؟' : 'Applying for this job?'}</h4>
                <p className="mt-1 max-w-2xl text-sm leading-7 text-ink-soft">{ar ? 'نجهّزلك إيميل التقديم والـ Cover Letter بالإنجليزي من الـ CV بتاعك وعلى مقاس الإعلان. بنكتب بس اللي الـ CV بيقوله، ومش بنضيف حاجة إنت ما عملتهاش.' : 'We draft your application email and cover letter from your CV, tailored to this post. Only what your CV says, nothing invented.'}</p>
              </div>
              <button onClick={prepare} className="btn-red px-6">{ar ? 'جهّز الإيميل والـ Cover Letter' : 'Draft my email and cover letter'}</button>
            </div>
          ) : (
            <div id="cv-apply" className="scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-lg font-bold text-ink">{ar ? 'التقديم جاهز، راجعه وعدّل اللي محتاج' : 'Your application, ready to review'}</h4>
                <div className="flex rounded-sheet border border-line p-0.5 text-sm">
                  {(['email', 'letter'] as const).map((k) => (
                    <button key={k} onClick={() => setTab(k)} className={`rounded-sheet px-3 py-1.5 font-semibold ${tab === k ? 'bg-ink text-white' : 'text-ink-soft'}`}>{k === 'email' ? (ar ? 'إيميل التقديم' : 'Email') : 'Cover Letter'}</button>
                  ))}
                </div>
              </div>

              {tab === 'email' ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold text-ink-mute">{ar ? 'العنوان (Subject)' : 'Subject'}
                    <input readOnly value={app.subject} dir="ltr" className="input mt-1 text-sm" onFocus={(e) => e.target.select()} />
                  </label>
                  <textarea value={mail} onChange={(e) => setMail(e.target.value)} rows={13} dir="ltr" className="input font-[inherit] text-sm leading-7" />
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => copy('email', `${app.subject}\n\n${mail}`)} className="btn-ghost btn-sm">{copied === 'email' ? (ar ? 'اتنسخ' : 'Copied') : ar ? 'انسخ الإيميل' : 'Copy email'}</button>
                    <a href={`mailto:${jdEmail}?subject=${encodeURIComponent(app.subject)}&body=${encodeURIComponent(mail)}`} onClick={() => track('apply_mail')} className="btn-ghost btn-sm">{jdEmail ? (ar ? `افتحه في الإيميل لـ ${jdEmail}` : `Open in mail to ${jdEmail}`) : ar ? 'افتحه في برنامج الإيميل' : 'Open in your mail app'}</a>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={22} dir="ltr" className="input font-[inherit] text-sm leading-7" />
                  <div className="flex flex-wrap gap-2">
                    <button onClick={letterDocx} className="btn-red btn-sm">{ar ? 'حمّل Word' : 'Download Word'}</button>
                    <button onClick={() => copy('letter', letter)} className="btn-ghost btn-sm">{copied === 'letter' ? (ar ? 'اتنسخ' : 'Copied') : ar ? 'انسخ النص' : 'Copy text'}</button>
                  </div>
                </div>
              )}

              <ul className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm leading-7 text-ink-soft">
                {!app.company && <li>{ar ? '• اسم الشركة مش واضح في الإعلان، فكتبنا "Hiring Manager". لو تعرف اسم الشركة أو اسم الـ HR غيّره.' : '• The company name was not clear in the post, so it says "Hiring Manager". Replace it if you know the company or recruiter.'}</li>}
                {app.left.length > 0 && <li>{ar ? `• الإعلان طالب ${app.left.join('، ')} والـ CV مش بيقول إن عندك ده، فمكتبناهوش. لو عندك الخبرة دي، ضيفها للـ CV الأول وبعدين للإيميل.` : `• The post asks for ${app.left.join(', ')} and your CV doesn't show it, so we left it out. If you have it, add it to your CV first.`}</li>}
                {r.knockouts.some((k) => k.near) && <li>{ar ? '• سنين خبرتك أقل من المطلوب بشوية. لو بتقدّم، اكتب الخبرة بالشهور في الـ CV (زي Jan 2021 – Present) عشان الحساب يبان صح، ومتكتبش رقم أكبر من الحقيقي.' : '• You are a little short on years. Show exact months in your CV dates; never round up.'}</li>}
                {r.knockouts.some((k) => !k.ok && !k.near) && <li className="text-brand-red">{ar ? '• فيه شرط أساسي في الإعلان مش متحقق في الـ CV (شوف فلاتر الاستبعاد فوق). قدّم بس خلي توقعاتك على قدها.' : '• A knock-out requirement is not met (see above). You can still apply, but expect a filter.'}</li>}
                <li>{ar ? '• ابعت الـ CV المعدّل معاه، وسمّي الملف باسمك والوظيفة.' : '• Attach your updated CV, named with your name and the job title.'}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
