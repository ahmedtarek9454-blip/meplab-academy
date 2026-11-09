import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import DraftSync from '@/components/DraftSync';
import Footer from '@/components/Footer';
import { getLocale } from '@/lib/i18n';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'MEP LAB — كورسات HVAC و MEP | فحص CV | وظايف', template: '%s' },
  description: 'كورسات عملية في تصميم التكييف والحريق و Revit MEP، فحص الـ CV بنظام ATS مجانًا، ووظايف MEP في مصر والسعودية والإمارات. Practical HVAC & MEP courses, free ATS CV check and MEP jobs.',
  keywords: ['HVAC course', 'MEP course', 'Revit MEP', 'كورس تكييف', 'تصميم تكييف', 'ATS CV checker', 'MEP jobs', 'وظائف مهندس ميكانيكا', 'BIM'],
  openGraph: {
    type: 'website',
    siteName: 'MEP LAB',
    title: 'MEP LAB — HVAC & MEP Courses, CV Check, Jobs',
    description: 'كورسات عملية في التكييف و MEP، فحص CV مجاني بنظام ATS، ووظايف MEP.',
    locale: 'ar_EG',
    alternateLocale: ['en_US']
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg' }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <DraftSync />
      </body>
    </html>
  );
}
