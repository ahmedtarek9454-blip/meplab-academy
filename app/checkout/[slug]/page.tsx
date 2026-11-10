import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getT, L } from '@/lib/i18n';
import { requireUser } from '@/lib/auth';
import CopyButton from '@/components/CopyButton';
import SubmitButton from '@/components/SubmitButton';
import { submitOrder } from './actions';

export default async function Checkout({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase } = await requireUser(`/checkout/${slug}`);
  const { t, locale } = await getT();
  const { data: c } = await supabase.from('courses').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  if (!c) notFound();
  if (c.status === 'soon') redirect(`/courses/${slug}`);

  const insta = process.env.NEXT_PUBLIC_INSTAPAY_HANDLE || '—';
  const voda = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER || '—';

  return (
    <section className="container-x max-w-3xl py-12">
      <h1 className="text-2xl font-extrabold text-ink">{t.checkout_title} <span className="text-brand-blue">{L(c, 'title', locale)}</span></h1>
      {sp.error && <p className="mt-4 rounded-sheet bg-red-50 p-3 text-sm text-red-700">{t.form_error}</p>}

      <form action={submitOrder} className="mt-6 space-y-6">
        <input type="hidden" name="slug" value={slug} />

        {/* 1. pay */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-ink">{t.step_pay}</h2>
          <div className="mb-4 rounded-sheet bg-red-50 p-4 text-center">
            <div className="text-sm text-ink-soft">{t.amount}</div>
            <div className="text-3xl font-bold text-brand-red">{c.price_egp} {t.egp}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { v: 'instapay', name: t.instapay, to: insta, color: 'border-purple-300 has-[:checked]:bg-purple-50 has-[:checked]:border-purple-600' },
              { v: 'vodafone_cash', name: t.vodafone_cash, to: voda, color: 'border-red-300 has-[:checked]:bg-red-50 has-[:checked]:border-red-600' }
            ].map((m, i) => (
              <label key={m.v} className={`flex cursor-pointer flex-col gap-2 rounded-sheet border-2 p-4 ${m.color}`}>
                <span className="flex items-center gap-2 font-bold">
                  <input type="radio" name="method" value={m.v} defaultChecked={i === 0} required /> {m.name}
                </span>
                <span className="text-xs text-ink-mute">{t.send_to}</span>
                <span className="flex items-center justify-between gap-2">
                  <b dir="ltr" className="text-lg">{m.to}</b>
                  <CopyButton text={m.to} label={t.copy} done={t.copied} />
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. receipt */}
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-bold text-ink">{t.step_upload}</h2>
          <div><label className="label">{t.sender_ref}</label><input name="sender_ref" required className="input" dir="ltr" /></div>
          <div>
            <label className="label">{t.receipt}</label>
            <input name="receipt" type="file" required accept="image/png,image/jpeg,image/webp,application/pdf"
              className="input file:me-3 file:rounded-lg file:border-0 file:bg-brand-blue file:px-3 file:py-1.5 file:text-white" />
          </div>
        </div>

        {/* 3. machine code */}
        <div className="card space-y-3 p-6">
          <h2 className="text-lg font-bold text-ink">{t.step_machine}</h2>
          <p className="text-sm text-ink-soft">{t.machine_code_hint}</p>
          <input name="machine_code" required minLength={6} className="input font-mono uppercase tracking-wider" dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX" />
          <Link href="/download" target="_blank" className="text-sm font-semibold text-brand-blue">⬇ {t.download_player_first}</Link>
        </div>

        <SubmitButton className="btn-red w-full py-3 text-lg">{t.submit_order}</SubmitButton>
      </form>
    </section>
  );
}
