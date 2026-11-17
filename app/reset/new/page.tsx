import { setNewPassword } from '@/app/login/actions';
import { requireUser } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'باسورد جديد', robots: { index: false } };

export default async function NewPassword({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireUser('/reset');
  return (
    <section className="container-x flex justify-center py-14" dir="rtl">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold text-ink">اكتب باسورد جديد</h1>
        {sp.error && <p className="mt-4 rounded-sheet bg-red-50 p-3 text-sm text-red-700">{sp.error === 'weak' ? 'الباسورد لازم 8 حروف أو أرقام على الأقل.' : 'اللينك انتهى. اطلب لينك جديد.'}</p>}
        <form action={setNewPassword} className="mt-5 space-y-4">
          <div><label className="label">الباسورد الجديد</label><input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" dir="ltr" /></div>
          <SubmitButton className="btn-red w-full">احفظ الباسورد</SubmitButton>
        </form>
      </div>
    </section>
  );
}
