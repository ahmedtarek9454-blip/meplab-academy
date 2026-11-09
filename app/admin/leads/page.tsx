import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth';
import { ROLES, MARKETS, type Market } from '@/lib/cv/data';

export const dynamic = 'force-dynamic';

export default async function Leads({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t, locale } = await getT();
  const ar = locale === 'ar';
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1), PER = 50;
  const { data, count } = await supabase.from('leads').select('*, profiles(phone, role_id, years, job_title)', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PER, page * PER - 1);
  const rows = data ?? [];
  const { count: today } = await supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString());
  const { data: uniq } = await supabase.from('leads').select('email');
  const unique = new Set((uniq ?? []).map((x: any) => x.email)).size;
  const role = (id: string | null) => ROLES.find((r) => r.id === id)?.[locale] || '—';
  const mk = (m: string | null) => (m && MARKETS[m as Market] ? MARKETS[m as Market][ar ? 'name_ar' : 'name_en'] : '—');

  return (
    <section className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="h-section">📧 {ar ? 'المسجّلين من أداة الـ CV' : 'CV-tool sign-ups'}</h1><p className="mt-1 text-sm text-slate-500">{ar ? 'كل واحد استخدم فحص الـ CV سجّل بإيميله هنا. صدّرهم CSV وابعتلهم أخبار الكورسات.' : 'Everyone who used the CV checker signed up here. Export CSV and email them course news.'}</p></div>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-ghost">{t.admin_title}</Link>
          <a href="/api/admin/leads.csv" className="btn-blue">⬇ CSV</a>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="card p-5"><div className="text-sm text-slate-500">{ar ? 'إجمالي الاستخدامات' : 'Total uses'}</div><div className="text-2xl font-black text-brand-navy">{count ?? 0}</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">{ar ? 'إيميلات فريدة' : 'Unique emails'}</div><div className="text-2xl font-black text-brand-navy">{unique}</div></div>
        <div className="card p-5"><div className="text-sm text-slate-500">{ar ? 'آخر 24 ساعة' : 'Last 24h'}</div><div className="text-2xl font-black text-brand-navy">{today ?? 0}</div></div>
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr>{[ar ? 'الاسم' : 'Name', 'Email', ar ? 'التخصص' : 'Role', ar ? 'الدولة' : 'Market', 'ATS', ar ? 'الخبرة' : 'Years', ar ? 'التاريخ' : 'Date'].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((l: any) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-semibold" dir="auto">{l.full_name || '—'}</td>
                <td className="px-4 py-3" dir="ltr"><a href={`mailto:${l.email}`} className="text-brand-blue">{l.email}</a>{l.profiles?.phone && <div className="text-xs text-slate-500">{l.profiles.phone}</div>}</td>
                <td className="px-4 py-3">{role(l.profiles?.role_id || l.role_id)}{l.profiles?.job_title && <div className="text-xs text-slate-500" dir="auto">{l.profiles.job_title}</div>}</td>
                <td className="px-4 py-3">{mk(l.market)}</td>
                <td className="px-4 py-3 font-bold">{l.ats_score ?? '—'}</td>
                <td className="px-4 py-3">{l.years ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">{new Date(l.created_at).toLocaleString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(count ?? 0) > PER && <div className="mt-4 flex justify-center gap-3 text-sm">{page > 1 && <Link href={`/admin/leads?page=${page - 1}`} className="btn-ghost btn-sm">{t.jobs_prev}</Link>}<span className="self-center text-slate-500" dir="ltr">{page} / {Math.ceil((count ?? 0) / PER)}</span>{page * PER < (count ?? 0) && <Link href={`/admin/leads?page=${page + 1}`} className="btn-ghost btn-sm">{t.jobs_next}</Link>}</div>}
    </section>
  );
}
