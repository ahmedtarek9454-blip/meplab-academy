import Link from 'next/link';
import { confirmRecovery } from '@/app/login/actions';
import SubmitButton from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تغيير الباسورد', robots: { index: false } };

/**
 * Landing page of the reset link. The token is only used when the visitor presses the button,
 * so link previews (WhatsApp, mail scanners) that open the URL do not burn the one-time link.
 */
export default async function Confirm({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const ok = !!sp.token_hash && sp.type === 'recovery' && !sp.error;
  return (
    <section className="container-x flex justify-center py-14" dir="rtl">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold text-ink">تغيير الباسورد</h1>
        {ok ? (
          <form action={confirmRecovery} className="mt-5 space-y-4">
            <input type="hidden" name="token_hash" value={sp.token_hash} />
            <p className="text-sm leading-7 text-ink-mute">دوس الزرار وهتكتب الباسورد الجديد في الصفحة اللي بعدها.</p>
            <SubmitButton className="btn-red w-full">كمّل واكتب باسورد جديد</SubmitButton>
          </form>
        ) : (
          <>
            <p className="mt-4 rounded-sheet bg-red-50 p-3 text-sm leading-7 text-red-700">اللينك ده انتهى أو اتستخدم قبل كده. اطلب لينك جديد.</p>
            <Link href="/reset" className="btn-red mt-5 w-full">اطلب لينك جديد</Link>
          </>
        )}
      </div>
    </section>
  );
}
