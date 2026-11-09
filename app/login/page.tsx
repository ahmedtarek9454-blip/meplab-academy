import AuthGate from '@/components/AuthGate';
import { getT } from '@/lib/i18n';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams; const { t, locale } = await getT();
  return <AuthGate mode="login" next={sp.next || '/dashboard'} locale={locale} notice={sp.next && sp.next !== '/dashboard' ? t.members_only : undefined} />;
}
