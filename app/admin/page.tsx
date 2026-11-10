import { JOBS_ENABLED } from '@/lib/features';
import Link from 'next/link';
import { getT, L } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import { approveOrder, rejectOrder, approveDevice, rejectDevice } from './actions';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const { supabase } = await requireAdmin();
  const { t, locale } = await getT();
  const sel = '*, profiles(email, full_name, phone), courses(title_ar, title_en)';

  const [{ data: devReqs }, { data: pending }, { data: recent }, { count: students }, { data: approved }] = await Promise.all([
    supabase.from('device_requests').select('*, profiles(full_name, email, phone), orders(device_changes, courses(title_ar, title_en))').eq('status', 'pending').order('created_at'),
    supabase.from('orders').select(sel).eq('status', 'pending').order('created_at'),
    supabase.from('orders').select(sel).neq('status', 'pending').order('reviewed_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('orders').select('amount').eq('status', 'approved')
  ]);

  const pend = pending ?? [];
  const urls: Record<string, string> = {};
  await Promise.all(pend.map(async (o: any) => {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(o.receipt_path, 3600);
    if (data?.signedUrl) urls[o.id] = data.signedUrl;
  }));
  const revenue = (approved ?? []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const fmt = (d: string) => new Date(d).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const methodName = (m: string) => (m === 'instapay' ? t.instapay : t.vodafone_cash);

  const stats = [
    { k: t.stats_students, v: students ?? 0 },
    { k: t.stats_pending, v: pend.length },
    { k: t.stats_approved, v: (approved ?? []).length },
    { k: t.stats_revenue, v: `${revenue.toLocaleString()} ${t.egp}` }
  ];

  return (
    <section className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-section">{t.admin_title}</h1>
        <div className="flex gap-2">
          <Link href="/admin/tasks" className="btn-ghost">📝 {t.adm_tasks}</Link>
          <Link href="/admin/leads" className="btn-ghost">📧 Leads</Link>
          <Link href="/admin/model" className="btn-ghost">🧠 ATS Model</Link>
          {JOBS_ENABLED && <Link href="/admin/jobs" className="btn-ghost">{t.jobs_admin}</Link>}
          <Link href="/admin/courses" className="btn-blue">{t.manage_courses}</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="card p-5">
            <div className="text-sm text-ink-mute">{s.k}</div>
            <div className="mt-1 text-2xl font-bold text-ink">{s.v}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-xl font-bold text-ink">{t.pending_orders} ({pend.length})</h2>
      {pend.length === 0 ? (
        <div className="card p-8 text-center text-ink-mute">{t.no_pending}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pend.map((o: any) => (
            <div key={o.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-ink">{o.profiles?.full_name || '—'}</div>
                  <div className="text-sm text-ink-mute" dir="ltr">{o.profiles?.email} · {o.profiles?.phone}</div>
                </div>
                <span className="badge bg-amber-100 text-amber-800">{t.status_pending}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-ink-mute">{t.course}</dt><dd className="font-semibold">{L(o.courses, 'title', locale)}</dd>
                <dt className="text-ink-mute">{t.method}</dt><dd className="font-semibold">{methodName(o.method)} — {o.amount} {t.egp}</dd>
                <dt className="text-ink-mute">{t.sender_ref}</dt><dd className="font-semibold" dir="ltr">{o.sender_ref}</dd>
                <dt className="text-ink-mute">{t.machine_code}</dt><dd className="break-all font-mono font-semibold" dir="ltr">{o.machine_code}</dd>
                <dt className="text-ink-mute">{t.date}</dt><dd>{fmt(o.created_at)}</dd>
              </dl>
              {urls[o.id] && (
                <a href={urls[o.id]} target="_blank" className="mt-4 block overflow-hidden rounded-sheet ring-1 ring-line">
                  {o.receipt_path.endsWith('.pdf') ? (
                    <div className="p-4 text-center font-semibold text-brand-blue">📄 {t.view_receipt} (PDF)</div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[o.id]} alt={t.view_receipt} className="max-h-72 w-full bg-slate-100 object-contain" />
                  )}
                </a>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <form action={approveOrder} className="flex-1">
                  <input type="hidden" name="id" value={o.id} />
                  <SubmitButton className="btn w-full bg-green-600 text-white hover:bg-green-700">✓ {t.approve}</SubmitButton>
                </form>
                <form action={rejectOrder} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <input name="note" placeholder={t.reject_reason} className="input py-2 text-sm" />
                  <SubmitButton className="btn-ghost text-red-600">{t.reject}</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {(devReqs ?? []).length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-xl font-bold text-ink">💻 {t.dev_title} ({devReqs!.length})</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {devReqs!.map((r: any) => (
              <div key={r.id} className="card p-5">
                <div className="font-bold text-ink">{r.profiles?.full_name} <span className="text-sm font-normal text-ink-mute" dir="ltr">· {r.profiles?.phone}</span></div>
                <div className="mt-1 text-sm text-ink-soft">{L(r.orders?.courses, 'title', locale)} · {t.dev_changes}: {r.orders?.device_changes ?? 0}</div>
                <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-ink-mute">{t.dev_old}</dt><dd className="break-all font-mono" dir="ltr">{r.old_machine}</dd>
                  <dt className="text-ink-mute">{t.dev_new}</dt><dd className="break-all font-mono font-bold" dir="ltr">{r.new_machine}</dd>
                  {r.reason && (<><dt className="text-ink-mute">{t.note}</dt><dd dir="auto">{r.reason}</dd></>)}
                </dl>
                <div className="mt-4 flex gap-2">
                  <form action={approveDevice} className="flex-1"><input type="hidden" name="id" value={r.id} /><SubmitButton className="btn w-full bg-green-600 text-white hover:bg-green-700">✓ {t.dev_approve}</SubmitButton></form>
                  <form action={rejectDevice}><input type="hidden" name="id" value={r.id} /><SubmitButton className="btn-ghost text-red-600">{t.reject}</SubmitButton></form>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 mb-4 text-xl font-bold text-ink">{t.recent_orders}</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-paper text-start text-ink-mute">
            <tr>
              {[t.student, t.course, t.method, t.status, t.activation_code, t.date].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(recent ?? []).map((o: any) => (
              <tr key={o.id}>
                <td className="px-4 py-3">{o.profiles?.full_name}<div className="text-xs text-ink-mute" dir="ltr">{o.profiles?.phone}</div></td>
                <td className="px-4 py-3">{L(o.courses, 'title', locale)}</td>
                <td className="px-4 py-3">{methodName(o.method)} · {o.amount}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${o.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {o.status === 'approved' ? t.status_approved : t.status_rejected}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">{o.activation_code || '—'}</td>
                <td className="px-4 py-3 text-xs text-ink-mute">{o.reviewed_at ? fmt(o.reviewed_at) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
