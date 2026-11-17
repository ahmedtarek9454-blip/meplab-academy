/**
 * Every member goes to Hamada's Google Sheet (name, e-mail, WhatsApp, where they signed up, course).
 * The sheet runs a tiny Apps Script web app (tools/google-sheet/members.gs); its URL and a shared secret
 * are set in Netlify as SHEET_WEBHOOK_URL / SHEET_WEBHOOK_SECRET. No URL → nothing is sent, nothing breaks.
 */
export type SheetRow = { event: 'signup' | 'profile' | 'course'; name?: string | null; email: string; whatsapp?: string | null; source?: string; course?: string | null; job_title?: string | null };

export async function toSheet(row: SheetRow) {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return;
  try {
    await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, redirect: 'follow', signal: AbortSignal.timeout(6000),
      body: JSON.stringify({ ...row, secret: process.env.SHEET_WEBHOOK_SECRET || '', at: new Date().toISOString() })
    });
  } catch {}
}

/** WhatsApp number as digits with country code: "01001234567" → "+201001234567" */
export function normWhatsapp(v: string): string | null {
  let d = v.replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (/^01[0125]\d{8}$/.test(d)) d = '+2' + d;            // Egyptian mobile
  if (/^05\d{8}$/.test(d)) d = '+966' + d.slice(1);         // Saudi mobile
  if (!d.startsWith('+')) d = '+' + d;
  return /^\+\d{10,15}$/.test(d) ? d : null;
}
