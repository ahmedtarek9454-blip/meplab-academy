import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/CourseCard';
import { Mark } from '@/components/Logo';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default async function Home() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('*').eq('published', true).order('sort_order').limit(6);
  const courses = data ?? [];
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;

  const feats = [
    { t: t.feat1_t, d: t.feat1_d, i: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z', c: 'bg-red-50 text-brand-red' },
    { t: t.feat2_t, d: t.feat2_d, i: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4', c: 'bg-blue-50 text-brand-blue' },
    { t: t.feat3_t, d: t.feat3_d, i: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.4-8.5h.5a8.5 8.5 0 0 1 8 8z', c: 'bg-green-50 text-green-600' }
  ];
  const steps = [t.how1, t.how2, t.how3, t.how4];
  const faqs = [[t.q1, t.a1], [t.q2, t.a2], [t.q3, t.a3], [t.q4, t.a4]];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-32 end-[-120px] h-[28rem] w-[28rem] rounded-full bg-brand-red/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-160px] start-[-100px] h-[28rem] w-[28rem] rounded-full bg-brand-blue/40 blur-3xl" />

        <div className="container-x relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> {t.brand_tag}
            </p>
            <h1 className="text-3xl font-black leading-[1.35] md:text-5xl md:leading-[1.3]">{t.hero_title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">{t.hero_sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cv-check" className="btn-red px-7 py-3 text-base shadow-lg shadow-red-900/40">📄 {t.hero_cta}</Link>
              <Link href="/courses" className="btn border border-white/25 px-7 py-3 text-base text-white hover:bg-white/10">{t.hero_cta_courses}</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-300">
              {[t.hs1, t.hs2, t.hs3].map((s) => (
                <span key={s} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] text-white">✓</span>{s}</span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="relative mx-auto grid w-full max-w-lg grid-cols-2 gap-4">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-brand-red/20 to-brand-blue/30 blur-2xl" />
            {[
              { href: '/courses', t: t.nav_courses, d: t.svc_courses, i: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z', c: 'from-brand-red to-[#b71c1c]' },
              { href: '/cv-check', t: t.nav_cv, d: t.svc_cv, i: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4', c: 'from-green-500 to-emerald-700', badge: t.new_badge },
              { href: '/jobs', t: t.nav_jobs, d: t.svc_jobs, i: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', c: 'from-brand-blue to-[#13306b]' },
              { href: '/tools', t: t.nav_tools, d: t.svc_tools, i: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z', c: 'from-amber-500 to-orange-600', badge: t.at_free }
            ].map((x, k) => (
              <Link key={x.href} href={x.href}
                className={`group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1] ${k % 2 ? 'sm:translate-y-6 sm:hover:translate-y-5' : ''}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${x.c} shadow-lg`}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={x.i} /></svg>
                </div>
                {x.badge && <span className="badge absolute end-4 top-4 bg-green-500/20 text-green-300">{x.badge}</span>}
                <div className="mt-4 text-lg font-extrabold text-white">{x.t}</div>
                <p className="mt-1 flex-1 text-sm leading-6 text-slate-300">{x.d}</p>
                <span className="mt-3 text-sm font-bold text-white/70 transition group-hover:text-white">{locale === 'ar' ? '←' : '→'}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="container-x relative z-10 -mt-8 grid gap-4 md:grid-cols-3">
        {feats.map((f) => (
          <div key={f.t} className="card flex gap-4 p-6 transition hover:shadow-md">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${f.c}`}><Icon d={f.i} /></div>
            <div>
              <h3 className="text-lg font-bold text-brand-navy">{f.t}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{f.d}</p>
            </div>
          </div>
        ))}
      </section>


      {/* ================= CV CHECK PROMO ================= */}
      <section className="container-x mt-12">
        <div className="card flex flex-col items-center gap-6 overflow-hidden p-6 md:flex-row md:p-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-4xl text-white shadow-lg">📄</div>
          <div className="flex-1 text-center md:text-start">
            <span className="badge bg-green-100 text-green-700">{t.new_badge}</span>
            <h2 className="mt-2 text-xl font-extrabold text-brand-navy md:text-2xl">{t.cvp_t}</h2>
            <p className="mt-1 leading-7 text-slate-600">{t.cvp_d}</p>
          </div>
          <Link href="/cv-check" className="btn shrink-0 bg-green-600 px-6 py-3 text-white hover:bg-green-700">{t.cvp_b}</Link>
        </div>
      </section>

      {/* ================= COURSES ================= */}
      <section className="container-x mt-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t.nav_courses}</p>
            <h2 className="h-section">{t.latest_courses}</h2>
          </div>
          <Link href="/courses" className="btn-ghost btn-sm">{t.all_courses}</Link>
        </div>
        {courses.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => <CourseCard key={c.id} c={c} locale={locale} t={t} i={i} />)}
          </div>
        ) : (
          <div className="card p-8 text-center text-slate-600">{t.no_courses}</div>
        )}
      </section>

      {/* ================= HOW ================= */}
      <section id="how" className="mt-20 scroll-mt-24 bg-white py-16">
        <div className="container-x">
          <div className="mb-10 text-center">
            <p className="eyebrow">MEP LAB Player</p>
            <h2 className="h-section">{t.how_title}</h2>
          </div>
          <div className="relative grid gap-6 md:grid-cols-4">
            <div className="absolute inset-x-[12%] top-7 hidden h-0.5 bg-gradient-to-l from-brand-red via-slate-200 to-brand-blue md:block" />
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-xl font-black text-white shadow-lg ring-4 ring-white">{i + 1}</div>
                <p className="mx-auto mt-4 max-w-[14rem] font-semibold leading-7 text-brand-navy">{s}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/download" className="btn-blue px-7 py-3">⬇ {t.nav_download}</Link>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="container-x mt-20 max-w-3xl">
        <h2 className="h-section mb-6 text-center">{t.faq_title}</h2>
        <div className="space-y-3">
          {faqs.map(([q, a], i) => (
            <details key={i} className="card group p-5 [&_summary::-webkit-details-marker]:hidden" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-brand-navy">
                {q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg transition group-open:rotate-45 group-open:bg-brand-red group-open:text-white">+</span>
              </summary>
              <p className="mt-3 leading-7 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ================= ABOUT — احنا مين ================= */}
      <section id="about" className="mt-20 scroll-mt-24 bg-brand-navy py-16 text-white">
        <div className="container-x">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr,1fr]">
            <div>
              <p className="eyebrow text-brand-red">{t.about_tag}</p>
              <h2 className="text-3xl font-black leading-snug md:text-4xl">{t.about_title}</h2>
              <p className="mt-5 leading-8 text-slate-300">{t.about_p1}</p>
              <p className="mt-3 leading-8 text-slate-300">{t.about_p2}</p>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {[['4', t.about_s1], ['AT Tools', t.about_s2], ['MEP ATS', t.about_s3]].map(([n, l]) => (
                  <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xl font-black text-white md:text-2xl" dir="ltr">{n}</div>
                    <div className="mt-1 text-xs text-slate-300">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              {[[t.about_v1_t, t.about_v1_d, '🛠️'], [t.about_v2_t, t.about_v2_d, '🗣️'], [t.about_v3_t, t.about_v3_d, '🤝']].map(([h, d, ic]) => (
                <div key={h} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">{ic}</div>
                  <div><div className="text-lg font-extrabold">{h}</div><p className="mt-1 text-sm leading-6 text-slate-300">{d}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* instructor */}
          <div className="mt-12 grid items-center gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 md:grid-cols-[auto,1fr] md:p-10">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-red to-brand-blue shadow-xl">
              <Mark className="h-20 w-20" mono="#fff" center="#0B1B3A" />
            </div>
            <div>
              <p className="eyebrow text-brand-red">{t.instr_tag}</p>
              <h3 className="text-2xl font-extrabold">{t.instr_name}</h3>
              <p className="font-semibold text-blue-300">{t.instr_role}</p>
              <p className="mt-4 max-w-2xl leading-8 text-slate-300">{t.instr_bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[t.instr_p1, t.instr_p2, t.instr_p3].map((p) => <span key={p} className="badge bg-white/10 px-3 py-1 text-sm text-white" dir="ltr">{p}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-red to-[#b71c1c] px-8 py-12 text-center text-white md:py-14">
          <Mark className="absolute -top-10 -start-10 h-48 w-48 opacity-15" mono="#fff" center="transparent" />
          <Mark className="absolute -bottom-12 -end-12 h-56 w-56 opacity-15" mono="#fff" center="transparent" />
          <h2 className="relative text-3xl font-black">{t.cta_title}</h2>
          <p className="relative mt-3 text-lg text-red-50">{t.cta_sub}</p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/courses" className="btn bg-white px-7 py-3 text-brand-red hover:bg-red-50">{t.hero_cta_courses}</Link>
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" className="btn border border-white/50 px-7 py-3 text-white hover:bg-white/10">WhatsApp</a>}
          </div>
        </div>
      </section>
    </>
  );
}
