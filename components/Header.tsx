import Link from 'next/link';
import Logo from './Logo';
import { getT } from '@/lib/i18n';
import { getSession } from '@/lib/auth';
import { signOut } from '@/app/login/actions';
import { SUPABASE_READY } from '@/lib/supabase/env';
import { JOBS_ENABLED } from '@/lib/features';

export default async function Header() {
  const { t, locale } = await getT();
  const { user, isAdmin } = await getSession();

  const links: { href: string; label: string; cls?: string }[] = [
    { href: '/courses', label: t.nav_courses },
    { href: '/cv-check', label: t.nav_cv },
    { href: '/cv-builder', label: locale === 'ar' ? 'اعمل CV' : 'Build a CV' },
    ...(JOBS_ENABLED ? [{ href: '/jobs', label: t.nav_jobs }] : []),
    ...(SUPABASE_READY ? [{ href: '/download', label: t.nav_download }, { href: '/tools', label: t.nav_tools }] : []),
    { href: '/#about', label: t.about_tag },
    ...(user ? [{ href: '/profile', label: t.nav_profile }] : []),
    ...(isAdmin ? [{ href: '/admin', label: t.nav_admin, cls: 'text-brand-amber' }] : [])
  ];

  return (
    <header className="sticky top-0 z-30 border-b-[1.5px] border-ink bg-white text-ink">
      <div className="container-x flex h-[68px] items-center justify-between gap-3 sm:gap-6">
        <Link href="/" aria-label="MEP LAB"><Logo /></Link>

        <nav className="hidden flex-1 items-center gap-1 text-[15px] font-medium text-ink-soft lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-[3px] px-3 py-2 transition-colors hover:bg-paper hover:text-ink ${l.cls || ''}`}>{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <a href={`/lang?to=${locale === 'ar' ? 'en' : 'ar'}`} className="rounded px-2 py-2.5 text-sm font-bold text-ink-soft hover:bg-paper hover:text-ink" aria-label={t.lang_switch}><span className="min-[360px]:hidden">{locale === 'ar' ? 'EN' : 'ع'}</span><span className="hidden min-[360px]:inline">{t.lang_switch}</span></a>
          {user ? (
            <form action={signOut}><button className="btn-outline-white btn-sm">{t.nav_logout}</button></form>
          ) : (
            SUPABASE_READY ? (
              <>
                <Link href="/login" className="btn-outline-white btn-sm hidden sm:inline-flex">{t.nav_login}</Link>
                <Link href="/signup" className="btn-red btn-sm">{t.nav_signup}</Link>
              </>
            ) : (
              <Link href="/cv-check" className="btn-red btn-sm whitespace-nowrap">{locale === 'ar' ? <>افحص الـ CV<span className="hidden min-[380px]:inline"> ببلاش</span></> : <>Check your CV<span className="hidden min-[380px]:inline"> free</span></>}</Link>
            )
          )}
        </div>
      </div>

      <nav className="container-x flex gap-1 overflow-x-auto border-t border-line py-1 text-sm font-medium text-ink-soft [scrollbar-width:none] lg:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`shrink-0 rounded-[3px] px-3 py-2.5 hover:bg-paper ${l.cls || ''}`}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}
