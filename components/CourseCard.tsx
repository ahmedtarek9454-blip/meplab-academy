import Link from 'next/link';
import { L, type Locale } from '@/lib/i18n';
import { artKey, COURSE_COLOR, COURSE_GLOW, COURSE_DEEP } from '@/lib/ui/courseArt';
import CourseArt from './CourseArt';
import NotifyMe from './NotifyMe';
import { SHOW_PRICES } from '@/lib/features';

export { COURSE_DEEP };

/** a course as a colour block in its discipline's colour; coming-soon courses take the deep tone and a notify form */
export default function CourseCard({ c, locale, t, size = 'lg' }: { c: any; locale: Locale; t: any; size?: 'lg' | 'sm' }) {
  const k = artKey(c);
  const soon = c.status === 'soon';
  const ar = locale === 'ar';
  const lessons = (L(c, 'curriculum', locale) as string).split('\n').filter((s) => s.trim()).length;
  const href = `/courses/${c.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-[10px] text-white" style={{ background: soon ? COURSE_DEEP[k] : COURSE_COLOR[k] }}>
      <Link href={href} tabIndex={-1} aria-hidden className={`block overflow-hidden ${size === 'lg' ? 'aspect-[16/8]' : 'aspect-[16/9]'}`}>
        <CourseArt course={c} palette={{ bg: COURSE_DEEP[k], line: '#ffffff', soft: 'rgba(255,255,255,.14)', accent: COURSE_GLOW[k] }} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className="self-start rounded bg-black/20 px-2.5 py-1 text-sm font-bold">{soon ? (ar ? 'قريبًا' : 'Coming soon') : (ar ? 'متاح الآن · كورس مسجّل' : 'Available now · recorded')}</span>
        <h3 className={`mt-3 font-display font-black leading-tight ${size === 'lg' ? 'text-[1.75rem]' : 'text-[1.35rem]'}`}>
          <Link href={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">{L(c, 'title', locale)}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 leading-7 opacity-90">{L(c, 'desc', locale)}</p>
        {soon ? (
          <NotifyMe slug={c.slug} locale={locale} className="mt-4" inputClass="w-full rounded-md border-0 bg-white px-3 py-2.5 text-ink outline-none" buttonClass="btn-blue btn-sm" />
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium opacity-90">
              {c.hours ? <span>{c.hours} {t.video_hours}</span> : null}
              {lessons ? <span>{lessons} {t.lessons}</span> : null}
              {c.preview_url ? <span>{ar ? 'فيديو تعريفي مجاني' : 'Free intro video'}</span> : null}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              {SHOW_PRICES ? <span className="font-display text-[2rem] font-black leading-none">{Number(c.price_egp).toLocaleString('en-US')} <span className="font-sans text-base font-medium opacity-80">{t.egp}</span></span> : <span />}
              <Link href={href} className="btn-white btn-sm">{ar ? 'تفاصيل الكورس' : 'Course details'}</Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
