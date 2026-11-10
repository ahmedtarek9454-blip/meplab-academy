import Link from 'next/link';
import { L, type Locale } from '@/lib/i18n';
import { systemOf } from '@/lib/ui/systems';

// A course drawn as a sheet's title block: system colour strip, title, then the facts in cells.
export default function CourseCard({ c, locale, t, i = 0 }: { c: any; locale: Locale; t: any; i?: number }) {
  const lessons = (L(c, 'curriculum', locale) as string).split('\n').filter((s) => s.trim()).length;
  const sys = systemOf(c, i);
  const level = c.level === 'advanced' ? t.level_advanced : c.level === 'intermediate' ? t.level_intermediate : t.level_beginner;
  const isLive = c.format === 'live';

  return (
    <Link href={`/courses/${c.slug}`}
      className="group flex flex-col overflow-hidden rounded-sheet border border-line bg-white transition-colors hover:border-[var(--sys)] focus-visible:border-[var(--sys)]"
      style={{ ['--sys' as any]: sys.color }}>
      {/* system strip */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-white" style={{ background: sys.color }}>
        <span className="text-sm font-semibold">{locale === 'ar' ? sys.ar : sys.en}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden><path d="M3 2l7 4-7 4z" fill="currentColor" /></svg>
          {isLive ? 'Live' : t.recorded_badge}
        </span>
      </div>

      {c.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.cover_url} alt="" className="aspect-[16/9] w-full border-b border-line object-cover" />
      )}

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <h3 className="text-h3 text-ink">{L(c, 'title', locale)}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-7 text-ink-soft">{L(c, 'desc', locale)}</p>
      </div>

      {/* title block */}
      <dl className="tb grid-cols-3 text-start [&>div+div]:border-s">
        <div><dt className="tb-k">{t.level}</dt><dd className="tb-v truncate">{level.split('—')[0].trim()}</dd></div>
        <div><dt className="tb-k">{t.lessons}</dt><dd className="tb-v" dir="ltr">{lessons || '—'}</dd></div>
        <div><dt className="tb-k">{t.video_hours}</dt><dd className="tb-v" dir="ltr">{c.hours || '—'}</dd></div>
      </dl>

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="text-xl font-bold text-ink">{c.price_egp} <span className="text-sm font-medium text-ink-soft">{t.egp}</span></span>
        <span className="text-sm font-semibold underline-offset-4 group-hover:underline" style={{ color: sys.color }}>{t.view_course}</span>
      </div>
    </Link>
  );
}
