/** MEP LAB WhatsApp (international format, no +). The host setting NEXT_PUBLIC_WHATSAPP overrides it. Hamada, Nov 22 2026: 01141683954 */
export const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || '201141683954').replace(/\D/g, '');
