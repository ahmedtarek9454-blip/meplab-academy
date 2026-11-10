import Link from 'next/link';
import Logo from './Logo';
import { JOBS_ENABLED } from '@/lib/features';

import { getT } from '@/lib/i18n';

export default async function Footer() {
  const { t } = await getT();
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const fb = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/MEPLAB.EGY';
  const links = [
    ['/courses', t.nav_courses], ['/cv-check', t.nav_cv], ...(JOBS_ENABLED ? [['/jobs', t.nav_jobs]] : []),
    ['/download', t.nav_download], ['/tools', t.nav_tools], ['/#about', t.about_tag], ['/profile', t.nav_profile]
  ];
  return (
    <footer className="border-t-4 border-brand-amber bg-ink text-slate-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr,1fr,1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">{t.brand_tag}</p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">{t.quick_links}</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {links.map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold text-white">{t.contact}</h4>
          <ul className="space-y-2.5 text-sm">
            {wa && <li><a className="hover:text-white" href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp</a></li>}
            <li><a className="hover:text-white" href={fb} target="_blank" rel="noopener">Facebook — MEPLAB.EGY</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-5 text-xs text-ink-mute">© {new Date().getFullYear()} MEP LAB. {t.footer_rights}</div>
      </div>
    </footer>
  );
}
