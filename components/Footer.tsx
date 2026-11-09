import Link from 'next/link';
import Logo from './Logo';
import { getT } from '@/lib/i18n';

export default async function Footer() {
  const { t } = await getT();
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const fb = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/MEPLAB.EGY';
  return (
    <footer className="mt-20 bg-brand-navy text-slate-300">
      <div className="container-x grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm leading-7">{t.brand_tag}</p>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">{t.quick_links}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/courses" className="hover:text-white">{t.nav_courses}</Link></li>
            <li><Link href="/download" className="hover:text-white">{t.nav_download}</Link></li>
            <li><Link href="/cv-check" className="hover:text-white">{t.nav_cv}</Link></li>
            <li><Link href="/jobs" className="hover:text-white">{t.nav_jobs}</Link></li>
            <li><Link href="/tools" className="hover:text-white">{t.nav_tools}</Link></li>
            <li><Link href="/#about" className="hover:text-white">{t.about_tag}</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">{t.nav_dashboard}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-bold text-white">{t.contact}</h4>
          <div className="flex flex-wrap gap-3">
            {wa && (
              <a className="btn btn-sm bg-green-600 text-white hover:bg-green-700" href={`https://wa.me/${wa}`} target="_blank">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2z"/></svg>
                WhatsApp
              </a>
            )}
            <a className="btn btn-sm bg-[#1877F2] text-white hover:opacity-90" href={fb} target="_blank">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.7-.6z"/></svg>
              Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">© {new Date().getFullYear()} MEP LAB — {t.footer_rights}</div>
    </footer>
  );
}
