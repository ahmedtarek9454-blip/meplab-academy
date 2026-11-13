import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { safeCourses } from '@/lib/data/courses';
import { SUPABASE_READY } from '@/lib/supabase/env';
import { SHOW_PRICES } from '@/lib/features';
import CourseCard from '@/components/CourseCard';
import { Mark } from '@/components/Logo';
import { RedlinePlan, RedlineCv } from '@/components/Redline';

export default async function Home() {
  const { t, locale } = await getT();
  const courses = await safeCourses();
  const available = courses.filter((c: any) => c.status !== 'soon');
  const soon = courses.filter((c: any) => c.status === 'soon');
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const ar = locale === 'ar';

  const steps = [t.how1, t.how2, t.how3, t.how4];
  // enrollment & payment content stays hidden until sales open (NEXT_PUBLIC_SHOW_PRICES=1)
  const faqs = [...(SHOW_PRICES ? [[t.q1, t.a1]] : []), [t.q2, t.a2], [t.q3, t.a3], [t.q4, t.a4]];

  return (
    <>
      {/* ============ HERO: a sheet back from review ============ */}
      <section className="border-b-[1.5px] border-ink">
        <div className="container-x grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[.95fr,1.05fr] lg:gap-14">
          <div>
            <h1 className="display text-[2.35rem] leading-[1.3] sm:text-[3rem] lg:text-[3.6rem]">
              {ar ? 'اتعلّم التصميم زي ما بيتراجع في المشاريع الحقيقية.' : 'Learn design the way real projects review it.'}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-8 text-ink-soft">
              {ar
                ? 'كورسات HVAC و Revit MEP من مهندس شغّال، بتاسكات بتسلّمها وترجعلك متصحّحة. ومعاها أداة مجانية بتقولك الـ CV بتاعك هيعدّي من الـ ATS ولا لأ.'
                : 'HVAC and Revit MEP courses from a working engineer, with tasks you hand in and get back marked up. Plus a free tool that tells you whether your CV will pass the ATS.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cv-check" className="btn-red px-6 py-3.5 text-base">{t.hero_cta}</Link>
              <Link href="/courses" className="btn-ghost px-6 py-3.5 text-base">{t.hero_cta_courses}</Link>
            </div>
          </div>
          <div>
            <RedlinePlan ar={ar} reviewer={t.instr_name} />
            <p className="mt-2 text-sm text-ink-mute">{ar ? 'مثال لمراجعة لوحة تكييف' : 'Example of an HVAC sheet review'}</p>
          </div>
        </div>
      </section>

      {/* ============ HOW YOU LEARN (a real sequence) ============ */}
      <section className="container-x pt-16 md:pt-20">
        <h2 className="h-section">{ar ? 'إزاي بتتعلّم' : 'How you learn'}</h2>
        <ol className="mt-8 grid border-t-[1.5px] border-ink md:grid-cols-3">
          {(ar
            ? [['اتفرّج على الدرس', 'شرح على مشروع حقيقي، خطوة بخطوة على Revit والبرامج.'], ['سلّم التاسك', 'تطبّق نفس الجزء على الموديل بتاعك وترفعه على الموقع.'], ['يرجعلك متصحّح', 'تعليقات بالأحمر على شغلك زي مراجعة الكونسلتنت، لحد ما يبقى جاهز.']]
            : [['Watch the lesson', 'A real project, step by step in Revit and the design tools.'], ['Hand in the task', 'Apply the same part to your own model and upload it.'], ['Get it back marked up', 'Red comments on your work, like a consultant review, until it is right.']]
          ).map(([h, d], i) => (
            <li key={h} className="border-b border-line py-6 md:border-b-0 md:border-e md:px-6 md:first:ps-0 md:last:border-e-0">
              <span className="font-hand text-[2.6rem] font-bold leading-none text-brand-red">{i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{h}</h3>
              <p className="mt-1 leading-7 text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ COURSES ============ */}
      <section className="container-x pt-16 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="h-section">{t.nav_courses}</h2>
            <p className="mt-3 max-w-[42rem] text-lg leading-8 text-ink-soft">{t.recorded_note}</p>
          </div>
          <Link href="/courses" className="text-[15px] font-bold text-brand-blue underline underline-offset-4">{ar ? 'كل الكورسات' : 'All courses'}</Link>
        </div>
        {available.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {available.map((c: any) => <CourseCard key={c.id} c={c} locale={locale} t={t} />)}
          </div>
        )}
        {soon.length > 0 && (
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {soon.map((c: any) => <CourseCard key={c.id} c={c} locale={locale} t={t} size="sm" />)}
          </div>
        )}
        {!courses.length && <div className="card mt-8 p-8 text-center text-ink-soft">{t.no_courses}</div>}
      </section>

      {/* ============ CV CHECK ============ */}
      <section className="mt-16 border-y-[1.5px] border-ink bg-paper md:mt-20">
        <div className="container-x grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.1fr,.9fr]">
          <div>
            <h2 className="h-section">{t.cvp_t}</h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">{t.cvp_d}</p>
            <ul className="mt-6 space-y-3 text-lg">
              {(ar
                ? ['درجة ATS من 100 وأهم 3 تعديلات ترفعها', 'أقرب وظيفة ليك من 35 وظيفة هندسية', 'تعديل أوتوماتيك للـ CV وتحميله Word']
                : ['ATS score out of 100 and the 3 fixes that raise it', 'Your closest role among 35 engineering roles', 'Automatic CV rewrite with Word download']
              ).map((x) => <li key={x} className="flex gap-3"><svg viewBox="0 0 20 20" className="mt-1.5 h-5 w-5 shrink-0" aria-hidden><path d="M3 11l4 4l10 -11" fill="none" stroke="#D7263D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{x}</li>)}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/cv-check" className="btn-red px-6 py-3.5 text-base">{t.cvp_b}</Link>
              <Link href="/cv-builder" className="text-base font-bold text-brand-blue underline underline-offset-4">
                {ar ? 'مش عندك CV؟ اعمله بصوتك' : 'No CV yet? Build one by voice'}
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <RedlineCv ar={ar} />
            <p className="mt-2 text-sm text-ink-mute">{ar ? 'مثال توضيحي' : 'Illustrative example'}</p>
          </div>
        </div>
      </section>

      {/* ============ HOW TO SUBSCRIBE (hidden until sales open) ============ */}
      {SHOW_PRICES && <section id="how" className="container-x scroll-mt-24 pt-16 md:pt-20">
        <h2 className="h-section">{t.how_title}</h2>
        <ol className="mt-8 grid border-t-[1.5px] border-ink sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={i} className="pe-4 pt-6">
              <span className="font-hand block text-[2.6rem] font-bold leading-none text-brand-red">{i + 1}</span>
              <p className="mt-2 text-lg font-bold leading-8">{s}</p>
            </li>
          ))}
        </ol>
        {SUPABASE_READY && <Link href="/download" className="btn-blue mt-10">{t.nav_download}</Link>}
      </section>}

      {/* ============ ABOUT ============ */}
      <section id="about" className="container-x scroll-mt-20 pt-16 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr,.8fr] lg:items-start">
          <div>
            <h2 className="h-section">{t.about_tag}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-9 text-ink-soft">{t.about_p1}</p>
            <p className="mt-3 max-w-2xl text-lg leading-9 text-ink-soft">{t.about_p2}</p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              {[[t.about_v1_t, t.about_v1_d], [t.about_v2_t, t.about_v2_d], [t.about_v3_t, t.about_v3_d]].map(([h, d]) => (
                <div key={h} className="border-t-[1.5px] border-ink pt-3"><dt className="font-bold">{h}</dt><dd className="mt-1 text-sm leading-7 text-ink-soft">{d}</dd></div>
              ))}
            </dl>
          </div>
          <div className="rounded-[3px] border-[1.5px] border-ink">
            <div className="flex items-center gap-4 border-b border-ink p-5">
              <Mark className="h-12 w-12 shrink-0" />
              <div>
                <p className="text-sm text-ink-mute">{t.instr_tag}</p>
                <p className="text-xl font-bold">{t.instr_name}</p>
                <p className="text-ink-soft" dir="ltr" style={{ textAlign: 'inherit' }}>{t.instr_role}</p>
              </div>
            </div>
            <p className="p-5 leading-8 text-ink-soft">{t.instr_bio}</p>
            <ul className="flex flex-wrap gap-2 px-5 pb-5 text-sm" dir="ltr">
              {[t.instr_p1, t.instr_p2, t.instr_p3].map((p) => <li key={p} className="rounded-[3px] border border-line px-2.5 py-1 font-medium">{p}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="container-x max-w-4xl pt-16 md:pt-20">
        <h2 className="h-section">{t.faq_title}</h2>
        <div className="mt-8 divide-y divide-line border-y-[1.5px] border-ink">
          {faqs.map(([q, a], i) => (
            <details key={i} className="group py-5 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                {q}
                <span className="text-2xl font-normal text-brand-blue transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="container-x pt-16 md:pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[3px] border-[1.5px] border-ink p-7 md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="display text-[1.9rem] leading-tight md:text-[2.4rem]">{t.cta_title}</h2>
            <p className="mt-2 text-lg text-ink-soft">{t.cta_sub}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/courses" className="btn-red px-6 py-3.5 text-base">{t.hero_cta_courses}</Link>
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="btn-ghost px-6 py-3.5 text-base">WhatsApp</a>}
          </div>
        </div>
      </section>
    </>
  );
}
