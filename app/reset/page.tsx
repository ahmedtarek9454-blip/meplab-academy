import Link from 'next/link';
import { sendReset } from '@/app/login/actions';
import SubmitButton from '@/components/SubmitButton';
import { WHATSAPP } from '@/lib/whatsapp';

export const metadata = { title: 'نسيت الباسورد', robots: { index: false } };

export default async function Reset({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <section className="container-x flex justify-center py-14" dir="rtl">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold text-ink">نسيت الباسورد</h1>
        {sp.sent ? (
          <>
            <p className="mt-4 rounded-sheet bg-green-50 p-3 text-sm leading-7 text-green-800">لو الإيميل ده عليه حساب، هيوصلك لينك تغيّر بيه الباسورد خلال دقايق. شوف الـ Spam كمان.</p>
            <p className="mt-4 text-sm leading-7 text-ink-mute">موصلش بعد 10 دقايق؟ <a className="font-bold text-brand-blue" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('نسيت باسورد حسابي على MEP LAB، الإيميل بتاعي: ')}`} target="_blank" rel="noopener">ابعتلنا الإيميل بتاعك على واتساب</a> وهنبعتلك لينك تغيير الباسورد هناك.</p>
          </>
        ) : (
          <form action={sendReset} className="mt-5 space-y-4">
            <div><label className="label">الإيميل</label><input name="email" type="email" required className="input" dir="ltr" autoComplete="email" /></div>
            <SubmitButton className="btn-red w-full">ابعتلي لينك تغيير الباسورد</SubmitButton>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link href="/login" className="font-bold text-brand-blue">رجوع للدخول</Link></p>
      </div>
    </section>
  );
}
