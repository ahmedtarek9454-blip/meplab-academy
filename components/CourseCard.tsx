import Link from 'next/link';
import { L, type Locale } from '@/lib/i18n';
import { Mark } from './Logo';

const GRADS = [
  'from-[#0B1B3A] via-[#13306b] to-[#1E5BD6]',
  'from-[#2a0f17] via-[#7a1d2a] to-[#E53935]',
  'from-[#06222b] via-[#0b4a5c] to-[#0e9bb5]'
];

export default function CourseCard({ c, locale, t, i = 0 }: { c: any; locale: Locale; t: any; i?: number }) {
  const lessons = (L(c, 'curriculum', locale) as string).split('\n').filter((s) => s.trim()).length;
  return (
    <Link href={`/courses/${c.slug}`} className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/10">
      <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${GRADS[i % GRADS.length]}`}>
        {c.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <>
            <div className="bg-grid absolute inset-0" />
            <Mark className="absolute -bottom-8 -end-8 h-40 w-40 opacity-20 transition duration-700 group-hover:rotate-45" mono="#fff" center="transparent" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <div className="text-xl font-extrabold leading-snug text-white drop-shadow">{L(c, 'title', locale)}</div>
            </div>
          </>
        )}
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          <span className="badge bg-brand-red text-white shadow">● {c.format === 'live' ? 'Live' : t.recorded_badge}</span>
          <span className="badge bg-white/90 text-brand-navy backdrop-blur">{c.access_days ? `${c.access_days} ${t.days}` : t.lifetime}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-blue">{L(c, 'title', locale)}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-600">{L(c, 'desc', locale)}</p>
        {lessons > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></svg>
            {lessons} {t.lessons}{c.hours ? <span dir="ltr"> · {c.hours} {t.video_hours}</span> : null}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-2xl font-black text-brand-red">{c.price_egp} <span className="text-sm font-bold">{t.egp}</span></span>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
            {t.view_course} {locale === 'ar' ? '←' : '→'}
          </span>
        </div>
      </div>
    </Link>
  );
}
