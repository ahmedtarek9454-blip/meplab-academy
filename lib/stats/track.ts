/** fire-and-forget usage counter (no personal data) */
export function track(type: string) {
  try {
    if (typeof window === 'undefined' || (window as any).__AUTH_MOCK__) return;
    if (type === 'visit') { if (sessionStorage.getItem('ml_v')) return; sessionStorage.setItem('ml_v', '1'); }
    const body = JSON.stringify({ type });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/ats/event', new Blob([body], { type: 'application/json' }));
    else fetch('/api/ats/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {}
}
