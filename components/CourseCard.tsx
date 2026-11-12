import Link from 'next/link';
import { L, type Locale } from '@/lib/i18n';
import { artKey, COURSE_COLOR, COURSE_GLOW, COURSE_DEEP } from '@/lib/ui/courseArt';
import CourseArt from './CourseArt';
import NotifyMe from './NotifyMe';
import { SHOW_PRICES } from '@/lib/features';

export { COURSE_DEEP };

/** a course as a drawing sheet: the discipline drawing on top, its system colour as the only accent */
export default function CourseCard({ c, locale, t, size = 'lg' }: { c: any; locale: Locale; t: any; size?: 'lg' | 'sm' }) {
  const k = artKey(c);
  const soon = c.status === 'soon';
  const ar = locale === 'ar';
  const lessons = (L(c, 'curriculum', locale) as string).split('\n').filter((s) => s.trim()).length;
  const href = `/courses/${c.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-white text-ink">
      <Link href={href} tabIndex={-1} aria-hidden className={`block overflow-hidden border-b-[1.5px] border-ink ${size === 'lg' ? 'aspect-[16/6] sm:aspect-[16/8]' : 'aspect-[16/6] sm:aspect-[16/9]'}`}>
        <CourseArt course={c} palette={{ bg: '#F7F8FA', line: '#1D2329', soft: 'rgba(31,95,175,.16)', accent: soon ? '#9AA3AE' : COURSE_COLOR[k] }} className={`h-full w-full ${soon ? 'opacity-70' : ''}`} />
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className={`self-start rounded-[3px] border px-2 py-0.5 text-[13px] font-bold ${soon ? 'border-line text-ink-mute' : 'border-brand-blue text-brand-blue'}`}>{soon ? (ar ? 'قريبًا' : 'Coming soon') : (ar ? 'متاح الآن · كورس مسجّل' : 'Available now · recorded')}</span>
        <h3 className={`mt-3 font-display font-bold leading-snug ${size === 'lg' ? 'text-[1.6rem]' : 'text-[1.3rem]'}`}>
          <Link href={href} className="hover:underline hover:decoration-[1.5px] hover:underline-offset-4">{L(c, 'title', locale)}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 leading-7 text-ink-soft">{L(c, 'desc', locale)}</p>
        {soon ? (
          <NotifyMe slug={c.slug} locale={locale} className="mt-4" inputClass="input" buttonClass="btn-red btn-sm" />
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-sm text-ink-soft">
              {c.hours ? <span><b className="text-ink">{c.hours}</b> {t.video_hours}</span> : null}
              {lessons ? <span><b className="text-ink">{lessons}</b> {t.lessons}</span> : null}
              {c.preview_url ? <span>{ar ? 'فيديو تعريفي مجاني' : 'Free intro video'}</span> : null}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              {SHOW_PRICES ? <span className="font-display text-[1.75rem] font-bold leading-none">{Number(c.price_egp).toLocaleString('en-US')} <span className="font-sans text-base font-medium text-ink-mute">{t.egp}</span></span> : <span />}
              <Link href={href} className="btn-ghost btn-sm">{ar ? 'تفاصيل الكورس' : 'Course details'}</Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
