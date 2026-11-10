import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth';
import { MARKETS, ROLES, type Market } from '@/lib/cv/data';
import SubmitButton from '@/components/SubmitButton';
import { refreshNow, addJob, toggleJob, deleteJob } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminJobs({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t, locale } = await getT();
  const [{ data }, { count }, { data: last }] = await Promise.all([
    supabase.from('jobs').select('*').order('fetched_at', { ascending: false }).limit(50),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('jobs').select('fetched_at').neq('source', 'manual').order('fetched_at', { ascending: false }).limit(1)
  ]);
  const jobs = data ?? [];
  const r = sp.r || '';
  const configured = !!process.env.JOOBLE_API_KEY || !!process.env.RAPIDAPI_KEY;

  return (
    <section className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-section">{t.jobs_admin}</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-ghost">{t.admin_title}</Link>
          <form action={refreshNow}><SubmitButton className="btn-blue">↻ {t.jobs_refresh}</SubmitButton></form>
        </div>
      </div>

      {!configured && (
        <p className="mt-4 rounded-sheet bg-amber-50 p-4 text-sm text-amber-800" dir="auto">
          ⚠️ JOOBLE_API_KEY / RAPIDAPI_KEY not set — automatic jobs are off. See README.
        </p>
      )}
      {r.startsWith('ok:') && <p className="mt-4 rounded-sheet bg-green-50 p-4 text-green-800">{t.jobs_refreshed.replace('{n}', r.split(':')[1])}</p>}
      {r.startsWith('err:') && <p className="mt-4 rounded-sheet bg-red-50 p-4 text-sm text-red-700" dir="ltr">{decodeURIComponent(r.slice(4))}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="card p-5"><div className="text-sm text-ink-mute">{t.nav_jobs}</div><div className="text-2xl font-bold text-ink">{count ?? 0}</div></div>
        <div className="card p-5"><div className="text-sm text-ink-mute">{t.jobs_last}</div><div className="text-sm font-bold text-ink" dir="ltr">{last?.[0]?.fetched_at ? new Date(last[0].fetched_at).toLocaleString('en-GB') : '—'}</div></div>
      </div>

      <form action={addJob} className="card mt-6 grid gap-3 p-6 md:grid-cols-3">
        <h2 className="text-lg font-bold text-ink md:col-span-3">{t.jobs_add}</h2>
        <input name="title" required placeholder={t.jobs_f_title} className="input" dir="auto" />
        <input name="company" placeholder={t.jobs_f_company} className="input" dir="auto" />
        <input name="location" placeholder={t.jobs_f_location} className="input" dir="auto" />
        <input name="url" required placeholder={t.jobs_f_url + ' (https://...)'} className="input" dir="ltr" />
        <select name="market" className="input">
          {(Object.keys(MARKETS) as Market[]).map((m) => <option key={m} value={m}>{MARKETS[m][locale === 'ar' ? 'name_ar' : 'name_en']}</option>)}
        </select>
        <select name="role" className="input">
          {ROLES.map((x) => <option key={x.id} value={x.id}>{x[locale]}</option>)}
        </select>
        <div className="md:col-span-3"><SubmitButton className="btn-red">{t.save}</SubmitButton></div>
      </form>

      <div className="card mt-6 divide-y divide-line">
        {jobs.map((j: any) => (
          <div key={j.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 ${j.active ? '' : 'opacity-50'}`}>
            <div className="min-w-0">
              <a href={j.url} target="_blank" className="font-bold text-ink hover:text-brand-blue" dir="auto">{j.title}</a>
              <div className="text-xs text-ink-mute" dir="auto">{j.company} · {j.location} · {j.source}</div>
            </div>
            <div className="flex gap-2">
              <form action={toggleJob}>
                <input type="hidden" name="id" value={j.id} /><input type="hidden" name="active" value={j.active ? '0' : '1'} />
                <button className="btn-ghost btn-sm">{j.active ? t.jobs_hide : t.jobs_show}</button>
              </form>
              <form action={deleteJob}>
                <input type="hidden" name="id" value={j.id} />
                <button className="btn-ghost btn-sm text-red-600">{t.jobs_delete}</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
