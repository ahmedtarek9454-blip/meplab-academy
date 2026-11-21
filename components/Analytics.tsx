import Script from 'next/script';

/**
 * Meta Pixel + Google Analytics 4. Nothing loads until the IDs are set on the host:
 *   NEXT_PUBLIC_META_PIXEL_ID  (Events Manager → Data sources → your pixel)
 *   NEXT_PUBLIC_GA_ID          (GA4 → Admin → Data streams → Measurement ID, G-XXXXXXX)
 * Our own events (sign-up, WhatsApp click, course view, CV check…) are forwarded by lib/stats/track.ts.
 */
const PIXEL = (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').replace(/\D/g, '');
const GA = (process.env.NEXT_PUBLIC_GA_ID || '').replace(/[^A-Z0-9-]/gi, '');

export default function Analytics() {
  return (
    <>
      {PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL}');fbq('track','PageView');`}</Script>
      )}
      {GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}');`}</Script>
        </>
      )}
    </>
  );
}
