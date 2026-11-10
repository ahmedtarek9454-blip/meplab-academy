import Link from 'next/link';
import Logo from './Logo';
import { getT } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { signOut } from '@/app/login/actions';
import { JOBS_ENABLED } from '@/lib/features';

export default async function Header() {
  const { t, locale } = await getT();
  const { user, isAdmin } = await getSession();

  const links: { href: string; label: string; cls?: string }[] = [
    { href: '/courses', label: t.nav_courses },
    { href: '/cv-check', label: t.nav_cv },
    ...(JOBS_ENABLED ? [{ href: '/jobs', label: t.nav_jobs }] : []),
    { href: '/download', label: t.nav_download },
    { href: '/tools', label: t.nav_tools },
    { href: '/#about', label: t.about_tag },
    ...(user ? [{ href: '/profile', label: t.nav_profile }] : []),
    ...(isAdmin ? [{ href: '/admin', label: t.nav_admin, cls: 'text-brand-amber' }] : [])
  ];

  return (
    <header className="sticky top-0 z-30 bg-ink text-white">
      <div className="container-x flex h-[68px] items-center justify-between gap-6">
        <Link href="/" aria-label="MEP LAB"><Logo light /></Link>

        <nav className="hidden flex-1 items-center gap-1 text-[15px] font-medium text-slate-300 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded px-3 py-2 transition-colors hover:bg-white/10 hover:text-white ${l.cls || ''}`}>{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={`/lang?to=${locale === 'ar' ? 'en' : 'ar'}`} className="rounded px-2.5 py-1.5 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white">{t.lang_switch}</a>
          {user ? (
            <form action={signOut}><button className="btn-outline-white btn-sm">{t.nav_logout}</button></form>
          ) : (
            <>
              <Link href="/login" className="btn-outline-white btn-sm hidden sm:inline-flex">{t.nav_login}</Link>
              <Link href="/signup" className="btn-red btn-sm">{t.nav_signup}</Link>
            </>
          )}
        </div>
      </div>

      <nav className="container-x flex gap-1 overflow-x-auto border-t border-white/10 py-1.5 text-sm font-medium text-slate-300 [scrollbar-width:none] lg:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`shrink-0 rounded px-3 py-1.5 hover:bg-white/10 ${l.cls || ''}`}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}
