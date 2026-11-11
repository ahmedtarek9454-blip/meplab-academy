import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { safeCourses } from '@/lib/data/courses';
import { SUPABASE_READY } from '@/lib/supabase/env';
import CourseCard from '@/components/CourseCard';
import { Mark } from '@/components/Logo';

export default async function Home() {
  const { t, locale } = await getT();
  const courses = await safeCourses();
  const available = courses.filter((c: any) => c.status !== 'soon');
  const soon = courses.filter((c: any) => c.status === 'soon');
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const ar = locale === 'ar';

  const steps = [t.how1, t.how2, t.how3, t.how4];
  const faqs = [[t.q1, t.a1], [t.q2, t.a2], [t.q3, t.a3], [t.q4, t.a4]];
  const ticker = ar
    ? ['Revit Mechanical', 'HVAC Design', 'فحص CV مجاني', 'Fire Fighting', 'Plumbing', 'الكهرباء', 'MEP LAB Player']
    : ['Revit Mechanical', 'HVAC Design', 'Free CV check', 'Fire Fighting', 'Plumbing', 'Electrical', 'MEP LAB Player'];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="overflow-hidden bg-brand-red text-white">
        <div className="container-x grid items-end gap-8 pt-12 md:pt-16 lg:grid-cols-[1.25fr,.75fr] lg:gap-10">
          <div className="pb-12 md:pb-16">
            <h1 className="display text-[3.6rem] leading-[1.08] sm:text-[5rem] lg:text-[6.5rem]">
              <span className="block">{ar ? 'اتعلّم.' : 'Learn.'}</span>
              <span className="block text-ink">{ar ? 'اتفحص.' : 'Get checked.'}</span>
              <span className="block">{ar ? 'اتعيّن.' : 'Get hired.'}</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-8 text-white/90 md:text-xl md:leading-9">
              {ar
                ? 'كورسات تصميم عملية من مهندس شغال في مشاريع كبيرة، وأداة مجانية بتقولك الـ CV بتاعك هيعدّي من الـ ATS ولا لأ، لأي مهندس في أي تخصص.'
                : 'Practical design courses from an engineer working on major projects, and a free tool that tells you whether your CV will pass the ATS — for any engineering discipline.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cv-check" className="btn-blue px-7 py-3.5 text-base">{t.hero_cta}</Link>
              <Link href="/courses" className="btn-outline-white px-7 py-3.5 text-base">{t.hero_cta_courses}</Link>
            </div>
          </div>

          {/* example result (illustrative) */}
          <div className="self-end rounded-t-[10px] bg-ink px-7 pb-9 pt-7 text-white">
            <p className="text-sm text-slate-400">{ar ? 'مثال توضيحي لنتيجة فحص' : 'Example of a CV check result'}</p>
            <div className="mt-2 flex items-baseline gap-2" dir="ltr">
              <span className="display text-[6.5rem] leading-none">87</span>
              <span className="display text-3xl text-slate-500">/100</span>
            </div>
            <p className="mt-3 text-lg leading-8 text-slate-200">{ar ? 'أقرب وظيفة: مهندس تصميم تكييف HVAC' : 'Closest role: HVAC Design Engineer'}</p>
            <span className="mt-4 inline-block rounded bg-brand-red px-3 py-1.5 font-bold">{ar ? '37,000 – 69,000 ج.م شهريًا' : 'EGP 37,000 – 69,000 / month'}</span>
          </div>
        </div>
      </section>

      {/* ============ TICKER ============ */}
      <div className="overflow-hidden whitespace-nowrap border-t-4 border-brand-amber bg-ink py-4 text-white" aria-hidden>
        <div className="ticker-track">
          {[0, 1].map((k) => (
            <span key={k} className="inline-flex items-center">
              {[...ticker, ...ticker].map((x, i) => <span key={i} className="inline-flex items-center font-display text-lg font-bold">{x}<span className="mx-6 text-brand-amber">✦</span></span>)}
            </span>
          ))}
        </div>
      </div>

      {/* ============ COURSES ============ */}
      <section className="container-x pt-20 md:pt-24">
        <h2 className="h-section">{t.nav_courses}</h2>
        <p className="mt-4 max-w-[42rem] text-lg leading-8 text-ink-soft">{t.recorded_note}</p>
        {available.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {available.map((c: any) => <CourseCard key={c.id} c={c} locale={locale} t={t} />)}
          </div>
        )}
        {soon.length > 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {soon.map((c: any) => <CourseCard key={c.id} c={c} locale={locale} t={t} size="sm" />)}
          </div>
        )}
        {!courses.length && <div className="card mt-10 p-8 text-center text-ink-soft">{t.no_courses}</div>}
      </section>

      {/* ============ CV CHECK ============ */}
      <section className="container-x pt-20 md:pt-24">
        <div className="grid overflow-hidden rounded-[10px] bg-ink text-white lg:grid-cols-[1.1fr,.9fr]">
          <div className="p-8 md:p-12">
            <h2 className="display text-[2rem] leading-[1.25] md:text-[2.75rem]">{t.cvp_t}</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">{t.cvp_d}</p>
            <ul className="mt-6 space-y-3 text-lg">
              {(ar
                ? ['درجة ATS من 100 وأهم 3 تعديلات ترفعها', 'أقرب وظيفة ليك من 35 وظيفة هندسية', 'تعديل أوتوماتيك للـ CV وتحميله Word']
                : ['ATS score out of 100 and the 3 fixes that raise it', 'Your closest role among 35 engineering roles', 'Automatic CV rewrite with Word download']
              ).map((x) => <li key={x} className="flex gap-3"><span className="mt-2.5 h-2 w-2 shrink-0 bg-brand-amber" />{x}</li>)}
            </ul>
            <Link href="/cv-check" className="btn-red mt-8 px-7 py-3.5 text-base">{t.cvp_b}</Link>
          </div>
          <div className="flex items-end justify-center bg-brand-red p-8 md:p-12" aria-hidden>
            <div className="w-full max-w-sm rounded-[10px] bg-white p-6 text-ink">
              <div className="flex items-center justify-between text-sm font-bold text-ink-mute"><span>{ar ? 'قبل' : 'Before'}</span><span>{ar ? 'بعد التعديل' : 'After rewrite'}</span></div>
              <div className="mt-1 flex items-center justify-between">
                <span className="display text-5xl text-ink-mute">58</span>
                <span className="display text-xl text-sys-plumb" dir="ltr">+31</span>
                <span className="display text-5xl text-sys-plumb">89</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded bg-paper"><div className="h-full w-[89%] bg-sys-plumb" /></div>
              <p className="mt-3 text-sm text-ink-mute">{ar ? 'مثال توضيحي' : 'Illustrative example'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW (a real sequence) ============ */}
      <section id="how" className="container-x scroll-mt-24 pt-20 md:pt-24">
        <h2 className="h-section">{t.how_title}</h2>
        <ol className="mt-10 grid border-t-4 border-ink sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={i} className="pe-4 pt-6">
              <span className="display block text-[4.5rem] leading-none text-brand-red">{i + 1}</span>
              <p className="mt-3 text-lg font-bold leading-8">{s}</p>
            </li>
          ))}
        </ol>
        {SUPABASE_READY && <Link href="/download" className="btn-blue mt-10">{t.nav_download}</Link>}
      </section>

      {/* ============ FAQ ============ */}
      <section className="container-x max-w-4xl pt-20 md:pt-24">
        <h2 className="h-section">{t.faq_title}</h2>
        <div className="mt-8 divide-y-2 divide-ink/10 border-y-2 border-ink">
          {faqs.map(([q, a], i) => (
            <details key={i} className="group py-5 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                {q}
                <span className="display text-2xl text-brand-red transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ ABOUT — احنا مين ============ */}
      <section id="about" className="mt-20 scroll-mt-20 bg-ink py-16 text-white md:mt-24 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr,.8fr] lg:items-center">
          <div>
            <h2 className="display text-[2.4rem] leading-tight md:text-[3.25rem]">{t.about_tag}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-9 text-slate-300">{t.about_p1}</p>
            <p className="mt-3 max-w-2xl text-lg leading-9 text-slate-300">{t.about_p2}</p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              {[[t.about_v1_t, t.about_v1_d], [t.about_v2_t, t.about_v2_d], [t.about_v3_t, t.about_v3_d]].map(([h, d]) => (
                <div key={h} className="border-t-2 border-brand-amber pt-3"><dt className="font-bold text-white">{h}</dt><dd className="mt-1 text-sm leading-7 text-slate-400">{d}</dd></div>
              ))}
            </dl>
          </div>
          <div className="rounded-[10px] bg-white/5 p-7 ring-1 ring-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[10px] bg-white"><Mark className="h-11 w-11" /></div>
              <div>
                <p className="text-sm text-slate-400">{t.instr_tag}</p>
                <p className="display text-2xl">{t.instr_name}</p>
                <p className="text-slate-300" dir="ltr">{t.instr_role}</p>
              </div>
            </div>
            <p className="mt-5 leading-8 text-slate-300">{t.instr_bio}</p>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm" dir="ltr">
              {[t.instr_p1, t.instr_p2, t.instr_p3].map((p) => <li key={p} className="rounded bg-white/10 px-3 py-1.5 font-bold">{p}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="-mb-24 bg-brand-red py-14 text-white md:py-16">
        <div className="container-x flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="display text-[2.2rem] leading-tight md:text-[3rem]">{t.cta_title}</h2>
            <p className="mt-2 text-lg text-white/90">{t.cta_sub}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/courses" className="btn-blue px-7 py-3.5 text-base">{t.hero_cta_courses}</Link>
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="btn-outline-white px-7 py-3.5 text-base">WhatsApp</a>}
          </div>
        </div>
      </section>
    </>
  );
}
