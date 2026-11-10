/** Ask before enrolling: WhatsApp (pre-filled with the course name) and Messenger */
export function contactLinks(courseTitle: string, locale: 'ar' | 'en') {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const ms = process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/MEPLAB.EGY';
  const text = locale === 'ar' ? `السلام عليكم، عندي سؤال عن كورس ${courseTitle}` : `Hi, I have a question about the ${courseTitle} course`;
  return { whatsapp: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null, messenger: ms };
}

const WA = 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2z';
const MS = 'M12 2C6.4 2 2 6.1 2 11.4c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.6 0 10-4.1 10-9.4S17.6 2 12 2zm1 12.6-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8z';

export default function ContactButtons({ courseTitle, locale, className = '', btnClass = 'btn-ghost' }: { courseTitle: string; locale: 'ar' | 'en'; className?: string; btnClass?: string }) {
  const l = contactLinks(courseTitle, locale);
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {l.whatsapp && (
        <a href={l.whatsapp} target="_blank" rel="noopener" className={btnClass}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]" aria-hidden><path d={WA} /></svg>{locale === 'ar' ? 'اسألنا على واتساب' : 'Ask on WhatsApp'}
        </a>
      )}
      <a href={l.messenger} target="_blank" rel="noopener" className={btnClass}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#0866FF]" aria-hidden><path d={MS} /></svg>{locale === 'ar' ? 'ابعتلنا على ماسنجر' : 'Message us on Messenger'}
      </a>
    </div>
  );
}
