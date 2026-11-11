/** The exact wording the visitor agreed to, stored with each opt-in as proof of consent. */
export const CONSENT_TEXT = {
  ar: 'موافق إن MEP LAB تبعتلي نصايح للـ CV ووظايف وكورسات في تخصصي على الإيميل أو الواتساب، وأقدر ألغي في أي وقت.',
  en: 'I agree that MEP LAB may send me CV tips, jobs and courses in my field by email or WhatsApp. I can unsubscribe at any time.'
};

export const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
/** Keep digits and a leading +; Egyptian 01xxxxxxxxx becomes +201xxxxxxxxx. */
export function normPhone(raw: unknown) {
  let p = String(raw ?? '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^\d+]/g, '');
  if (!p) return null;
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (/^01\d{9}$/.test(p)) p = '+2' + p;
  if (!p.startsWith('+')) p = '+' + p;
  return /^\+\d{8,15}$/.test(p) ? p : 'bad';
}

