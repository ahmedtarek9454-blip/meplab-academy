import { getLocale } from '@/lib/i18n';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إلغاء الاشتراك — MEP LAB', robots: { index: false } };

/** One click from any email: stops all messages to that address (every row with the same email). */
async function unsubscribe(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  try {
    const db = createAdminClient();
    const { data } = await db.from('leads').select('email').eq('unsub_token', token).maybeSingle();
    if (!data?.email) return false;
    await db.from('leads').update({ unsubscribed_at: new Date().toISOString() }).eq('email', data.email).is('unsubscribed_at', null);
    return true;
  } catch {
    return false;
  }
}

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = '' } = await searchParams;
  const ar = (await getLocale()) === 'ar';
  const ok = await unsubscribe(t);
  return (
    <section className="container-x max-w-xl py-20 text-center">
      <h1 className="display text-3xl text-ink">{ok ? (ar ? 'تم إلغاء الاشتراك' : "You're unsubscribed") : (ar ? 'اللينك ده مش شغال' : 'This link is not valid')}</h1>
      <p className="mt-4 text-lg leading-8 text-ink-mute">
        {ok
          ? (ar ? 'مش هيوصلك مننا أي رسايل تاني على الإيميل ده. لو غيّرت رأيك، تقدر توافق تاني بعد ما تفحص الـ CV.' : "We won't email this address again. If you change your mind, opt in again after a CV check.")
          : (ar ? 'جرّب اللينك اللي في آخر الإيميل تاني، أو ابعتلنا على صفحة الفيسبوك وهنشيلك يدويًا.' : 'Try the link at the bottom of the email again, or message our Facebook page and we will remove you manually.')}
      </p>
    </section>
  );
}
