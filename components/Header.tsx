import Link from 'next/link';
import Logo from './Logo';
import { getT } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { signOut } from '@/app/login/actions';

export default async function Header() {
  const { t, locale } = await getT();
  const { user, isAdmin } = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/"><Logo /></Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/courses" className="hover:text-brand-blue">{t.nav_courses}</Link>
          <Link href="/jobs" className="hover:text-brand-blue">{t.nav_jobs}</Link>
          <Link href="/tools" className="hover:text-brand-blue">{t.nav_tools}</Link>
          <Link href="/download" className="hover:text-brand-blue">{t.nav_download}</Link>
          <Link href="/#about" className="hover:text-brand-blue">{t.about_tag}</Link>
          <Link href="/cv-check" className="flex items-center gap-1.5 hover:text-brand-blue">{t.nav_cv}<span className="badge bg-green-100 text-[10px] text-green-700">{t.new_badge}</span></Link>
          {user && <Link href="/dashboard" className="hover:text-brand-blue">{t.nav_dashboard}</Link>}
          {user && <Link href="/profile" className="hover:text-brand-blue">{t.nav_profile}</Link>}
          {isAdmin && <Link href="/admin" className="text-brand-red hover:text-red-700">{t.nav_admin}</Link>}
        </nav>

        <div className="flex items-center gap-2">
          <a href={`/lang?to=${locale === 'ar' ? 'en' : 'ar'}`} className="btn-ghost btn-sm">{t.lang_switch}</a>
          {user ? (
            <form action={signOut}>
              <button className="btn-ghost btn-sm">{t.nav_logout}</button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">{t.nav_login}</Link>
              <Link href="/signup" className="btn-red btn-sm">{t.nav_signup}</Link>
            </>
          )}
        </div>
      </div>
      {/* mobile nav */}
      <nav className="container-x flex gap-5 overflow-x-auto pb-2 text-sm font-semibold text-slate-600 md:hidden">
        <Link href="/courses">{t.nav_courses}</Link>
        <Link href="/jobs">{t.nav_jobs}</Link>
        <Link href="/tools">{t.nav_tools}</Link>
        <Link href="/download">{t.nav_download}</Link>
        <Link href="/cv-check" className="text-green-700">{t.nav_cv}</Link>
        {user && <Link href="/dashboard">{t.nav_dashboard}</Link>}
        {user && <Link href="/profile">{t.nav_profile}</Link>}
        {isAdmin && <Link href="/admin" className="text-brand-red">{t.nav_admin}</Link>}
      </nav>
    </header>
  );
}
