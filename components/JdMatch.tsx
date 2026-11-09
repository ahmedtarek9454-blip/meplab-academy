'use client';
import { useState } from 'react';
import { findSkills, matchJd, type JdMatch as Result } from '@/lib/ats/engine';

type Loc = 'ar' | 'en';
const T = {
  ar: {
    title: 'جرّب الـ CV على إعلان وظيفة، زي الـ ATS بالظبط',
    desc: 'الصق إعلان الوظيفة اللي هتقدّم عليها، والمحرك هيعمل اللي أنظمة الـ ATS بتعمله: فلاتر الاستبعاد الأول، وبعدين المتطلبات الأساسية والإضافية، والكلمات المفتاحية الحرفية، والمسمى الوظيفي.',
    ph: 'الصق إعلان الوظيفة هنا (من LinkedIn أو Bayt أو أي مكان)...',
    btn: 'طابق الـ CV مع الإعلان',
    empty: 'الصق نص الإعلان الأول (على الأقل سطرين).',
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
    ph: 'Paste the job description here (LinkedIn, Bayt, anywhere)...',
    btn: 'Match my CV to this job',
    empty: 'Paste the job post first (at least two lines).',
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

  function run() {
    setErr('');
    if (jd.trim().split(/\n/).filter((l) => l.trim()).length < 2 && jd.trim().length < 120) return setErr(t.empty);
    setR(matchJd(cvText, findSkills(cvText), years, jd));
  }

  const koName = (id: string) => (id === 'years' ? t.ko_years : id === 'degree' ? t.ko_degree : t.ko_cert);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 p-6 md:p-8">
        <h3 className="text-xl font-extrabold text-brand-navy">🎯 {t.title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{t.desc}</p>
        <textarea value={jd} onChange={(e) => { setJd(e.target.value); setR(null); }} rows={5} placeholder={t.ph} className="input mt-4 text-sm" dir="auto" />
        {err && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">⚠️ {err}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={run} className="btn-blue px-6">{t.btn}</button>
          <span className="text-xs text-slate-500">🔒 {t.engine}</span>
        </div>
      </div>

      {r && (
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[260px,1fr]">
          {/* score */}
          <div>
            <div className="text-sm font-bold text-slate-500">{t.score}</div>
            <div className="mt-1 text-6xl font-black text-brand-navy">{r.score}<span className="text-2xl text-slate-400">/100</span></div>
            <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold text-white ${VC[r.verdict]}`}>{t.v[r.verdict]}</div>
            {r.title && <div className="mt-3 text-xs text-slate-500" dir="auto">{r.title}</div>}
            <div className="mt-5 space-y-2">
              {(['must', 'nice', 'literal', 'title'] as const).map((k) => (
                <div key={k}>
                  <div className="flex justify-between text-xs font-semibold text-slate-500"><span>{t.parts[k]}</span><span>{Math.round(r.parts[k] * 100)}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.round(r.parts[k] * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {r.knockouts.length > 0 && (
              <div>
                <h4 className="mb-2 font-bold text-brand-navy">{t.ko}</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {r.knockouts.map((k, i) => (
                    <div key={i} className={`flex items-center justify-between gap-3 rounded-xl p-3 text-sm ${k.ok ? 'bg-green-50' : 'bg-red-50 ring-1 ring-red-200'}`}>
                      <span className="font-semibold">{k.ok ? '✓' : '✕'} {koName(k.id)}</span>
                      <span className="text-xs text-slate-600">{t.need}: <b dir="ltr" style={{ unicodeBidi: 'isolate' }}>{k.need}</b> · {t.have}: <b dir="ltr" style={{ unicodeBidi: 'isolate' }}>{k.have}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 font-bold text-brand-navy">{t.must}</h4>
              {r.must.length ? (
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {r.must.map((m) => (
                    <span key={m.id} title={m.evidence || ''} className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${m.ok ? 'bg-green-50 text-green-700' : 'border border-dashed border-red-300 bg-red-50 text-red-700'}`}>{m.ok ? '✓' : '✕'} {m.label}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">{t.none}</p>}
            </div>

            {r.nice.length > 0 && (
              <div>
                <h4 className="mb-2 font-bold text-brand-navy">{t.nice}</h4>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {r.nice.map((m) => <span key={m.id} className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${m.ok ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{m.ok ? '✓' : '○'} {m.label}</span>)}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-1 font-bold text-brand-navy">{t.literal}</h4>
              <p className="mb-2 text-xs text-slate-500">{t.lit_tip}</p>
              <div className="flex flex-wrap gap-2" dir="ltr">
                {r.literal.map((l) => <span key={l.kw} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${l.ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{l.ok ? '✓' : '+'} {l.kw}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
