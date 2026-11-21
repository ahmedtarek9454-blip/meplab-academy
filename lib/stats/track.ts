/** Meta Pixel / Google Analytics names for our own events (only fired when those tags are installed) */
const PIXEL: Record<string, string> = {
  signup: 'CompleteRegistration',
  contact_wa: 'Contact',
  contact_ms: 'Contact',
  notify: 'Lead',
  course_view: 'ViewContent'
};

/** send one of our events to the ad/analytics tags, if the site has them */
export function adTrack(type: string, params: Record<string, any> = {}) {
  try {
    const w = window as any;
    if (typeof w.fbq === 'function') {
      if (PIXEL[type]) w.fbq('track', PIXEL[type], params);
      else w.fbq('trackCustom', type, params);
    }
    if (typeof w.gtag === 'function') w.gtag('event', type, params);
  } catch {}
}

/** fire-and-forget usage counter (no personal data) */
export function track(type: string, params?: Record<string, any>) {
  try {
    if (typeof window === 'undefined' || (window as any).__AUTH_MOCK__) return;
    if (type === 'visit') { if (sessionStorage.getItem('ml_v')) return; sessionStorage.setItem('ml_v', '1'); }
    if (type !== 'visit') adTrack(type, params);
    const body = JSON.stringify({ type });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/ats/event', new Blob([body], { type: 'application/json' }));
    else fetch('/api/ats/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {}
}
