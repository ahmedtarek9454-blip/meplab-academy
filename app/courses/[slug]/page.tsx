import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT, L } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { getCourseBySlug } from '@/lib/data/courses';
import { artKey, COURSE_COLOR, COURSE_GLOW } from '@/lib/ui/courseArt';
import CourseArt from '@/components/CourseArt';
import { COURSE_DEEP } from '@/components/CourseCard';
import { videoEmbed } from '@/lib/ui/video';
import NotifyMe from '@/components/NotifyMe';
import ContactButtons from '@/components/ContactButtons';

const lines = (s: string) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale } = await getT();
  const [{ supabase, user, isAdmin }, c] = await Promise.all([getSession(), getCourseBySlug(slug).catch(() => null)]);
  if (!c || (!c.published && !isAdmin)) notFound();

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
  const embed = videoEmbed(c.preview_url);
  const soon = c.status === 'soon';
  const ar = locale === 'ar';
  const levelLabel = c.level === 'advanced' ? t.level_advanced : c.level === 'intermediate' ? t.level_intermediate : t.level_beginner;
  const isLive = c.format === 'live';
  const k = artKey(c);
  const sys = { color: COURSE_COLOR[k], deep: COURSE_DEEP[k] };

  const facts = [
    { k: t.level, v: levelLabel },
    c.hours ? { k: t.video_hours, v: `${c.hours}`, ltr: true } : null,
    { k: t.lessons, v: `${lessons.length}` , ltr: true },
    c.software ? { k: t.software_label, v: c.software, ltr: true } : null
  ].filter(Boolean) as { k: string; v: string; ltr?: boolean }[];

  return (
    <div style={{ ['--sys' as any]: sys.color }}>
      {/* header block in the course's discipline colour */}
      <section className="text-white" style={{ background: soon ? sys.deep : sys.color }}>
        <div className="container-x grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[1.15fr,.85fr]">
          <div>
            <nav className="text-sm font-medium text-white/80"><Link href="/courses" className="hover:text-white hover:underline">{t.nav_courses}</Link> <span className="mx-1">/</span> {L(c, 'title', locale)}</nav>
            <span className="mt-5 inline-block rounded bg-black/20 px-2.5 py-1 text-sm font-bold">{soon ? (ar ? 'قريبًا' : 'Coming soon') : isLive ? 'Live' : (ar ? 'متاح الآن · كورس مسجّل' : 'Available now · recorded')}</span>
            <h1 className="display mt-3 text-[2.4rem] leading-[1.15] md:text-[3.6rem]">{L(c, 'title', locale)}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90">{L(c, 'desc', locale)}</p>
            {!isLive && <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">{t.recorded_note}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {embed && <a href="#intro" className="btn-white">{ar ? 'اتفرّج على الفيديو التعريفي' : 'Watch the free intro'}</a>}
              <a href="#enroll" className="btn-outline-white">{soon ? (ar ? 'بلّغني لما ينزل' : 'Notify me') : (ar ? 'اشترك' : 'Enrol')}</a>
            </div>
          </div>
          <CourseArt course={c} palette={{ bg: sys.deep, line: '#ffffff', soft: 'rgba(255,255,255,.14)', accent: COURSE_GLOW[k] }} className="aspect-[16/10] overflow-hidden rounded-[10px]" />
        </div>
      </section>

      <section className="container-x grid gap-10 py-10 lg:grid-cols-[1fr,22rem]">
        <div className="min-w-0">
          {embed ? (
            <div id="intro" className="scroll-mt-24">
            <h2 className="display mb-3 text-2xl">{ar ? 'الفيديو التعريفي — ببلاش' : 'Free intro video'}</h2>
            <div className="aspect-video overflow-hidden rounded-[10px] bg-ink">
              <iframe src={embed} className="h-full w-full" allowFullScreen loading="lazy" title={ar ? 'الفيديو التعريفي' : 'Intro video'} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" />
            </div>
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


          {outcomes.length > 0 && (
            <>
              <h2 className="display mt-10 text-2xl">{t.outcomes_title}</h2>
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
              <h2 className="display mt-10 text-2xl">{t.curriculum} <span className="text-base font-normal text-ink-mute">({lessons.length})</span></h2>
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
              <h2 className="display mt-10 text-2xl">{t.audience_title}</h2>
              <ul className="mt-3 space-y-2">
                {audience.map((a) => <li key={a} className="flex gap-3 leading-7 text-ink"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: sys.color }} />{a}</li>)}
              </ul>
            </>
          )}
        </div>

        <aside id="enroll" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <div className="sheet overflow-hidden">
            <div className="h-1.5" style={{ background: sys.color }} />
            <div className="p-6">
              {soon ? <div className="text-2xl font-bold text-ink">{ar ? 'قريبًا' : 'Coming soon'}</div> : <div className="text-[2.25rem] font-bold leading-none text-ink">{c.price_egp} <span className="text-base font-medium text-ink-soft">{t.egp}</span></div>}
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-ink-mute">{t.access}</dt><dd className="font-semibold text-ink">{c.access_days ? `${c.access_days} ${t.days}` : t.lifetime}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-mute">{t.level}</dt><dd className="font-semibold text-ink">{levelLabel}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-mute">{locale === 'ar' ? 'النوع' : 'Format'}</dt><dd className="font-semibold text-ink">{isLive ? 'Live' : t.recorded_badge}</dd></div>
              </dl>
              {soon ? (
                <div className="mt-6">
                  <p className="mb-3 text-sm leading-6 text-ink-soft">{ar ? 'الكورس ده لسه بيتجهّز. سيب إيميلك ونبعتلك أول ما ينزل.' : 'This course is being prepared. Leave your email and we will tell you the day it launches.'}</p>
                  <NotifyMe slug={c.slug} locale={locale} email={user?.email || ''} />
                </div>
              ) : existing?.status === 'approved' ? (
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
            <div className="border-t border-line px-6 py-4">
              <p className="mb-2 text-sm font-semibold text-ink">{ar ? 'عندك سؤال قبل ما تشترك؟' : 'Questions before you enrol?'}</p>
              <ContactButtons courseTitle={L(c, 'title', locale)} locale={locale} btnClass="btn-ghost btn-sm" />
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
