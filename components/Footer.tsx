import Link from 'next/link';
import Logo from './Logo';
import { JOBS_ENABLED } from '@/lib/features';
import { SUPABASE_READY } from '@/lib/supabase/env';

import { getT } from '@/lib/i18n';

export default async function Footer() {
  const { t } = await getT();
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const fb = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/MEPLAB.EGY';
  const links = [
    ['/courses', t.nav_courses], ['/cv-check', t.nav_cv], ['/cv-builder', t.nav_courses === 'Courses' ? 'Build a CV' : 'اعمل CV'],
    ...(JOBS_ENABLED && SUPABASE_READY ? [['/jobs', t.nav_jobs]] : []),
    ...(SUPABASE_READY ? [['/download', t.nav_download], ['/tools', t.nav_tools], ['/profile', t.nav_profile]] : []), ['/#about', t.about_tag]
  ];
  return (
    <footer className="border-t-[1.5px] border-ink bg-white text-ink-soft">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr,1fr,1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-soft">{t.brand_tag}</p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold text-ink">{t.quick_links}</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {links.map(([h, l]) => <li key={h}><Link href={h} className="inline-block py-2 hover:text-ink hover:underline">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-bold text-ink">{t.contact}</h4>
          <ul className="space-y-1 text-sm">
            {wa && <li><a className="inline-block py-2 hover:text-ink hover:underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp</a></li>}
            <li><a className="inline-block py-2 hover:text-ink hover:underline" href={fb} target="_blank" rel="noopener">Facebook — MEPLAB.EGY</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x py-5 text-xs text-ink-mute">© {new Date().getFullYear()} MEP LAB. {t.footer_rights}</div>
      </div>
    </footer>
  );
}
