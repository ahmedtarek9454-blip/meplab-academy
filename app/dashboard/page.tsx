import Link from 'next/link';
import { getT, L } from '@/lib/i18n';
import { requireUser } from '@/lib/auth';
import CopyButton from '@/components/CopyButton';

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireUser('/dashboard');
  const { t, locale } = await getT();
  const { data } = await supabase
    .from('orders')
    .select('*, courses(slug, title_ar, title_en, download_url)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });
  const orders = data ?? [];
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;

  const badge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-700'
  };
  const label: Record<string, string> = { pending: t.status_pending, approved: t.status_approved, rejected: t.status_rejected };

  return (
    <section className="container-x max-w-4xl py-12">
      <h1 className="text-2xl font-extrabold text-ink">{t.welcome}{locale === 'ar' ? '،' : ','} {profile?.full_name || user!.email} 👋</h1>
      {sp.sent && <p className="mt-4 rounded-sheet bg-green-50 p-4 text-green-800">{t.order_sent}</p>}

      <h2 className="mt-8 mb-4 text-xl font-bold text-ink">{t.my_orders}</h2>
      {orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-ink-soft">{t.no_orders}</p>
          <Link href="/courses" className="btn-red mt-4">{t.hero_cta_courses}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-ink">{L(o.courses, 'title', locale)}</h3>
                <span className={`badge ${badge[o.status]}`}>{label[o.status]}</span>
              </div>
              <div className="mt-2 text-xs text-ink-mute" dir="ltr">
                {new Date(o.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB')} · {t.for_device}: <span className="font-mono">{o.machine_code}</span>
              </div>

              {o.status === 'approved' && o.activation_code && (
                <div className="mt-4 rounded-sheet bg-blue-50 p-4">
                  <div className="text-sm font-semibold text-ink-soft">{t.activation_code}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <code dir="ltr" className="select-all break-all rounded-lg bg-white px-3 py-2 font-mono text-lg font-bold tracking-wider text-ink">{o.activation_code}</code>
                    <CopyButton text={o.activation_code} label={t.copy} done={t.copied} />
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{t.how_activate}</p>
                  {o.courses?.download_url && (
                    <a href={o.courses.download_url} target="_blank" rel="noopener" className="btn-blue btn-sm mt-3"> {t.dl_course}</a>
                  )}
                  {o.expires_at && <p className="mt-1 text-xs text-ink-mute">{t.expires}: {o.expires_at}</p>}
                </div>
              )}
              {o.status === 'rejected' && o.admin_note && (
                <p className="mt-3 rounded-sheet bg-red-50 p-3 text-sm text-red-700">{t.note}: {o.admin_note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {orders.some((o: any) => o.status === 'approved') && <p className="mt-6 rounded-sheet bg-slate-100 p-4 text-sm text-ink-soft">💻 {t.dev_hint}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/profile" className="btn-ghost"> {t.nav_profile}</Link>
        <Link href="/download" className="btn-blue">{t.nav_download}</Link>
        {wa && <a href={`https://wa.me/${wa}`} target="_blank" className="btn bg-green-600 text-white hover:bg-green-700">{t.need_help}</a>}
      </div>
    </section>
  );
}
