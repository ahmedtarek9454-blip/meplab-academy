'use client';
import { useEffect, useMemo, useState } from 'react';
import type { CvResult } from '@/lib/cv/analyze';
import { analyzeCv } from '@/lib/cv/analyze';
import { rebuildCv, toText, polishBullet, type CvModel, type RebuildReport } from '@/lib/cv/rebuild';
import { buildDocx, buildPrintHtml, rewritesUsed, markRewrite, FREE_REWRITES } from '@/lib/cv/export';
import type { Market } from '@/lib/cv/data';
import type { AtsModel } from '@/lib/ats/model';

type Loc = 'ar' | 'en';
const T = {
  ar: {
    title: 'عدّل الـ CV بتاعك أوتوماتيك',
    desc: 'الأداة هتعيد بناء الـ CV بصيغة بتعدّي من أنظمة الـ ATS: عناوين قياسية، ترتيب صح، Summary، مهارات مجمّعة، نقاط خبرة بأفعال قوية، وتواريخ موحّدة. من غير ما تضيف أي معلومة مش موجودة في الـ CV الأصلي.',
    free: 'مجانًا مرتين لكل جهاز',
    left: 'باقيلك {n} من {t}',
    btn: 'عدّل الـ CV دلوقتي',
    working: 'بنعيد بناء الـ CV...',
    done: 'الـ CV اتعدّل',
    before: 'قبل', after: 'بعد', ats: 'نتيجة ATS', pts: 'نقطة', cmp_t: 'شوف الفرق بعينك', cmp_sum: 'الملخص المهني', cmp_bul: 'نقط الخبرة', none: '(مكانش فيه ملخص)',
    changes: 'اللي اتعمل',
    ch: { headings: 'عناوين أقسام قياسية بالترتيب اللي الـ ATS بيتوقعه', summary_added: 'إضافة Professional Summary مبني على خبراتك', summary_rewritten: 'إعادة كتابة الـ Summary', bullets: 'تقوية {n} نقطة خبرة بأفعال واضحة بدل "Responsible for"', skills_grouped: 'تجميع المهارات في Core Skills بالأسماء القياسية', personal_removed: 'إزالة بيانات شخصية مش مطلوبة ({n} سطر)', dates: 'توحيد صيغة التواريخ (Mon YYYY – Mon YYYY)' } as Record<string, string>,
    removed: 'السطور اللي اتشالت',
    preview: 'معاينة النص (زي ما الـ ATS هيقراه)',
    docx: 'تحميل Word (DOCX)',
    pdf: 'حفظ PDF',
    pdf_hint: 'بيفتح صفحة جاهزة للطباعة، اختار Save as PDF.',
    edit_hint: 'راجع النص: لو في اسم شركة أو مسمى اتحط غلط، عدّله في ملف الـ Word قبل ما تبعته.',
    limit_t: 'استخدمت التعديلين المجانيين على الجهاز ده',
    limit_d: 'عايز مهندس من MEP LAB يراجع الـ CV معاك بنفسه؟ كلّمنا على واتساب.',
    wa: 'تواصل على واتساب',
    note: 'التعديل أوتوماتيكي: بيعيد ترتيب وصياغة اللي كتبته إنت بس، ومش بيخترع أي خبرة أو رقم. ممكن يغلط في قراءة اسم شركة أو مسمى في CV بتنسيق غريب، فراجع الملف قبل الإرسال.',
    nojobs: 'ما قدرناش نلاقي وظايف بتواريخ واضحة في الـ CV، فالنسخة المعدّلة هتبقى محدودة. اكتب كل وظيفة بتاريخها (مثلًا Jan 2021 – Present) وجرّب تاني.'
  },
  en: {
    title: 'Rewrite your CV automatically',
    desc: 'The tool rebuilds your CV in an ATS-friendly format: standard headings, correct order, a summary, grouped skills, strong action-verb bullets and unified dates — without adding anything that is not already in your CV.',
    free: 'Free, 2 rewrites per device',
    left: '{n} of {t} left',
    btn: 'Rewrite my CV now',
    working: 'Rebuilding your CV...',
    done: 'Your CV has been rewritten',
    before: 'Before', after: 'After', ats: 'ATS score', pts: 'pts', cmp_t: 'See the difference', cmp_sum: 'Professional summary', cmp_bul: 'Experience bullets', none: '(no summary)',
    changes: 'What was done',
    ch: { headings: 'Standard section headings in the order ATS expects', summary_added: 'Added a Professional Summary built from your experience', summary_rewritten: 'Rewrote the summary', bullets: 'Strengthened {n} bullets with clear action verbs instead of "Responsible for"', skills_grouped: 'Grouped skills into Core Skills with canonical names', personal_removed: 'Removed unnecessary personal data ({n} lines)', dates: 'Unified date format (Mon YYYY – Mon YYYY)' } as Record<string, string>,
    removed: 'Lines removed',
    preview: 'Text preview (what an ATS will read)',
    docx: 'Download Word (DOCX)',
    pdf: 'Save as PDF',
    pdf_hint: 'Opens a print-ready page; choose Save as PDF.',
    edit_hint: 'Review the text: if a company or title was parsed wrongly, fix it in the Word file before sending.',
    limit_t: 'You have used the 2 free rewrites on this device',
    limit_d: 'Want an MEP LAB engineer to review your CV with you? Message us on WhatsApp.',
    wa: 'Contact on WhatsApp',
    note: 'The rewrite is automatic: it reorders and rephrases only what you wrote and never invents experience or numbers. It can misread a company or title in unusual layouts, so review the file before sending.',
    nojobs: 'No clearly dated jobs were found in your CV, so the rewritten version will be limited. Write each job with its dates (e.g. Jan 2021 – Present) and try again.'
  }
};

function CountUp({ from, to }: { from: number; to: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now(), dur = 1100;
    const step = (now: number) => { const k = Math.min(1, (now - t0) / dur); setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [from, to]);
  return <>{v}</>;
}

export default function CvRewrite({ locale, text, res, market, model, whatsapp }: { locale: Loc; text: string; res: CvResult; market: Market; model: AtsModel; whatsapp?: string }) {
  const t = T[locale];
  const [used, setUsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ model: CvModel; summary: string; text: string; report: RebuildReport; after: number } | null>(null);
  const [showText, setShowText] = useState(false);
  useEffect(() => { setUsed(rewritesUsed()); }, []);
  const left = Math.max(0, FREE_REWRITES - used);

  const [noGain, setNoGain] = useState(false);
  // last step to the top score: the points left need facts only the person has (numbers, LinkedIn)
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [link, setLink] = useState('');
  const [boostMsg, setBoostMsg] = useState('');
  const targets = useMemo(() => {
    if (!out) return [] as { key: string; ei: number; bi: number; text: string }[];
    const L: { key: string; ei: number; bi: number; text: string }[] = [];
    out.model.experience.forEach((e: any, ei: number) => e.bullets.forEach((b: string, bi: number) => { if (!/\d/.test(b) && L.length < 5) L.push({ key: `${ei}-${bi}`, ei, bi, text: b }); }));
    return L;
  }, [out]);
  function boost() {
    if (!out) return;
    const m: CvModel = { ...out.model, experience: out.model.experience.map((e: any, ei: number) => ({ ...e, bullets: e.bullets.map((b: string, bi: number) => { const v = (edits[`${ei}-${bi}`] ?? '').trim(); return v && v !== b ? polishBullet(v) : b; }) })) };
    const li = link.trim().match(/(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/in\/[\w\-%]+\/?/i)?.[0];
    if (link.trim() && !li) { setBoostMsg(locale === 'ar' ? 'لينك لينكدإن لازم يكون زي linkedin.com/in/your-name' : 'The LinkedIn link should look like linkedin.com/in/your-name'); return; }
    if (li) m.linkedin = li.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const text2 = toText(m, out.summary);
    const after2 = analyzeCv(text2, market, 0, model, { general: res.general }).score;
    setOut({ ...out, model: m, text: text2, after: Math.max(after2, out.after) });
    setEdits({}); setLink('');
    setBoostMsg(after2 > out.after ? (locale === 'ar' ? `اتحدّث: النتيجة بقت ${after2}` : `Updated: score is now ${after2}`) : (locale === 'ar' ? 'اتحدّث. النتيجة زي ما هي، بس الـ CV بقى أوضح.' : 'Updated. The score is the same, but the CV reads better.'));
  }
  async function go() {
    if (left <= 0) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    const r = rebuildCv(text, market, res.roles[0].role.id, res.years, res.level, res.general);
    const after = analyzeCv(r.text, market, 0, model, { general: res.general }).score;
    // never hand back a version that scores lower than what the person already has
    if (after < res.score) { setNoGain(true); setOut(null); setBusy(false); return; }
    setNoGain(false);
    markRewrite(); setUsed(rewritesUsed());
    setOut({ ...r, after });
    setBusy(false);
    setTimeout(() => document.getElementById('cv-rewrite-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  async function downloadDocx() {
    if (!out) return;
    const blob = await buildDocx(out.model, out.summary);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(out.model.name || 'CV').replace(/[^\w؀-ۿ ]+/g, '').trim() || 'CV'} - CV (MEP LAB).docx`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  function printPdf() {
    if (!out) return;
    const w = window.open('', '_blank'); if (!w) return;
    w.document.write(buildPrintHtml(out.model, out.summary)); w.document.close();
  }
  const ch = (k: string) => (t.ch[k] || k).replace('{n}', String(k === 'bullets' ? out?.report.weakBullets : out?.report.removed.length));

  return (
    <div className="card overflow-hidden">
      <div className="relative bg-ink p-6 text-white md:p-8">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="badge bg-white/15 text-white">{t.free}</span>
            <h3 className="mt-2 text-2xl font-extrabold">{t.title}</h3>
            <p className="mt-2 leading-7 text-white/80">{t.desc}</p>
          </div>
          <span className="badge bg-white text-ink">{t.left.replace('{n}', String(left)).replace('{t}', String(FREE_REWRITES))}</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {!out && left > 0 && (
          <button onClick={go} disabled={busy} className="btn w-full bg-ink py-3 text-lg text-white hover:bg-ink-soft">
            {busy ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {t.working}</> : t.btn}
          </button>
        )}
        {!out && left <= 0 && (
          <div className="rounded-sheet bg-paper p-5 ring-1 ring-line">
            <div className="font-bold text-ink">{t.limit_t}</div>
            <p className="mt-1 text-sm text-ink-soft">{t.limit_d}</p>
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" className="btn mt-3 bg-green-600 text-white hover:bg-green-700">{t.wa}</a>}
          </div>
        )}

        {noGain && (
          <div role="status" className="rounded-sheet border-[1.5px] border-ink p-5 leading-7">
            {res.general && /[\u0600-\u06FF]/.test(text) ? (<>
            <div className="font-bold text-ink">{locale === 'ar' ? 'التعديل الأوتوماتيك للـ CV العربي متاح للمهندسين بس' : 'Automatic rewriting of Arabic CVs covers engineering only'}</div>
            <p className="mt-1 text-ink-soft">{locale === 'ar' ? 'الترجمة الأوتوماتيك عندنا مبنية على مصطلحات الهندسة، فمش هتطلع نسخة إنجليزي كويسة لتخصصك. اكتب الـ CV بالإنجليزي وافحصه تاني، والتعديل هيشتغل عليه. ومحسبناش المحاولة.' : 'Our automatic translation is built on engineering terms, so it can\'t produce a good English version for your field. Write the CV in English and check it again to get the rewrite. This attempt was not counted.'}</p>
            </>) : (<>
            <div className="font-bold text-ink">{locale === 'ar' ? 'الـ CV بتاعك أقوى من النسخة الأوتوماتيك' : 'Your CV already beats the automatic version'}</div>
            <p className="mt-1 text-ink-soft">{locale === 'ar' ? 'جرّبنا نعيد ترتيبه، ونتيجته في الـ ATS كانت هتقل، فمش هنقترحها عليك ومحسبناش المحاولة. ركّز على التعديلات اللي فوق في التقرير.' : 'We tried rebuilding it and its ATS score would drop, so we are not suggesting it and this attempt was not counted. Focus on the fixes in the report above.'}</p>
            </>)}
          </div>
        )}

        {out && (
          <div id="cv-rewrite-result" className="scroll-mt-24 space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr,auto,1fr] sm:items-center">
              <div className="rounded-sheet bg-paper p-5 text-center ring-1 ring-line"><div className="text-xs font-bold text-ink-mute">{t.before} · {t.ats}</div><div className="mt-1 text-5xl font-bold text-ink-mute">{res.score}</div></div>
              <div className="text-center">
                <div className="text-3xl text-ink" aria-hidden>{locale === 'ar' ? '←' : '→'}</div>
                {out.after > res.score && <div className="mt-1 text-sm tabular-nums text-ink-mute" dir="ltr">+{out.after - res.score} {t.pts}</div>}
              </div>
              <div className="rounded-sheet bg-white p-5 text-center ring-[1.5px] ring-ink"><div className="text-xs font-bold text-ink">{t.after} · {t.ats}</div><div className="mt-1 text-5xl font-bold text-ink" aria-live="polite"><CountUp from={res.score} to={out.after} /></div></div>
            </div>

            {(targets.length > 0 || !out.model.linkedin) && out.after < 100 && (
              <div className="rounded-sheet border-[1.5px] border-ink p-5">
                <h4 className="font-bold text-ink">{locale === 'ar' ? 'خطوة أخيرة لأعلى درجة' : 'One last step to the top score'}</h4>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{locale === 'ar' ? 'باقي النقط محتاجة معلومات انت بس اللي عارفها: أرقام حقيقية من شغلك (أدوار، مساحة، عدد، قيمة، نسبة) ولينك لينكدإن. زوّد الرقم جوه السطر وسيب باقي الكلام زي ما هو، واللي مالوش رقم سيبه.' : 'The remaining points need facts only you have: real numbers from your work (floors, area, count, value, %) and your LinkedIn link. Rewrite a line with the number; leave blank what you don\'t know.'}</p>
                <div className="mt-4 space-y-3">
                  {targets.map((x) => (
                    <label key={x.key} className="block">
                      <span className="block text-xs text-ink-mute">{locale === 'ar' ? 'زوّد الرقم في السطر ده:' : 'Add the number to this line:'}</span>
                      <input className="input mt-1" dir="auto" value={edits[x.key] ?? x.text} onChange={(e) => setEdits({ ...edits, [x.key]: e.target.value })} placeholder={locale === 'ar' ? 'مثال: Designed HVAC for a 12-floor office building (8,000 m²)' : 'e.g. Designed HVAC for a 12-floor office building (8,000 m²)'} />
                    </label>
                  ))}
                  {!out.model.linkedin && (
                    <label className="block">
                      <span className="block text-xs text-ink-mute">LinkedIn</span>
                      <input className="input mt-1" dir="ltr" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="linkedin.com/in/your-name" />
                    </label>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={boost} className="btn-red">{locale === 'ar' ? 'حدّث الـ CV' : 'Update my CV'}</button>
                  {boostMsg && <span role="status" className="text-sm font-semibold text-ink">{boostMsg}</span>}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-3 font-bold text-ink">{t.cmp_t}</h4>
              <div className="space-y-3">
                <div className="text-xs font-bold text-ink-mute">{t.cmp_sum}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-sheet border border-red-200 bg-red-50/60 p-4 text-sm leading-6 text-ink-soft"><span className="mb-1 block text-xs font-bold text-red-600">{t.before}</span><span dir="auto" className="block">{out.model.summary.join(' ') || t.none}</span></div>
                  <div className="rounded-sheet border border-ink/30 bg-white p-4 text-sm leading-6 text-ink"><span className="mb-1 block text-xs font-bold text-ink">{t.after}</span><span dir="ltr" className="block text-start">{out.summary}</span></div>
                </div>
                {out.report.pairs.length > 0 && <>
                  <div className="pt-2 text-xs font-bold text-ink-mute">{t.cmp_bul}</div>
                  {out.report.pairs.map((p, i) => (
                    <div key={i} className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-sheet border border-red-200 bg-red-50/60 p-3 text-sm leading-6 text-ink-soft line-through decoration-red-300/70" dir="auto">{p.before}</div>
                      <div className="rounded-sheet border border-ink/30 bg-white p-3 text-sm leading-6 text-ink" dir="ltr">{p.after}</div>
                    </div>
                  ))}
                </>}
              </div>
            </div>
            {out.report.entries === 0 && <p className="rounded-sheet bg-amber-50 p-4 text-sm font-semibold text-amber-900">{t.nojobs}</p>}

            <div>
              <h4 className="mb-2 font-bold text-ink">{t.changes}</h4>
              <ul className="grid gap-2 sm:grid-cols-2">{out.report.changes.map((k) => <li key={k} className="rounded-sheet border border-line bg-white p-3 text-sm text-ink-soft">✓ {ch(k)}</li>)}</ul>
              {out.report.removed.length > 0 && <details className="mt-2 text-xs text-ink-mute"><summary className="cursor-pointer">{t.removed}</summary><ul className="mt-1 list-disc ps-5">{out.report.removed.map((x, i) => <li key={i} dir="auto">{x}</li>)}</ul></details>}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={downloadDocx} className="btn-blue px-6 py-3">{t.docx}</button>
              <button onClick={printPdf} className="btn-ghost px-6 py-3">{t.pdf}</button>
              <span className="self-center text-xs text-ink-mute">{t.pdf_hint}</span>
            </div>
            <p className="text-sm text-ink-soft">{t.edit_hint}</p>

            <details open={showText} onToggle={(e) => setShowText((e.target as HTMLDetailsElement).open)} className="rounded-sheet bg-paper ring-1 ring-line">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink">{t.preview}</summary>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap px-4 pb-4 font-sans text-xs leading-5 text-ink-soft" dir="ltr">{out.text}</pre>
            </details>
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-ink-mute">{t.note}</p>
      </div>
    </div>
  );
}
