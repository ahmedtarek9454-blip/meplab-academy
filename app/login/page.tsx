import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const notice = sp.next?.startsWith('/cv-check') ? 'اعمل حساب مجاني عشان تطابق الـ CV على وظايف أكتر. الـ CV والإعلان هيرجعوا زي ما هم بعد ما تخلّص.' : undefined;
  return <AuthForm mode="login" sp={{ ...sp, notice }} />;
}
