'use client';
import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Mark } from './Logo';
import { ROLES, MARKETS, type Market } from '@/lib/cv/data';

type Loc = 'ar' | 'en';
const T = {
  ar: {
    title: 'اعمل بروفايلك على MEP LAB وشوف نتيجة الـ CV',
    sub: 'مجاني تمامًا ودقيقة واحدة. هنبعتلك كود من 6 أرقام على إيميلك، وبعدها النتيجة هتظهر على طول.',
    phone: 'رقم الموبايل (واتساب)',
    role: 'تخصصك',
    role_ph: 'اختار التخصص',
    years: 'سنين الخبرة',
    market: 'بتدوّر على شغل في',
    step1: 'بياناتك', step2: 'تأكيد الإيميل',
    bad_name: 'اكتب اسمك.',
    name: 'اسمك',
    email: 'الإيميل',
    send: 'ابعتلي الكود',
    sending: 'بنبعت الكود...',
    code_sent: 'بعتنا الكود على {e}. افتح إيميلك (شوف الـ Spam كمان) واكتبه هنا.',
    code: 'الكود (6 أرقام)',
    verify: 'تأكيد وعرض النتيجة',
    verifying: 'بنتأكد...',
    resend: 'ما وصلش؟ ابعت تاني',
    change: 'غيّر الإيميل',
    or: 'أو',
    google: 'المتابعة بحساب Google',
    bad_email: 'اكتب إيميل صحيح.',
    bad_code: 'الكود غلط أو انتهى. جرّب تاني أو اطلب كود جديد.',
    err: 'حصلت مشكلة، جرّب تاني بعد شوية.',
    not_conf: 'التسجيل مش متفعّل على الموقع لسه.',
    why: ['بروفايلك بيتحفظ، وكل فحص جديد بيتسجّل فيه',
      'نتيجة ATS كاملة ومطابقة مع إعلانات الوظايف', 'تعديل الـ CV أوتوماتيك وتحميله Word و PDF', 'وظايف MEP مناسبة ليك كل يوم', 'إشعار بأي كورس جديد من MEP LAB'],
    privacy: 'الـ CV بيتحلل على جهازك ومش بيترفع. بنحفظ إيميلك ونتيجتك بس، ومش بنشاركهم مع حد.',
    welcome: 'أهلًا {n}! بنجهّز النتيجة...',
    login_title: 'ادخل على حسابك في MEP LAB', login_sub: 'اكتب إيميلك وهنبعتلك كود من 6 أرقام — من غير باسورد.', login_verify: 'تأكيد ودخول', login_welcome: 'أهلًا بيك تاني! بندخّلك...',
    signup_title: 'اعمل حسابك على MEP LAB', signup_sub: 'مجاني ودقيقة واحدة. الحساب بيفتحلك الكورسات والتحميل وفحص الـ CV وصفحتك الشخصية.', signup_verify: 'تأكيد وإنشاء الحساب', signup_welcome: 'أهلًا {n}! بنجهّز حسابك...',
    no_account: 'معندكش حساب؟', have_account: 'عندك حساب؟', go_signup: 'اعمل حساب', go_login: 'ادخل'
  },
  en: {
    title: 'Create your MEP LAB profile and see your CV results',
    sub: 'Free and takes a minute. We will email you a 6-digit code and your results will appear right after.',
    phone: 'Mobile (WhatsApp)',
    role: 'Your specialty',
    role_ph: 'Choose a specialty',
    years: 'Years of experience',
    market: 'Looking for work in',
    step1: 'Your details', step2: 'Verify email',
    bad_name: 'Enter your name.',
    name: 'Your name',
    email: 'Email',
    send: 'Send me the code',
    sending: 'Sending...',
    code_sent: 'We sent a code to {e}. Check your inbox (and spam) and enter it here.',
    code: 'Code (6 digits)',
    verify: 'Verify & show results',
    verifying: 'Verifying...',
    resend: "Didn't arrive? Resend",
    change: 'Change email',
    or: 'or',
    google: 'Continue with Google',
    bad_email: 'Enter a valid email.',
    bad_code: 'Wrong or expired code. Try again or request a new one.',
    err: 'Something went wrong, try again shortly.',
    not_conf: 'Sign-up is not enabled on this site yet.',
    why: ['Your profile is saved and every new check is recorded in it',
      'Full ATS score and job-post matching', 'Automatic CV rewrite with Word & PDF download', 'Matching MEP jobs every day', 'Updates on new MEP LAB courses'],
    privacy: 'Your CV is analysed on your device and never uploaded. We only keep your email and result, and never share them.',
    welcome: 'Welcome {n}! Preparing your results...',
    login_title: 'Log in to MEP LAB', login_sub: 'Enter your email and we will send a 6-digit code — no password.', login_verify: 'Verify & log in', login_welcome: 'Welcome back! Signing you in...',
    signup_title: 'Create your MEP LAB account', signup_sub: 'Free and takes a minute. Your account unlocks courses, the Player download, the CV checker and your personal page.', signup_verify: 'Verify & create account', signup_welcome: 'Welcome {n}! Setting up your account...',
    no_account: 'No account?', have_account: 'Have an account?', go_signup: 'Sign up', go_login: 'Log in'
  }
};

export type GateUser = { id: string; email: string; name?: string };

/** returns the current member, or null */
export async function currentUser(): Promise<GateUser | null> {
  const mock = (window as any).__AUTH_MOCK__;
  if (mock) return mock.user || null;
  const sb = supabaseBrowser(); if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data?.user ? { id: data.user.id, email: data.user.email || '', name: data.user.user_metadata?.full_name } : null;
}

export type ProfileDraft = { full_name: string; phone: string; role_id: string; years: number | null; market: Market | '' };

export type GateMode = 'cv' | 'signup' | 'login';

export default function EmailGate({ locale, onDone, nextPath = '/cv-check?resume=1', defaultMarket = '', mode = 'cv' }: { locale: Loc; onDone: (u: GateUser, p: ProfileDraft) => void; nextPath?: string; defaultMarket?: Market | ''; mode?: GateMode }) {
  const t = T[locale];
  const login = mode === 'login';
  const title = login ? t.login_title : mode === 'signup' ? t.signup_title : t.title;
  const sub = login ? t.login_sub : mode === 'signup' ? t.signup_sub : t.sub;
  const verifyLabel = login ? t.login_verify : mode === 'signup' ? t.signup_verify : t.verify;
  const welcome = login ? t.login_welcome : mode === 'signup' ? t.signup_welcome : t.welcome;
  const [step, setStep] = useState<'email' | 'code' | 'ok'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [years, setYears] = useState('');
  const [mkt, setMkt] = useState<Market | ''>('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (defaultMarket && !mkt) setMkt(defaultMarket); }, [defaultMarket]); // eslint-disable-line
  const draft = (): ProfileDraft => ({ full_name: name.trim(), phone: phone.trim(), role_id: roleId, years: years === '' ? null : +years, market: mkt });
  useEffect(() => { if (step === 'code') setTimeout(() => codeRef.current?.focus(), 50); }, [step]);

  const mock = typeof window !== 'undefined' ? (window as any).__AUTH_MOCK__ : null;

  async function send() {
    setErr('');
    const e = email.trim().toLowerCase();
    if (!login && !name.trim()) return setErr(t.bad_name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return setErr(t.bad_email);
    setBusy(true);
    try {
      if (mock) { await new Promise((r) => setTimeout(r, 500)); setStep('code'); return; }
      const sb = supabaseBrowser(); if (!sb) return setErr(t.not_conf);
      const { error } = await sb.auth.signInWithOtp({
        email: e,
        options: { shouldCreateUser: true, data: name.trim() ? { full_name: name.trim() } : undefined, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` }
      });
      if (error) return setErr(/rate|seconds/i.test(error.message) ? error.message : t.err);
      setStep('code');
    } finally { setBusy(false); }
  }
  async function verify() {
    setErr('');
    const c = code.replace(/\D/g, '');
    if (c.length < 6) return setErr(t.bad_code);
    setBusy(true);
    try {
      if (mock) { await new Promise((r) => setTimeout(r, 500)); if (c !== '123456') return setErr(t.bad_code); const u = { id: 'demo', email: email.trim(), name: name.trim() }; mock.user = u; setStep('ok'); setTimeout(() => onDone(u, draft()), 700); return; }
      const sb = supabaseBrowser(); if (!sb) return setErr(t.not_conf);
      const { data, error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: c, type: 'email' });
      if (error || !data?.user) return setErr(t.bad_code);
      if (!login) {
        await sb.auth.updateUser({ data: { full_name: name.trim(), phone: phone.trim() } }).catch(() => {});
        // build the member profile on our side
        await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft()) }).catch(() => {});
      } else {
        // make sure a profile row exists (e.g. first login after a Google sign-up)
        await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
      }
      setStep('ok'); setTimeout(() => onDone({ id: data.user!.id, email: data.user!.email || '', name: name.trim() || data.user!.user_metadata?.full_name }, draft()), 700);
    } finally { setBusy(false); }
  }
  async function google() {
    const sb = supabaseBrowser(); if (!sb) return setErr(t.not_conf);
    try { sessionStorage.setItem('meplab_profile_draft', JSON.stringify(draft())); } catch {}
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` } });
  }

  return (
    <div className="card mx-auto max-w-3xl overflow-hidden">
      <div className="grid md:grid-cols-[1fr,280px]">
        <div className="p-6 md:p-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold">
            <span className={`rounded-full px-2.5 py-0.5 ${step === 'email' ? 'bg-brand-red text-white' : 'bg-green-100 text-green-700'}`}>1 · {t.step1}</span>
            <span className="h-px w-6 bg-slate-300" />
            <span className={`rounded-full px-2.5 py-0.5 ${step === 'email' ? 'bg-slate-100 text-slate-500' : step === 'code' ? 'bg-brand-red text-white' : 'bg-green-100 text-green-700'}`}>2 · {t.step2}</span>
          </div>
          <h3 className="text-xl font-extrabold text-brand-navy">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{sub}</p>

          {step === 'email' && (
            <div className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {!login && <div><label className="label">{t.name} *</label><input value={name} onChange={(e) => setName(e.target.value)} className="input" dir="auto" autoComplete="name" /></div>}
                <div className={login ? 'sm:col-span-2' : ''}><label className="label">{t.email} *</label><input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} type="email" className="input" dir="ltr" autoComplete="email" inputMode="email" /></div>
                {!login && <><div><label className="label">{t.phone}</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" dir="ltr" autoComplete="tel" inputMode="tel" placeholder="+20 1xx xxx xxxx" /></div>
                <div><label className="label">{t.role}</label>
                  <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="input">
                    <option value="">{t.role_ph}</option>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r[locale]}</option>)}
                  </select></div>
                <div><label className="label">{t.years}</label><input value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} className="input" dir="ltr" inputMode="decimal" placeholder="0" /></div>
                <div><label className="label">{t.market}</label>
                  <select value={mkt} onChange={(e) => setMkt(e.target.value as Market)} className="input">
                    <option value="">—</option>
                    {(Object.keys(MARKETS) as Market[]).map((m) => <option key={m} value={m}>{MARKETS[m][locale === 'ar' ? 'name_ar' : 'name_en']}</option>)}
                  </select></div></>}
              </div>
              <button onClick={send} disabled={busy} className="btn-red w-full py-3">{busy ? t.sending : t.send}</button>
              {!mock && (
                <>
                  <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />{t.or}<span className="h-px flex-1 bg-slate-200" /></div>
                  <button onClick={google} type="button" className="btn-ghost w-full">
                    <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                    {t.google}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'code' && (
            <div className="mt-5 space-y-3">
              <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">✉️ {t.code_sent.replace('{e}', email.trim())}</p>
              <div><label className="label">{t.code}</label><input ref={codeRef} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={(e) => e.key === 'Enter' && verify()} className="input text-center font-mono text-2xl tracking-[0.5em]" dir="ltr" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" /></div>
              <button onClick={verify} disabled={busy} className="btn-red w-full py-3">{busy ? t.verifying : verifyLabel}</button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={send} disabled={busy} className="font-semibold text-brand-blue">{t.resend}</button>
                <button type="button" onClick={() => { setStep('email'); setCode(''); }} className="text-slate-500">{t.change}</button>
              </div>
            </div>
          )}

          {step === 'ok' && <p className="mt-5 rounded-xl bg-green-50 p-4 font-bold text-green-800">✓ {welcome.replace('{n}', name.trim() || '')}</p>}
          {mode !== 'cv' && step === 'email' && (
            <p className="mt-4 text-center text-sm text-slate-600">{login ? t.no_account : t.have_account}{' '}
              <a href={`${login ? '/signup' : '/login'}?next=${encodeURIComponent(nextPath)}`} className="font-bold text-brand-blue">{login ? t.go_signup : t.go_login}</a></p>
          )}

          {err && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">⚠️ {err}</p>}
          {mode === 'cv' && <p className="mt-4 text-xs leading-5 text-slate-500">🔒 {t.privacy}</p>}
        </div>

        <div className="relative hidden bg-brand-navy p-6 text-white md:block">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <Mark className="h-12 w-12" mono="#fff" center="#E53935" />
            <div className="mt-3 text-lg font-black" dir="ltr">MEP <span className="text-brand-red">LAB</span></div>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">{t.why.map((w) => <li key={w}>✓ {w}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}
