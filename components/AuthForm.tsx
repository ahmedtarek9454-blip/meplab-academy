import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { signIn, signUp, signInWithGoogle } from '@/app/login/actions';
import Logo from './Logo';

export default async function AuthForm({ mode, sp }: { mode: 'login' | 'signup'; sp: Record<string, string | undefined> }) {
  const { t } = await getT();
  const next = sp.next || '/dashboard';
  const isLogin = mode === 'login';
  const q = `?next=${encodeURIComponent(next)}`;

  return (
    <section className="container-x flex justify-center py-14">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="mb-6 text-center text-2xl font-extrabold text-brand-navy">{isLogin ? t.login_title : t.signup_title}</h1>

        {sp.check && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{t.check_email}</p>}
        {sp.error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{t.auth_error}</p>}

        <form action={isLogin ? signIn : signUp} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          {!isLogin && (
            <>
              <div><label className="label">{t.full_name}</label><input name="full_name" required className="input" /></div>
              <div><label className="label">{t.phone}</label><input name="phone" required className="input" dir="ltr" inputMode="tel" /></div>
            </>
          )}
          <div><label className="label">{t.email}</label><input name="email" type="email" required className="input" dir="ltr" /></div>
          <div><label className="label">{t.password}</label><input name="password" type="password" required minLength={6} className="input" dir="ltr" /></div>
          <button className="btn-red w-full">{isLogin ? t.login_btn : t.signup_btn}</button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />{t.or}<span className="h-px flex-1 bg-slate-200" /></div>
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button className="btn-ghost w-full">
            <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            {t.google_btn}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? t.no_account : t.have_account}{' '}
          <Link href={(isLogin ? '/signup' : '/login') + q} className="font-bold text-brand-blue">{isLogin ? t.nav_signup : t.nav_login}</Link>
        </p>
      </div>
    </section>
  );
}
