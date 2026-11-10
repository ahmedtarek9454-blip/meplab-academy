import Link from 'next/link';
import Logo from './Logo';
import { JOBS_ENABLED } from '@/lib/features';

import { getT } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { signOut } from '@/app/login/actions';

export default async function Header() {
  const { t, locale } = await getT();
  const { user, isAdmin } = await getSession();

  const links: { href: string; label: string; cls?: string }[] = [
    { href: '/courses', label: t.nav_courses },
    { href: '/cv-check', label: t.nav_cv },
    ...(JOBS_ENABLED ? [{ href: '/jobs', label: t.nav_jobs }] : []),
    { href: '/download', label: t.nav_download },
    { href: '/tools', label: t.nav_tools },
    ...(user ? [{ href: '/profile', label: t.nav_profile }] : []),
    ...(isAdmin ? [{ href: '/admin', label: t.nav_admin, cls: 'text-brand-red' }] : [])
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="MEP LAB"><Logo /></Link>

        <nav className="hidden flex-1 items-center gap-1 text-[15px] font-medium text-ink-soft lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`relative rounded-sheet px-3 py-2 transition-colors hover:bg-paper hover:text-ink ${l.cls || ''}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={`/lang?to=${locale === 'ar' ? 'en' : 'ar'}`} className="rounded-sheet px-2.5 py-1.5 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink">{t.lang_switch}</a>
          {user ? (
            <form action={signOut}><button className="btn-ghost btn-sm">{t.nav_logout}</button></form>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">{t.nav_login}</Link>
              <Link href="/signup" className="btn-red btn-sm">{t.nav_signup}</Link>
            </>
          )}
        </div>
      </div>

      {/* mobile: scrollable tab row */}
      <nav className="container-x flex gap-1 overflow-x-auto border-t border-line py-1.5 text-sm font-medium text-ink-soft [scrollbar-width:none] lg:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`shrink-0 rounded-sheet px-3 py-1.5 hover:bg-paper ${l.cls || ''}`}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}
