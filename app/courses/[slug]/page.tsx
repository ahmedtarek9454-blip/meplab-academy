import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT, L } from '@/lib/i18n';
import { getSession } from '@/lib/auth';

function youtubeEmbed(url?: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
const lines = (s: string) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale } = await getT();
  const { supabase, user } = await getSession();
  const { data: c } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle();
  if (!c) notFound();

  let existing: any = null;
  let taskCount = 0;
  if (user) {
    const { data } = await supabase.from('orders').select('status').eq('user_id', user.id).eq('course_id', c.id)
      .in('status', ['pending', 'approved']).limit(1).maybeSingle();
    existing = data;
    if (existing?.status === 'approved') {
      const { count } = await supabase.from('course_tasks').select('id', { count: 'exact', head: true }).eq('course_id', c.id).eq('published', true);
      taskCount = count ?? 0;
    }
  }

  const lessons = lines(L(c, 'curriculum', locale));
  const outcomes = lines(L(c, 'outcomes', locale));
  const audience = lines(L(c, 'audience', locale));
  const embed = youtubeEmbed(c.preview_url);
  const levelLabel = c.level === 'advanced' ? t.level_advanced : c.level === 'intermediate' ? t.level_intermediate : t.level_beginner;
  const isLive = c.format === 'live';

  const facts = [
    { k: t.level, v: levelLabel },
    c.hours ? { k: t.video_hours, v: `${c.hours}`, ltr: true } : null,
    { k: t.lessons, v: `${lessons.length}` , ltr: true },
    c.software ? { k: t.software_label, v: c.software, ltr: true } : null
  ].filter(Boolean) as { k: string; v: string; ltr?: boolean }[];

  return (
    <>
      {/* header band */}
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -top-32 end-[-120px] h-[24rem] w-[24rem] rounded-full bg-brand-red/25 blur-3xl" />
        <div className="container-x relative py-12 md:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-brand-red text-white">● {isLive ? 'Live' : t.recorded_badge}</span>
            <span className="badge bg-white/10 text-white">{levelLabel}</span>
            {c.software && <span className="badge bg-white/10 text-white" dir="ltr">{c.software}</span>}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-snug md:text-4xl">{L(c, 'title', locale)}</h1>
          {!isLive && <p className="mt-4 max-w-2xl leading-7 text-slate-300">🎬 {t.recorded_note}</p>}
        </div>
      </section>

      <section className="container-x grid gap-8 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {embed ? (
            <div className="card aspect-video overflow-hidden">
              <iframe src={embed} className="h-full w-full" allowFullScreen title="preview" />
            </div>
          ) : c.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.cover_url} alt="" className="card aspect-video w-full object-cover" />
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.k} className="card p-4 text-center">
                <div className="text-lg font-black text-brand-navy" dir={f.ltr ? 'ltr' : undefined}>{f.v}</div>
                <div className="mt-0.5 text-xs text-slate-500">{f.k}</div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-bold text-brand-navy">{t.about_course}</h2>
          <p className="mt-2 whitespace-pre-line leading-8 text-slate-700">{L(c, 'desc', locale)}</p>

          {outcomes.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold text-brand-navy">{t.outcomes_title}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {outcomes.map((o) => (
                  <li key={o} className="card flex gap-3 p-4 text-sm leading-6 text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">✓</span>{o}
                  </li>
                ))}
              </ul>
            </>
          )}

          {lessons.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold text-brand-navy">{t.curriculum}</h2>
              <ol className="card mt-3 divide-y divide-slate-100">
                {lessons.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-blue">{i + 1}</span>
                    <span className="flex-1">{l}</span>
                    <span className="hidden text-xs text-slate-400 sm:inline">🎬 {t.recorded_badge}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="card mt-8 flex items-start gap-4 border-amber-200 bg-amber-50 p-5">
            <div className="text-3xl">📝</div>
            <div>
              <h3 className="font-bold text-brand-navy">{t.tasks_title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">{t.tasks_note}</p>
              {existing?.status === 'approved' && (
                <Link href={`/courses/${c.slug}/tasks`} className="btn-blue btn-sm mt-3">{t.go_tasks}{taskCount ? ` (${taskCount})` : ''}</Link>
              )}
            </div>
          </div>

          {audience.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold text-brand-navy">{t.audience_title}</h2>
              <ul className="mt-3 space-y-2">
                {audience.map((a) => <li key={a} className="flex gap-2 leading-7 text-slate-700"><span className="text-brand-red">◆</span>{a}</li>)}
              </ul>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="text-4xl font-black text-brand-red">{c.price_egp} <span className="text-lg">{t.egp}</span></div>
            <div className="mt-3 text-sm text-slate-600">
              {t.access}: <b>{c.access_days ? `${c.access_days} ${t.days}` : t.lifetime}</b>
            </div>
            <div className="mt-1 text-sm text-slate-600">🎬 <b>{isLive ? 'Live' : t.recorded_badge}</b></div>
            {existing?.status === 'approved' ? (
              <>
                <Link href="/dashboard" className="btn-blue mt-6 w-full">{t.already_owned}</Link>
                <Link href={`/courses/${c.slug}/tasks`} className="btn-ghost mt-2 w-full text-center">📝 {t.go_tasks}</Link>
              </>
            ) : existing?.status === 'pending' ? (
              <Link href="/dashboard" className="btn-ghost mt-6 w-full text-center">{t.already_pending}</Link>
            ) : (
              <Link href={user ? `/checkout/${c.slug}` : `/signup?next=/checkout/${c.slug}`} className="btn-red mt-6 w-full">{t.enroll}</Link>
            )}
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li>✓ {t.feat1_d}</li>
              <li>✓ {t.feat2_d}</li>
              <li>✓ {t.feat3_d}</li>
              <li>✓ {t.tasks_note}</li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
