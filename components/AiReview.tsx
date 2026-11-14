'use client';
import { useState } from 'react';
import type { CvResult } from '@/lib/cv/analyze';
import type { Market } from '@/lib/cv/data';

type Loc = 'ar' | 'en';
export const PENDING_KEY = 'meplab_cv_pending';

const T = {
  ar: {
    brand: 'MEP LAB AI',
    title: 'مستشار الـ CV الذكي',
    desc: 'محرك الـ ATS قالك الـ CV هيعدّي ولا لأ. المستشار ده بيكتبلك التعديلات نفسها: Summary جديد، وإعادة صياغة النقاط، وأسئلة الإنترفيو. ده الجزء الوحيد اللي بيستخدم Gemini.',
    feats: ['تقييم على 5 محاور', 'Summary و Bullets جديدة', 'المهارات الناقصة وليه', 'أسئلة إنترفيو متوقعة', 'Summary مفصّل على الإعلان'],
    jd_label: 'عندك إعلان وظيفة معيّنة؟ الصقه هنا (اختياري)',
    jd_used: 'هيستخدم إعلان الوظيفة اللي لصقته فوق ويكتبلك Summary مفصّل عليه.',
    jd_ph: 'الصق وصف الوظيفة من LinkedIn أو Bayt...',
    btn: 'قيّم الـ CV بالتفصيل',
    loading: ['بنقرا الـ CV...', 'بنقارنه بمتطلبات الوظيفة والسوق...', 'بنكتب التقييم والتعديلات...'],
    privacy: 'قبل الإرسال بنشيل اسمك وإيميلك وتليفونك واللينكات. باقي نص الـ CV بيتبعت لخدمة Google Gemini علشان يتحلل، ومش بنخزّنه عندنا.',
    login_t: 'المستشار الذكي للأعضاء (مجاني)',
    login_d: 'اعمل حساب أو ادخل، وهترجع لنفس الـ CV على طول.',
    login_b: 'دخول / حساب جديد',
    limit: 'وصلت للحد اليومي ({n} تقييمات). جرّب تاني بكرة.',
    busy: 'الخدمة عليها ضغط دلوقتي، جرّب كمان دقيقة.',
    not_conf: 'التقييم بالذكاء الاصطناعي لسه مش متفعّل على الموقع.',
    failed: 'حصلت مشكلة في التقييم، جرّب تاني.',
    short: 'نص الـ CV قصير جدًا علشان يتقيّم.',
    rating: 'التنافسية',
    areas: { relevance: 'مناسبته للوظيفة', technical_depth: 'العمق الفني', impact: 'الإنجازات والأرقام', presentation: 'الكتابة والتنسيق', market_fit: 'مناسبته للسوق' } as Record<string, string>,
    titles: 'قدّم على الوظايف دي',
    jd_t: 'مطابقة مع إعلان الوظيفة',
    jd_have: 'متطابق',
    jd_miss: 'ناقص',
    jd_sum: 'Summary مفصّل للوظيفة دي',
    strengths: 'نقاط القوة',
    weaknesses: 'محتاج يتحسن',
    summary: 'Summary مقترح',
    bullets: 'إعادة صياغة نقاط الخبرة',
    before: 'قبل',
    after: 'بعد',
    missing: 'مهارات ناقصة للوظيفة دي',
    steps: 'أهم 3 خطوات تعملها',
    interview: 'أسئلة إنترفيو متوقعة ليك',
    hint: 'الإجابة القوية بتغطي',
    copy: 'نسخ',
    copied: 'اتنسخ ✓',
    left: 'باقيلك النهارده: {n}',
    again: 'قيّم تاني بإعلان وظيفة',
    note: 'التقييم ده من الذكاء الاصطناعي وممكن يغلط، فراجع أي تعديل قبل ما تحطه في الـ CV.'
  },
  en: {
    brand: 'MEP LAB AI',
    title: 'Smart CV advisor',
    desc: 'The ATS engine told you whether your CV passes. This advisor writes the fixes for you: a new summary, rewritten bullets and interview questions. It is the only part that uses Gemini.',
    feats: ['5-area scoring', 'New summary & bullets', 'Missing skills & why', 'Likely interview questions', 'Match with a job post'],
    jd_label: 'Applying for a specific job? Paste the job post (optional)',
    jd_used: 'Will use the job post you pasted above and write a summary tailored to it.',
    jd_ph: 'Paste the job description from LinkedIn or Bayt...',
    btn: 'Review my CV in detail',
    loading: ['Reading your CV...', 'Comparing it with the role and market...', 'Writing the review and rewrites...'],
    privacy: 'Before sending, we remove your name, email, phone and links. The rest of the CV text is sent to Google Gemini for analysis; we do not store it.',
    login_t: 'The smart advisor is for members (free)',
    login_d: 'Sign up or log in and you will come straight back to the same CV.',
    login_b: 'Log in / Sign up',
    limit: 'Daily limit reached ({n} reviews). Try again tomorrow.',
    busy: 'The service is busy right now, try again in a minute.',
    not_conf: 'AI review is not enabled on this site yet.',
    failed: 'Something went wrong, please try again.',
    short: 'The CV text is too short to review.',
    rating: 'Competitiveness',
    areas: { relevance: 'Role relevance', technical_depth: 'Technical depth', impact: 'Impact & numbers', presentation: 'Writing & format', market_fit: 'Market fit' } as Record<string, string>,
    titles: 'Apply for these roles',
    jd_t: 'Job post match',
    jd_have: 'Matched',
    jd_miss: 'Missing',
    jd_sum: 'Summary tailored to this job',
    strengths: 'Strengths',
    weaknesses: 'Needs work',
    summary: 'Suggested summary',
    bullets: 'Rewritten experience bullets',
    before: 'Before',
    after: 'After',
    missing: 'Skills missing for this role',
    steps: 'Top 3 next steps',
    interview: 'Interview questions you are likely to get',
    hint: 'A strong answer covers',
    copy: 'Copy',
    copied: 'Copied ✓',
    left: 'Left today: {n}',
    again: 'Review again with a job post',
    note: 'This review is AI-generated and can be wrong — check every change before adding it to your CV.'
  }
};

function Copy({ text, t }: { text: string; t: any }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn-ghost btn-sm shrink-0" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch {} }}>
      {ok ? t.copied : t.copy}
    </button>
  );
}

const color = (v: number, max = 10) => (v / max >= 0.75 ? '#16a34a' : v / max >= 0.5 ? '#f59e0b' : '#E53935');

export default function AiReview({ locale, text, res, market, jd = '', loginHref = '/login' }: { locale: Loc; text: string; res: CvResult; market: Market; jd?: string; loginHref?: string }) {
  const t = T[locale];
  const [state, setState] = useState<'idle' | 'loading' | 'login' | 'error' | 'done'>('idle');
  const [err, setErr] = useState('');
  const [rv, setRv] = useState<any>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const top = res.roles[0].role;

  async function go() {
    setState('loading'); setErr(''); setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, 2)), 6000);
    try {
      const mock = (window as any).__AI_MOCK__;
      let r: Response | null = null;
      let d: any;
      if (mock) {
        await new Promise((x) => setTimeout(x, 1500));
        d = { review: { ...mock[locale], jd_match: jd.trim() ? mock[locale].jd_match : null }, left: 2 };
      } else {
        r = await fetch('/api/cv-review', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, jd, locale, market, role: top.en, role_id: top.id, years: res.years, score: res.score })
        });
        d = await r.json().catch(() => ({}));
      }
      if (r && r.status === 401) {
        try { localStorage.setItem(PENDING_KEY, JSON.stringify({ text, market })); } catch {}
        return setState('login');
      }
      if (!d.review) {
        const m = d.error === 'limit' ? t.limit.replace('{n}', d.limit) : d.error === 'busy' ? t.busy : d.error === 'not_configured' ? t.not_conf : d.error === 'short' ? t.short : t.failed;
        setErr(m); return setState('error');
      }
      setRv(d.review); setLeft(d.left ?? null); setState('done');
    } catch {
      setErr(t.failed); setState('error');
    } finally {
      clearInterval(timer);
    }
  }

  const Header = ({ children }: { children?: React.ReactNode }) => (
    <div className="relative overflow-hidden bg-sys-bim p-6 text-white md:p-8">
      <div className="bg-grid absolute inset-0 opacity-40" />
      <div className="relative">{children}</div>
    </div>
  );

  /* ---------------- before review ---------------- */
  if (state !== 'done')
    return (
      <div className="card overflow-hidden">
        <Header>
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-200" dir="ltr" style={{ justifyContent: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
            <span className="rounded-md bg-white/15 px-2 py-0.5">{t.brand}</span>
          </div>
          <div className="mt-2 text-2xl font-extrabold">{t.title}</div>
          <p className="mt-2 max-w-3xl leading-7 text-indigo-100">{t.desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.feats.map((f) => <span key={f} className="rounded-sheet bg-white/10 px-3 py-1 text-xs font-semibold">✓ {f}</span>)}
          </div>
        </Header>

        <div className="space-y-4 p-6 md:p-8">
          {state === 'login' ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-sheet bg-indigo-50 p-4">
              <div><b className="text-ink">{t.login_t}</b><div className="text-sm text-ink-soft">{t.login_d}</div></div>
              <a href={`${loginHref}?next=${encodeURIComponent('/cv-check?resume=1')}`} className="btn bg-indigo-700 text-white hover:bg-indigo-800">{t.login_b}</a>
            </div>
          ) : (
            <>
              {jd.trim() && <p className="rounded-sheet bg-indigo-50 p-3 text-sm text-indigo-800">{t.jd_used}</p>}
              <button onClick={go} disabled={state === 'loading'} className="btn w-full bg-ink hover:bg-[#16295A] py-3 text-lg text-white hover:opacity-95">
                {state === 'loading' ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {t.loading[step]}</> : t.btn}
              </button>
            </>
          )}
          {state === 'error' && <p role="alert" className="rounded-sheet border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
          <p className="text-xs leading-5 text-ink-mute">{t.privacy}</p>
        </div>
      </div>
    );

  /* ---------------- result ---------------- */
  return (
    <div className="card overflow-hidden">
      <Header>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-sheet bg-white" style={{ color: color(rv.rating) }}>
            <span className="text-4xl font-bold leading-none">{rv.rating}</span><span className="text-xs font-bold text-slate-400">/10 · {t.rating}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-indigo-200">{t.brand} · {t.title}</div>
            <p className="mt-1 text-lg font-semibold leading-8" dir="auto">{rv.verdict}</p>
          </div>
          {left !== null && <span className="badge bg-white/15 text-white">{t.left.replace('{n}', String(left))}</span>}
        </div>
        {/* breakdown */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {rv.breakdown.map((b: any) => (
            <div key={b.area} className="rounded-sheet bg-white/10 p-3" title={b.note}>
              <div className="flex items-center justify-between text-xs font-bold text-indigo-100"><span>{t.areas[b.area]}</span><span>{b.score}/10</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: `${b.score * 10}%`, background: color(b.score) }} /></div>
              <p className="mt-2 text-[11px] leading-4 text-indigo-100/80" dir="auto">{b.note}</p>
            </div>
          ))}
        </div>
      </Header>

      <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
        {rv.target_titles?.length > 0 && (
          <div className="md:col-span-2">
            <h4 className="mb-3 font-bold text-ink">{t.titles}</h4>
            <div className="flex flex-wrap gap-2">{rv.target_titles.map((x: string) => <span key={x} className="rounded-sheet bg-ink px-4 py-2 text-sm font-bold text-white" dir="ltr">{x}</span>)}</div>
          </div>
        )}

        {rv.jd_match && (
          <div className="rounded-sheet bg-paper p-5 ring-1 ring-line md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-bold text-ink">{t.jd_t}</h4>
              <span className="text-2xl font-bold" style={{ color: color(rv.jd_match.match_pct, 100) }}>{rv.jd_match.match_pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${rv.jd_match.match_pct}%`, background: color(rv.jd_match.match_pct, 100) }} /></div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><div className="mb-2 text-sm font-bold text-green-700">✓ {t.jd_have}</div><ul className="space-y-1 text-sm text-ink-soft" dir="auto">{rv.jd_match.matched.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
              <div><div className="mb-2 text-sm font-bold text-red-600">✕ {t.jd_miss}</div><ul className="space-y-1 text-sm text-ink-soft" dir="auto">{rv.jd_match.missing.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul></div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><div className="text-sm font-bold text-ink">{t.jd_sum}</div><Copy text={rv.jd_match.tailored_summary} t={t} /></div>
            <p className="mt-2 rounded-sheet bg-white p-4 text-sm leading-7 text-ink ring-1 ring-line" dir="ltr">{rv.jd_match.tailored_summary}</p>
          </div>
        )}

        <div>
          <h4 className="mb-3 font-bold text-green-700">✓ {t.strengths}</h4>
          <ul className="space-y-2">{rv.strengths.map((s: string, i: number) => <li key={i} className="rounded-sheet bg-green-50 p-3 text-sm leading-6 text-ink-soft" dir="auto">{s}</li>)}</ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-amber-700">! {t.weaknesses}</h4>
          <ul className="space-y-2">{rv.weaknesses.map((s: string, i: number) => <li key={i} className="rounded-sheet bg-amber-50 p-3 text-sm leading-6 text-ink-soft" dir="auto">{s}</li>)}</ul>
        </div>

        <div className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3"><h4 className="font-bold text-ink">{t.summary}</h4><Copy text={rv.summary_rewrite} t={t} /></div>
          <p className="rounded-sheet border border-indigo-100 bg-indigo-50/60 p-4 leading-7 text-ink" dir="ltr">{rv.summary_rewrite}</p>
        </div>

        {rv.bullet_rewrites.length > 0 && (
          <div className="md:col-span-2">
            <h4 className="mb-3 font-bold text-ink">{t.bullets}</h4>
            <div className="space-y-3">
              {rv.bullet_rewrites.map((b: any, i: number) => (
                <div key={i} className="grid gap-2 rounded-sheet ring-1 ring-line md:grid-cols-2">
                  <div className="p-3 text-sm text-ink-mute" dir="ltr"><span className="badge mb-1 bg-slate-100 text-ink-mute">{t.before}</span><div className="line-through decoration-red-300">{b.before}</div></div>
                  <div className="flex items-start justify-between gap-2 rounded-sheet bg-green-50/60 p-3 text-sm text-ink" dir="ltr">
                    <div><span className="badge mb-1 bg-green-100 text-green-700">{t.after}</span><div>{b.after}</div></div>
                    <Copy text={b.after} t={t} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-3 font-bold text-ink">{t.missing}</h4>
          <ul className="space-y-2">
            {rv.missing_skills.map((m: any, i: number) => (
              <li key={i} className="rounded-sheet border border-dashed border-indigo-300 bg-indigo-50/60 p-3">
                <div className="text-sm font-bold text-indigo-800" dir="ltr" style={{ textAlign: 'start' }}>+ {m.skill}</div>
                {m.why && <div className="mt-0.5 text-xs leading-5 text-ink-soft" dir="auto">{m.why}</div>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold text-ink">{t.steps}</h4>
          <ol className="space-y-3">{rv.next_steps.map((s: string, i: number) => (
            <li key={i} className="flex gap-3 text-sm leading-6 text-ink-soft" dir="auto">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">{i + 1}</span>{s}
            </li>
          ))}</ol>
        </div>

        {rv.interview_questions?.length > 0 && (
          <div className="md:col-span-2">
            <h4 className="mb-3 font-bold text-ink">{t.interview}</h4>
            <div className="space-y-2">
              {rv.interview_questions.map((q: any, i: number) => (
                <details key={i} className="group rounded-sheet bg-paper p-4 ring-1 ring-line [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-ink" dir="ltr">
                    <span>{i + 1}. {q.q}</span>
                    <span className="shrink-0 text-lg leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-ink-soft" dir="auto"><b>{t.hint}:</b> {q.hint}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3 md:px-8">
        <p className="text-xs text-ink-mute">{t.note}</p>
        {!rv.jd_match && left !== 0 && <button onClick={() => { setState('idle'); setRv(null); }} className="text-sm font-bold text-indigo-700">↻ {t.again}</button>}
      </div>
    </div>
  );
}
