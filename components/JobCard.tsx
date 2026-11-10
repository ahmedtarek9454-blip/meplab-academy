import { MARKETS, ROLES, type Market } from '@/lib/cv/data';

type Loc = 'ar' | 'en';
const roleName = (id: string | null, l: Loc) => {
  const r = ROLES.find((x) => x.id === id);
  return r ? r[l] : '';
};

export function ago(iso: string | null, l: Loc, today: string, tpl: string) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return today;
  return tpl.replace('{n}', String(d));
}

export default function JobCard({ j, locale, applyLabel, when }: { j: any; locale: Loc; applyLabel: string; when?: string }) {
  const m = MARKETS[j.market as Market];
  const initials = (j.company || j.title || '?').replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  return (
    <div className="card flex flex-col gap-4 p-5 transition sm:flex-row sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sheet bg-ink text-sm font-bold text-white" dir="ltr">{initials}</div>
      <div className="min-w-0 flex-1">
        <a href={j.url} target="_blank" rel="noopener nofollow" className="block truncate text-lg font-bold text-ink hover:text-brand-blue" dir="auto">{j.title}</a>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-mute">
          {j.company && <span className="font-semibold text-ink-soft" dir="auto">{j.company}</span>}
          <span dir="auto">📍 {j.location || (m ? m[locale === 'ar' ? 'name_ar' : 'name_en'] : '')}</span>
          {when && <span>🕒 {when}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {j.role_id && <span className="badge bg-blue-50 text-brand-blue">{roleName(j.role_id, locale)}</span>}
          {j.salary && <span className="badge bg-green-50 text-green-700" dir="auto">💰 {j.salary}</span>}
          <span className="badge bg-slate-100 text-ink-mute" dir="ltr">{j.source === 'manual' ? 'MEP LAB' : j.source}</span>
        </div>
      </div>
      <a href={j.url} target="_blank" rel="noopener nofollow" className="btn-red btn-sm shrink-0 px-5 py-2">{applyLabel} ↗</a>
    </div>
  );
}
