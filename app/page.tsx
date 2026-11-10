import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/CourseCard';
import HeroSchematic from '@/components/HeroSchematic';
import { Mark } from '@/components/Logo';
import { systemOf } from '@/lib/ui/systems';
import { JOBS_ENABLED } from '@/lib/features';

export default async function Home() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('*').eq('published', true).order('sort_order').limit(6);
  const courses = data ?? [];
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const ar = locale === 'ar';

  const bySys: Record<string, any> = {};
  courses.forEach((c, i) => { const k = systemOf(c, i).key; if (!bySys[k]) bySys[k] = c; });

  const services: { href: string; name: string; what: string; free?: boolean }[] = [
    { href: '/courses', name: t.nav_courses, what: t.svc_courses },
    { href: '/cv-check', name: t.nav_cv, what: t.svc_cv, free: true },
    ...(JOBS_ENABLED ? [{ href: '/jobs', name: t.nav_jobs, what: t.svc_jobs }] : []),
    { href: '/download', name: t.nav_download, what: t.download_sub },
    { href: '/tools', name: t.nav_tools, what: t.svc_tools, free: true }
  ];
  const steps = [t.how1, t.how2, t.how3, t.how4];
  const faqs = [[t.q1, t.a1], [t.q2, t.a2], [t.q3, t.a3], [t.q4, t.a4]];
  const feats = [[t.feat1_t, t.feat1_d], [t.feat2_t, t.feat2_d], [t.feat3_t, t.feat3_d]];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="bg-grid-ink border-b border-line">
        <div className="container-x grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1fr,1.05fr] lg:gap-14">
          <div>
            <p className="text-sm font-semibold text-brand-red">{t.brand_tag}</p>
            <h1 className="mt-3 text-[2rem] font-bold leading-[1.35] text-ink md:text-h1">{t.hero_title}</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-8 text-ink-soft">{t.hero_sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cv-check" className="btn-red px-6 py-3 text-base">{t.hero_cta}</Link>
              <Link href="/courses" className="btn-ghost px-6 py-3 text-base">{t.hero_cta_courses}</Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-soft">
              {[t.hs1, t.hs2, t.hs3].map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 text-sys-plumb" aria-hidden><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>{s}
                </li>
              ))}
            </ul>
          </div>

          <figure className="sheet overflow-hidden">
            <div className="p-4 sm:p-6"><HeroSchematic locale={locale} courses={bySys} /></div>
            <figcaption className="tb grid-cols-3 bg-white text-start [&>div+div]:border-s">
              <div><span className="tb-k">{t.about_s1}</span><span className="tb-v" dir="ltr">4</span></div>
              <div><span className="tb-k">{t.about_s3}</span><span className="tb-v" dir="ltr">MEP ATS</span></div>
              <div><span className="tb-k">{t.about_s2}</span><span className="tb-v" dir="ltr">AT Tools</span></div>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ============ SERVICES (schedule) ============ */}
      <section className="container-x mt-16">
        <h2 className="h-section">{ar ? 'كل اللي في MEP LAB' : 'Everything in MEP LAB'}</h2>
        <p className="mt-2 text-ink-soft">{ar ? 'كله بحساب واحد مجاني بإيميلك.' : 'All with one free account.'}</p>
        <ul className="card mt-6 divide-y divide-line">
          {services.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="group grid gap-1 px-5 py-4 transition-colors hover:bg-paper sm:grid-cols-[13rem,1fr,auto] sm:items-center sm:gap-6">
                <span className="flex items-center gap-2 font-semibold text-ink">
                  {s.name}
                  {s.free && <span className="badge bg-sys-plumb/10 text-sys-plumb">{t.new_badge}</span>}
                </span>
                <span className="text-sm leading-7 text-ink-soft">{s.what}</span>
                <span className="hidden text-sm font-semibold text-brand-blue group-hover:underline sm:inline">{ar ? 'افتح' : 'Open'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ============ CV CHECK ============ */}
      <section className="container-x mt-16">
        <div className="relative overflow-hidden rounded-sheet bg-ink text-white">
          <div className="bg-grid absolute inset-0" aria-hidden />
          <div className="relative grid gap-8 p-7 md:grid-cols-[1.3fr,1fr] md:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-bold leading-snug text-white md:text-h2">{t.cvp_t}</h2>
              <p className="mt-3 max-w-xl leading-8 text-slate-300">{t.cvp_d}</p>
              <Link href="/cv-check" className="btn-red mt-6 px-6 py-3">{t.cvp_b}</Link>
            </div>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-sheet border border-white/15 bg-white/15 text-sm">
              {[
                [ar ? 'درجة ATS' : 'ATS score', ar ? 'من 100، مع كل نقطة ناقصة' : 'out of 100, with every gap'],
                [ar ? 'أقرب وظيفة' : 'Closest role', ar ? 'من 10 تخصصات MEP' : 'across 10 MEP roles'],
                [ar ? 'المرتب التقريبي' : 'Salary range', ar ? 'مصر، السعودية، الإمارات' : 'Egypt, KSA, UAE']
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 bg-ink px-4 py-3">
                  <dt className="font-semibold text-white">{k}</dt><dd className="text-slate-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ============ COURSES ============ */}
      <section className="container-x mt-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="h-section">{t.latest_courses}</h2>
            <p className="mt-2 text-ink-soft">{t.recorded_note}</p>
          </div>
          <Link href="/courses" className="btn-ghost btn-sm shrink-0">{t.all_courses}</Link>
        </div>
        {courses.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.slice(0, 4).map((c, i) => <CourseCard key={c.id} c={c} locale={locale} t={t} i={i} />)}
          </div>
        ) : (
          <div className="card p-8 text-center text-ink-soft">{t.no_courses}</div>
        )}

        <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-3">
          {feats.map(([h, d]) => (
            <div key={h}>
              <h3 className="font-semibold text-ink">{h}</h3>
              <p className="mt-1.5 text-sm leading-7 text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW (a real sequence → numbered) ============ */}
      <section id="how" className="mt-20 scroll-mt-24 border-y border-line bg-white py-14">
        <div className="container-x">
          <h2 className="h-section">{t.how_title}</h2>
          <ol className="relative mt-8 grid gap-6 md:grid-cols-4 md:gap-4">
            <span className="absolute inset-x-6 top-[18px] hidden h-[3px] bg-sys-hvac md:block" aria-hidden />
            {steps.map((s, i) => (
              <li key={i} className="relative flex gap-4 md:block">
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-sys-hvac bg-white text-sm font-bold text-ink">{i + 1}</span>
                <p className="leading-7 text-ink md:mt-4 md:pe-4">{s}</p>
              </li>
            ))}
          </ol>
          <Link href="/download" className="btn-blue mt-10">{t.nav_download}</Link>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="container-x mt-20 max-w-3xl">
        <h2 className="h-section">{t.faq_title}</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {faqs.map(([q, a], i) => (
            <details key={i} className="group py-4 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {q}
                <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-open:rotate-45" aria-hidden><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" /></svg>
              </summary>
              <p className="mt-2 leading-8 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ ABOUT — احنا مين ============ */}
      <section id="about" className="mt-20 scroll-mt-24 bg-ink py-16 text-white">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-[1.2fr,1fr]">
            <div>
              <p className="text-sm font-semibold text-brand-red">{t.about_tag}</p>
              <h2 className="mt-2 text-2xl font-bold leading-snug text-white md:text-h2">{t.about_title}</h2>
              <p className="mt-5 max-w-2xl leading-8 text-slate-300">{t.about_p1}</p>
              <p className="mt-3 max-w-2xl leading-8 text-slate-300">{t.about_p2}</p>
            </div>
            <dl className="divide-y divide-white/10 border-y border-white/10">
              {[[t.about_v1_t, t.about_v1_d], [t.about_v2_t, t.about_v2_d], [t.about_v3_t, t.about_v3_d]].map(([h, d]) => (
                <div key={h} className="py-4">
                  <dt className="font-semibold text-white">{h}</dt>
                  <dd className="mt-1 text-sm leading-7 text-slate-400">{d}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-14 grid gap-6 rounded-sheet border border-white/15 p-6 sm:grid-cols-[auto,1fr] sm:items-center md:p-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-sheet bg-white">
              <Mark className="h-14 w-14" />
            </div>
            <div>
              <p className="text-sm text-slate-400">{t.instr_tag}</p>
              <h3 className="text-xl font-bold text-white">{t.instr_name} <span className="ms-2 text-base font-medium text-slate-400" dir="ltr">{t.instr_role}</span></h3>
              <p className="mt-3 max-w-3xl leading-8 text-slate-300">{t.instr_bio}</p>
              <ul className="mt-4 flex flex-wrap gap-2 text-sm" dir="ltr">
                {[t.instr_p1, t.instr_p2, t.instr_p3].map((p) => <li key={p} className="rounded-full border border-white/20 px-3 py-1 text-slate-200">{p}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container-x mt-16">
        <div className="sheet flex flex-col items-start gap-5 p-7 md:flex-row md:items-center md:justify-between md:p-9">
          <div>
            <h2 className="text-2xl font-bold text-ink">{t.cta_title}</h2>
            <p className="mt-1 text-ink-soft">{t.cta_sub}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/courses" className="btn-red px-6 py-3">{t.hero_cta_courses}</Link>
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="btn-ghost px-6 py-3">WhatsApp</a>}
          </div>
        </div>
      </section>
    </>
  );
}
