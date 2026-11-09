'use client';
import { useEffect, useState } from 'react';
import type { CvResult } from '@/lib/cv/analyze';
import { analyzeCv } from '@/lib/cv/analyze';
import { rebuildCv, type CvModel, type RebuildReport } from '@/lib/cv/rebuild';
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
    btn: '✨ عدّل الـ CV دلوقتي',
    working: 'بنعيد بناء الـ CV...',
    done: 'الـ CV اتعدّل',
    before: 'قبل', after: 'بعد', ats: 'نتيجة ATS',
    changes: 'اللي اتعمل',
    ch: { headings: 'عناوين أقسام قياسية بالترتيب اللي الـ ATS بيتوقعه', summary_added: 'إضافة Professional Summary مبني على خبراتك', summary_rewritten: 'إعادة كتابة الـ Summary', bullets: 'تقوية {n} نقطة خبرة بأفعال واضحة بدل "Responsible for"', skills_grouped: 'تجميع المهارات في Core Skills بالأسماء القياسية', personal_removed: 'إزالة بيانات شخصية مش مطلوبة ({n} سطر)', dates: 'توحيد صيغة التواريخ (Mon YYYY – Mon YYYY)' } as Record<string, string>,
    removed: 'السطور اللي اتشالت',
    preview: 'معاينة النص (زي ما الـ ATS هيقراه)',
    docx: '⬇ تحميل Word (DOCX)',
    pdf: '🖨 حفظ PDF',
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
    btn: '✨ Rewrite my CV now',
    working: 'Rebuilding your CV...',
    done: 'Your CV has been rewritten',
    before: 'Before', after: 'After', ats: 'ATS score',
    changes: 'What was done',
    ch: { headings: 'Standard section headings in the order ATS expects', summary_added: 'Added a Professional Summary built from your experience', summary_rewritten: 'Rewrote the summary', bullets: 'Strengthened {n} bullets with clear action verbs instead of "Responsible for"', skills_grouped: 'Grouped skills into Core Skills with canonical names', personal_removed: 'Removed unnecessary personal data ({n} lines)', dates: 'Unified date format (Mon YYYY – Mon YYYY)' } as Record<string, string>,
    removed: 'Lines removed',
    preview: 'Text preview (what an ATS will read)',
    docx: '⬇ Download Word (DOCX)',
    pdf: '🖨 Save as PDF',
    pdf_hint: 'Opens a print-ready page; choose Save as PDF.',
    edit_hint: 'Review the text: if a company or title was parsed wrongly, fix it in the Word file before sending.',
    limit_t: 'You have used the 2 free rewrites on this device',
    limit_d: 'Want an MEP LAB engineer to review your CV with you? Message us on WhatsApp.',
    wa: 'Contact on WhatsApp',
    note: 'The rewrite is automatic: it reorders and rephrases only what you wrote and never invents experience or numbers. It can misread a company or title in unusual layouts, so review the file before sending.',
    nojobs: 'No clearly dated jobs were found in your CV, so the rewritten version will be limited. Write each job with its dates (e.g. Jan 2021 – Present) and try again.'
  }
};

export default function CvRewrite({ locale, text, res, market, model, whatsapp }: { locale: Loc; text: string; res: CvResult; market: Market; model: AtsModel; whatsapp?: string }) {
  const t = T[locale];
  const [used, setUsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ model: CvModel; summary: string; text: string; report: RebuildReport; after: number } | null>(null);
  const [showText, setShowText] = useState(false);
  useEffect(() => { setUsed(rewritesUsed()); }, []);
  const left = Math.max(0, FREE_REWRITES - used);

  async function go() {
    if (left <= 0) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    const r = rebuildCv(text, market, res.roles[0].role.id, res.years, res.level);
    const after = analyzeCv(r.text, market, 0, model).score;
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
      <div className="relative bg-gradient-to-br from-[#064e3b] via-[#047857] to-emerald-500 p-6 text-white md:p-8">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="badge bg-white/15 text-white">{t.free}</span>
            <h3 className="mt-2 text-2xl font-extrabold">{t.title}</h3>
            <p className="mt-2 leading-7 text-emerald-50">{t.desc}</p>
          </div>
          <span className="badge bg-white text-emerald-800">{t.left.replace('{n}', String(left)).replace('{t}', String(FREE_REWRITES))}</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {!out && left > 0 && (
          <button onClick={go} disabled={busy} className="btn w-full bg-emerald-600 py-3 text-lg text-white hover:bg-emerald-700">
            {busy ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {t.working}</> : t.btn}
          </button>
        )}
        {!out && left <= 0 && (
          <div className="rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="font-bold text-brand-navy">{t.limit_t}</div>
            <p className="mt-1 text-sm text-slate-600">{t.limit_d}</p>
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" className="btn mt-3 bg-green-600 text-white hover:bg-green-700">💬 {t.wa}</a>}
          </div>
        )}

        {out && (
          <div id="cv-rewrite-result" className="scroll-mt-24 space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr,auto,1fr] sm:items-center">
              <div className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200"><div className="text-xs font-bold text-slate-500">{t.before} · {t.ats}</div><div className="text-4xl font-black text-slate-500">{res.score}</div></div>
              <div className="text-center text-3xl text-emerald-600">{locale === 'ar' ? '←' : '→'}</div>
              <div className="rounded-2xl bg-emerald-50 p-5 text-center ring-2 ring-emerald-400"><div className="text-xs font-bold text-emerald-700">{t.after} · {t.ats}</div><div className="text-4xl font-black text-emerald-700">{out.after}</div></div>
            </div>
            {out.report.entries === 0 && <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">⚠️ {t.nojobs}</p>}

            <div>
              <h4 className="mb-2 font-bold text-brand-navy">✓ {t.changes}</h4>
              <ul className="grid gap-2 sm:grid-cols-2">{out.report.changes.map((k) => <li key={k} className="rounded-xl bg-emerald-50 p-3 text-sm text-slate-700">✓ {ch(k)}</li>)}</ul>
              {out.report.removed.length > 0 && <details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer">{t.removed}</summary><ul className="mt-1 list-disc ps-5">{out.report.removed.map((x, i) => <li key={i} dir="auto">{x}</li>)}</ul></details>}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={downloadDocx} className="btn-blue px-6 py-3">{t.docx}</button>
              <button onClick={printPdf} className="btn-ghost px-6 py-3">{t.pdf}</button>
              <span className="self-center text-xs text-slate-500">{t.pdf_hint}</span>
            </div>
            <p className="text-sm text-slate-600">✏️ {t.edit_hint}</p>

            <details open={showText} onToggle={(e) => setShowText((e.target as HTMLDetailsElement).open)} className="rounded-xl bg-slate-50 ring-1 ring-slate-200">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-brand-navy">{t.preview}</summary>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap px-4 pb-4 font-sans text-xs leading-5 text-slate-700" dir="ltr">{out.text}</pre>
            </details>
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-slate-500">{t.note}</p>
      </div>
    </div>
  );
}
