'use client';
import { KIND_LABEL, SYS_LABEL, duration, type Profile } from '@/lib/cv/profile';

/** the person's job history, job by job, with what each one is missing */
export default function CvHistory({ locale, p }: { locale: 'ar' | 'en'; p: Profile }) {
  const ar = locale === 'ar';
  if (!p.jobs.length) return null;
  const fixes = p.notes.filter((n) => n.tone === 'fix');
  const goods = p.notes.filter((n) => n.tone === 'good');
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-ink">{ar ? 'سابقة أعمالك' : 'Your work history'}</h3>
        {p.totalMonths > 0 && <span className="text-sm text-ink-mute">{ar ? `${p.jobs.length === 1 ? 'وظيفة واحدة' : p.jobs.length === 2 ? 'وظيفتين' : `${p.jobs.length} وظايف`}، ${duration(p.totalMonths, true)} في المجموع` : `${p.jobs.length} job${p.jobs.length > 1 ? 's' : ''}, ${duration(p.totalMonths, false)} in total`}</span>}
      </div>

      <ol className="mt-4 border-s-2 border-line">
        {p.jobs.map((j, i) => (
          <li key={i} className="relative ps-5 pb-5 last:pb-0">
            <span className="absolute -start-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-ink bg-white" />
            <div className="font-bold text-ink" dir="auto" style={{ textAlign: ar ? 'right' : 'left' }}>{j.title}</div>
            <div className="text-sm text-ink-soft">
              <span dir="auto">{[j.company, j.dates].filter(Boolean).join(' · ')}</span>
              {j.months > 0 && <span className="ms-2 whitespace-nowrap font-semibold text-ink">{duration(j.months, ar)}</span>}
            </div>
            {(j.kinds.length > 0 || j.systems.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {j.kinds.map((k) => <span key={k} className="rounded-sheet bg-ink px-2 py-0.5 text-white">{KIND_LABEL[k][locale]}</span>)}
                {j.systems.map((s) => <span key={s} className="rounded-sheet border border-line px-2 py-0.5 text-ink-soft">{SYS_LABEL[s][locale]}</span>)}
              </div>
            )}
            {(j.bullets === 0 || !j.numbers) && (
              <p className="mt-1.5 text-xs text-brand-red">
                {j.bullets === 0 ? (ar ? 'مفيش نقاط بتشرح شغلك هنا' : 'No bullets about your work here') : ar ? 'مفيش أرقام في النقاط دي' : 'No numbers in these bullets'}
              </p>
            )}
          </li>
        ))}
      </ol>

      {(goods.length > 0 || fixes.length > 0 || p.headlineTip) && (
        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm leading-7">
          {goods.map((n, i) => <li key={'g' + i} className="flex gap-2 text-ink-soft"><span className="font-bold text-ink">✓</span><span>{n[locale]}</span></li>)}
          {p.headlineTip && <li className="flex gap-2 text-ink"><span className="font-bold text-brand-red">!</span><span>{p.headlineTip[locale]}</span></li>}
          {fixes.map((n, i) => <li key={'f' + i} className="flex gap-2 text-ink"><span className="font-bold text-brand-red">!</span><span>{n[locale]}</span></li>)}
        </ul>
      )}
    </div>
  );
}
