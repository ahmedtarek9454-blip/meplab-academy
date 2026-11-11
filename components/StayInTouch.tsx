'use client';
import { useEffect, useState } from 'react';
import { CONSENT_TEXT } from '@/lib/leads';

type Props = {
  locale: 'ar' | 'en';
  roleId: string;
  discipline: string | null;
  market: string;
  score: number;
  years: number;
  level: string;
};

const DONE_KEY = 'meplab_optin_v1';

/**
 * Optional, explicit opt-in shown under a guest's result. Nothing is read from the CV:
 * the visitor types the email (and WhatsApp if they want) and ticks the box themselves.
 */
export default function StayInTouch(p: Props) {
  const ar = p.locale === 'ar';
  const [hidden, setHidden] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');

  useEffect(() => {
    let done = false;
    try { done = localStorage.getItem(DONE_KEY) === '1'; } catch {}
    if (done) return;
    // only offer the box when the site can actually store the opt-in
    fetch('/api/leads/optin').then((r) => r.json()).then((j) => setHidden(!j?.enabled)).catch(() => setHidden(true));
  }, []);
  if (hidden && state !== 'done') return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agree) { setErr(ar ? 'علّم على الموافقة الأول.' : 'Tick the consent box first.'); return; }
    setState('sending'); setErr('');
    const website = (new FormData(e.currentTarget).get('website') as string) || '';
    try {
      const r = await fetch('/api/leads/optin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, consent: true, website, locale: p.locale, role_id: p.roleId, discipline: p.discipline, market: p.market, score: p.score, years: p.years, level: p.level })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState('error');
        setErr(j.error === 'email' ? (ar ? 'الإيميل مكتوب غلط.' : 'That email looks wrong.')
          : j.error === 'phone' ? (ar ? 'رقم الواتساب مكتوب غلط. اكتبه زي 01001234567 أو ‎+966…' : 'That WhatsApp number looks wrong. Use the full number with country code.')
          : j.error === 'rate' ? (ar ? 'محاولات كتير. جرّب كمان شوية.' : 'Too many tries. Please try again later.')
          : (ar ? 'حصلت مشكلة. جرّب تاني.' : 'Something went wrong. Please try again.'));
        return;
      }
      setState('done');
      try { localStorage.setItem(DONE_KEY, '1'); } catch {}
    } catch {
      setState('error'); setErr(ar ? 'مفيش اتصال بالنت. جرّب تاني.' : 'No connection. Please try again.');
    }
  }

  if (state === 'done') {
    return (
      <div className="card border-sys-plumb/40 bg-sys-plumb/5 p-6">
        <h3 className="text-lg font-bold text-ink">{ar ? 'تمام، اتسجّلت' : "You're in"}</h3>
        <p className="mt-1 text-ink-soft">{ar ? 'هنبعتلك نصايح للـ CV ووظايف وكورسات في تخصصك. وتقدر تلغي من أي رسالة.' : "We'll send CV tips, jobs and courses in your field. You can unsubscribe from any message."}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6" noValidate>
      <h3 className="text-lg font-bold text-ink">{ar ? 'عايز نصايح ووظايف في تخصصك؟' : 'Want tips and jobs in your field?'}</h3>
      <p className="mt-1 text-ink-soft">{ar ? 'سيب إيميلك وهنبعتلك من وقت للتاني نصايح للـ CV ووظايف وكورسات مناسبة لتخصصك ومستواك.' : "Leave your email and we'll occasionally send CV tips, jobs and courses that fit your field and level."}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink">{ar ? 'الإيميل' : 'Email'}</span>
          <input className="input mt-1" type="email" inputMode="email" autoComplete="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">{ar ? 'رقم واتساب (اختياري)' : 'WhatsApp (optional)'}</span>
          <input className="input mt-1" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01001234567" />
        </label>
      </div>
      {/* honeypot: hidden from people, bots fill it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-ink-soft">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand-red" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>{CONSENT_TEXT[p.locale]}</span>
      </label>
      {err && <p className="mt-3 text-sm font-semibold text-brand-red" role="alert">{err}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="btn-red" disabled={state === 'sending' || !email}>{state === 'sending' ? (ar ? 'ثانية…' : 'One sec…') : (ar ? 'ابعتلي' : 'Keep me posted')}</button>
        <span className="text-xs text-ink-mute">{ar ? 'بنسجّل بس اللي كتبته هنا، ومش بناخد أي حاجة من الـ CV.' : 'We only store what you type here, nothing from your CV.'}</span>
      </div>
    </form>
  );
}
