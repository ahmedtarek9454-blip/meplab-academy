import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT, L } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { systemOf } from '@/lib/ui/systems';

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
  const sys = systemOf(c);

  const facts = [
    { k: t.level, v: levelLabel },
    c.hours ? { k: t.video_hours, v: `${c.hours}`, ltr: true } : null,
    { k: t.lessons, v: `${lessons.length}` , ltr: true },
    c.software ? { k: t.software_label, v: c.software, ltr: true } : null
  ].filter(Boolean) as { k: string; v: string; ltr?: boolean }[];

  return (
    <div style={{ ['--sys' as any]: sys.color }}>
      {/* header band: course drawn in its system colour */}
      <section className="bg-grid-ink border-b border-line">
        <div className="container-x py-10 md:py-14">
          <nav className="text-sm text-ink-mute"><Link href="/courses" className="hover:text-ink">{t.nav_courses}</Link> <span className="mx-1">/</span> <span style={{ color: sys.color }}>{locale === 'ar' ? sys.ar : sys.en}</span></nav>
          <h1 className="mt-3 max-w-3xl text-[1.9rem] font-bold leading-snug text-ink md:text-h1">{L(c, 'title', locale)}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="badge text-white" style={{ background: sys.color }}>
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden><path d="M3 2l7 4-7 4z" fill="currentColor" /></svg>
              {isLive ? 'Live' : t.recorded_badge}
            </span>
            {!isLive && <span className="text-sm text-ink-soft">{t.recorded_note}</span>}
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-10 lg:grid-cols-[1fr,22rem]">
        <div className="min-w-0">
          {embed ? (
            <div className="aspect-video overflow-hidden rounded-sheet border border-line bg-ink">
              <iframe src={embed} className="h-full w-full" allowFullScreen title="preview" />
            </div>
          ) : c.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.cover_url} alt="" className="aspect-video w-full rounded-sheet border border-line object-cover" />
          ) : null}

          {/* title block of facts */}
          <dl className={`card grid grid-cols-2 overflow-hidden sm:grid-cols-4 ${embed || c.cover_url ? 'mt-6' : ''}`}>
            {facts.map((f, i) => (
              <div key={f.k} className={`border-line px-4 py-3 ${i % 2 ? 'border-s' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-s' : ''}`}>
                <dt className="tb-k">{f.k}</dt>
                <dd className="tb-v mt-0.5 truncate" dir={f.ltr ? 'ltr' : undefined} style={f.ltr ? { textAlign: 'end' } : undefined}>{f.v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 text-h3 font-semibold">{t.about_course}</h2>
          <p className="mt-2 max-w-[70ch] whitespace-pre-line leading-8 text-ink-soft">{L(c, 'desc', locale)}</p>

          {outcomes.length > 0 && (
            <>
              <h2 className="mt-10 text-h3 font-semibold">{t.outcomes_title}</h2>
              <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {outcomes.map((o) => (
                  <li key={o} className="flex gap-3 leading-7 text-ink">
                    <svg viewBox="0 0 16 16" className="mt-1.5 h-4 w-4 shrink-0" style={{ color: sys.color }} aria-hidden><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>{o}
                  </li>
                ))}
              </ul>
            </>
          )}

          {lessons.length > 0 && (
            <>
              <h2 className="mt-10 text-h3 font-semibold">{t.curriculum} <span className="text-base font-normal text-ink-mute">({lessons.length})</span></h2>
              <ol className="card mt-3 divide-y divide-line">
                {lessons.map((l, i) => (
                  <li key={i} className="flex items-baseline gap-4 px-4 py-3">
                    <span className="w-6 shrink-0 text-sm font-semibold tabular-nums" style={{ color: sys.color }} dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 leading-7 text-ink">{l}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="mt-10 rounded-sheet border-s-4 bg-white p-5 ring-1 ring-line" style={{ borderInlineStartColor: sys.color }}>
            <h3 className="font-semibold text-ink">{t.tasks_title}</h3>
            <p className="mt-1 text-sm leading-7 text-ink-soft">{t.tasks_note}</p>
            {existing?.status === 'approved' && (
              <Link href={`/courses/${c.slug}/tasks`} className="btn-blue btn-sm mt-3">{t.go_tasks}{taskCount ? ` (${taskCount})` : ''}</Link>
            )}
          </div>

          {audience.length > 0 && (
            <>
              <h2 className="mt-10 text-h3 font-semibold">{t.audience_title}</h2>
              <ul className="mt-3 space-y-2">
                {audience.map((a) => <li key={a} className="flex gap-3 leading-7 text-ink"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: sys.color }} />{a}</li>)}
              </ul>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="sheet overflow-hidden">
            <div className="h-1.5" style={{ background: sys.color }} />
            <div className="p-6">
              <div className="text-[2.25rem] font-bold leading-none text-ink">{c.price_egp} <span className="text-base font-medium text-ink-soft">{t.egp}</span></div>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-ink-mute">{t.access}</dt><dd className="font-semibold text-ink">{c.access_days ? `${c.access_days} ${t.days}` : t.lifetime}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-mute">{t.level}</dt><dd className="font-semibold text-ink">{levelLabel}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-mute">{locale === 'ar' ? 'النوع' : 'Format'}</dt><dd className="font-semibold text-ink">{isLive ? 'Live' : t.recorded_badge}</dd></div>
              </dl>
              {existing?.status === 'approved' ? (
                <>
                  <Link href="/dashboard" className="btn-blue mt-6 w-full">{t.already_owned}</Link>
                  <Link href={`/courses/${c.slug}/tasks`} className="btn-ghost mt-2 w-full">{t.go_tasks}</Link>
                </>
              ) : existing?.status === 'pending' ? (
                <Link href="/dashboard" className="btn-ghost mt-6 w-full">{t.already_pending}</Link>
              ) : (
                <Link href={user ? `/checkout/${c.slug}` : `/signup?next=/checkout/${c.slug}`} className="btn-red mt-6 w-full py-3">{t.enroll}</Link>
              )}
            </div>
            <ul className="space-y-2 border-t border-line p-6 text-sm leading-6 text-ink-soft">
              {[t.feat1_d, t.feat2_d, t.feat3_d].map((x) => <li key={x} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-mute" />{x}</li>)}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
