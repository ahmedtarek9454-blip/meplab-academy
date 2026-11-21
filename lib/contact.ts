import { WHATSAPP } from '@/lib/whatsapp';
/** Ask before enrolling: WhatsApp (pre-filled with the course name) and Messenger */
export function contactLinks(courseTitle: string, locale: 'ar' | 'en') {
  const wa = WHATSAPP;
  const ms = process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/MEPLAB.EGY';
  const text = locale === 'ar' ? `السلام عليكم، عندي سؤال عن كورس ${courseTitle}` : `Hi, I have a question about the ${courseTitle} course`;
  return { whatsapp: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null, messenger: ms };
}

