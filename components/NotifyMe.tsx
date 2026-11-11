'use client';
import { useState } from 'react';
import { SUPABASE_READY } from '@/lib/supabase/env';

const MESSENGER = process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/MEPLAB.EGY';

const T = {
  ar: { ph: 'إيميلك', b: 'بلّغني لما ينزل', busy: '...', ok: 'تمام! هنبعتلك إيميل أول ما الكورس ينزل.', bad: 'اكتب إيميل صحيح.', err: 'حصلت مشكلة، جرّب تاني.' },
  en: { ph: 'Your email', b: 'Notify me', busy: '...', ok: "Done! We'll email you the day it launches.", bad: 'Enter a valid email.', err: 'Something went wrong, try again.' }
};

/** "Notify me when it launches" for a coming-soon course */
export default function NotifyMe({ slug, locale, email: initial = '', className = '', inputClass = 'input', buttonClass = 'btn-red' }:
  { slug: string; locale: 'ar' | 'en'; email?: string; className?: string; inputClass?: string; buttonClass?: string }) {
  const t = T[locale];
  const [email, setEmail] = useState(initial);
  const [st, setSt] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setSt('err'); setMsg(t.bad); return; }
    setSt('busy');
    try {
      if ((window as any).__AUTH_MOCK__) { await new Promise((r) => setTimeout(r, 400)); setSt('ok'); return; }
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, email: email.trim() }) });
      if (!r.ok) throw new Error();
      setSt('ok');
    } catch { setSt('err'); setMsg(t.err); }
  }
  if (!SUPABASE_READY && !(typeof window !== 'undefined' && (window as any).__AUTH_MOCK__)) {
    // no database yet: ask on Messenger instead of a form that can't save
    return (
      <a href={MESSENGER} target="_blank" rel="noopener" className={`${buttonClass} ${className}`}>
        {locale === 'ar' ? 'ابعتلنا على ماسنجر ونبلّغك أول ما ينزل' : 'Message us and we will tell you when it launches'}
      </a>
    );
  }
  if (st === 'ok') return <p className={`text-sm font-semibold text-sys-plumb ${className}`} role="status">{t.ok}</p>;
  return (
    <form onSubmit={go} className={className} noValidate>
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.ph} aria-label={t.ph} className={`${inputClass} min-w-0 flex-1`} dir="ltr" />
        <button disabled={st === 'busy'} className={`${buttonClass} shrink-0`}>{st === 'busy' ? t.busy : t.b}</button>
      </div>
      {st === 'err' && <p role="alert" className="mt-2 text-sm text-red-600">{msg}</p>}
    </form>
  );
}
