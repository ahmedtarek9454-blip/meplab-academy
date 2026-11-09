import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import { MARKETS, ROLES, type Market } from '@/lib/cv/data';
import JobCard, { ago } from '@/components/JobCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'وظايف MEP في مصر والسعودية والإمارات — MEP LAB', description: 'أحدث وظايف مهندس تكييف وحريق و BIM وصحي في مصر والسعودية والإمارات، بتتحدّث كل يوم.' };
const PER = 20;

export default async function Jobs({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const supabase = await createClient();
  const market = (sp.market && sp.market in MARKETS ? sp.market : '') as Market | '';
  const role = ROLES.some((r) => r.id === sp.role) ? sp.role : '';
  const q = (sp.q || '').trim().slice(0, 60);
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  let query = supabase.from('jobs').select('*', { count: 'exact' }).eq('active', true);
  if (market) query = query.eq('market', market);
  if (role) query = query.eq('role_id', role);
  if (q) {
    const safe = q.replace(/[%,()]/g, ' ');
    query = query.or(`title.ilike.%${safe}%,company.ilike.%${safe}%`);
  }
  const { data, count } = await query
    .order('posted_at', { ascending: false, nullsFirst: false })
    .range((page - 1) * PER, page * PER - 1);
  const jobs = data ?? [];
  const total = count ?? jobs.length;
  const pages = Math.max(1, Math.ceil(total / PER));
  const link = (o: Record<string, string | number>) => {
    const u = new URLSearchParams({ ...(market && { market }), ...(role && { role }), ...(q && { q }), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) });
    for (const [k, v] of [...u.entries()]) if (!v) u.delete(k);
    return `/jobs?${u.toString()}`;
  };

  return (
    <>
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute -bottom-24 start-[-100px] h-80 w-80 rounded-full bg-brand-blue/40 blur-3xl" />
        <div className="container-x relative py-12 md:py-14">
          <h1 className="text-3xl font-black md:text-4xl">{t.jobs_title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">{t.jobs_sub}</p>

          <form className="mt-8 grid gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur md:grid-cols-[1fr,auto,auto,auto]">
            <input name="q" defaultValue={q} placeholder={t.jobs_search} className="input border-0 text-slate-800" dir="auto" />
            <select name="market" defaultValue={market} className="input border-0 text-slate-800 md:w-44">
              <option value="">{t.jobs_all_markets}</option>
              {(Object.keys(MARKETS) as Market[]).map((m) => <option key={m} value={m}>{MARKETS[m][locale === 'ar' ? 'name_ar' : 'name_en']}</option>)}
            </select>
            <select name="role" defaultValue={role} className="input border-0 text-slate-800 md:w-60">
              <option value="">{t.jobs_all_roles}</option>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r[locale]}</option>)}
            </select>
            <button className="btn-red">{t.jobs_filter}</button>
          </form>
        </div>
      </section>

      <section className="container-x grid gap-8 py-10 lg:grid-cols-[1fr,300px]">
        <div>
          <div className="mb-4 text-sm font-semibold text-slate-500">{total.toLocaleString('en-US')} {t.jobs_found}</div>
          {jobs.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">{t.jobs_none}</div>
          ) : (
            <div className="space-y-3">
              {jobs.map((j: any) => (
                <JobCard key={j.id} j={j} locale={locale} applyLabel={t.jobs_apply} when={ago(j.posted_at, locale, t.jobs_today, t.jobs_days_ago)} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {page > 1 && <Link href={link({ page: page - 1 })} className="btn-ghost btn-sm">{t.jobs_prev}</Link>}
              <span className="text-sm text-slate-500" dir="ltr">{page} / {pages}</span>
              {page < pages && <Link href={link({ page: page + 1 })} className="btn-ghost btn-sm">{t.jobs_next}</Link>}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-5 text-white">
              <div className="text-3xl">📄</div>
              <div className="mt-2 text-lg font-extrabold">{t.jobs_cv_t}</div>
              <p className="mt-1 text-sm text-green-50">{t.jobs_cv_d}</p>
            </div>
            <div className="p-4"><Link href="/cv-check" className="btn w-full bg-green-600 text-white hover:bg-green-700">{t.cvp_b}</Link></div>
          </div>
          <div className="card p-5">
            <div className="mb-3 font-bold text-brand-navy">{t.jobs_all_roles}</div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Link key={r.id} href={link({ role: r.id, page: 1 })} className={`badge px-3 py-1.5 text-xs ${role === r.id ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{r[locale]}</Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
