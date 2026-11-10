'use client';
import { useState } from 'react';

const T = {
  ar: {
    t: 'احفظ الـ CV ده في حسابك', d: 'يتخزن في بروفايلك على MEP LAB علشان تحمّله في أي وقت وتحدّثه. مش بنشاركه مع حد، ومن غير موافقتك مش بيترفع.',
    b: 'احفظه في حسابي', gt: 'احفظ نتيجتك والـ CV في حساب مجاني', gd: 'بحساب مجاني بإيميلك: آخر CV محفوظ عندك، والكورسات، وتحميل MEP LAB Player.', gb: 'اعمل حساب مجاني', busy: 'بنحفظ...', ok: 'اتحفظ في بروفايلك ✓', view: 'افتح بروفايلي', err: 'ما قدرنا نحفظه، جرّب تاني.', big: 'الملف أكبر من 10 ميجا.'
  },
  en: {
    t: 'Save this CV to your account', d: 'Stored in your MEP LAB profile so you can download and update it any time. Never shared, and never uploaded without your consent.',
    b: 'Save to my account', gt: 'Keep your result and CV in a free account', gd: 'A free account keeps your latest CV, plus courses and the MEP LAB Player download.', gb: 'Create a free account', busy: 'Saving...', ok: 'Saved to your profile ✓', view: 'Open my profile', err: "Couldn't save it, try again.", big: 'File is larger than 10 MB.'
  }
};

export default function CvSave({ file, locale, profileHref = '/profile', signedIn = true, signupHref = '/signup?next=/cv-check' }: { file: File | null; locale: 'ar' | 'en'; profileHref?: string; signedIn?: boolean; signupHref?: string }) {
  const t = T[locale];
  const [st, setSt] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  if (!signedIn)
    return (
      <div className="card mt-6 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h3 className="font-semibold text-ink">{t.gt}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{t.gd}</p>
        </div>
        <a href={signupHref} className="btn-blue shrink-0">{t.gb}</a>
      </div>
    );
  if (!file) return null;
  async function save() {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setSt('err'); setMsg(t.big); return; }
    setSt('busy'); setMsg('');
    try {
      if ((window as any).__AUTH_MOCK__) { await new Promise((r) => setTimeout(r, 600)); setSt('ok'); return; }
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch('/api/cv', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      setSt('ok');
    } catch { setSt('err'); setMsg(t.err); }
  }
  return (
    <div className="card mt-6 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex-1">
        <h3 className="font-bold text-ink">{t.t}</h3>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{t.d}</p>
        <p className="mt-1 text-xs text-ink-mute" dir="ltr">{file.name}</p>
        {msg && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{msg}</p>}
      </div>
      {st === 'ok' ? (
        <div className="flex flex-col items-end gap-1">
          <span className="font-bold text-green-700">{t.ok}</span>
          <a href={profileHref} className="text-sm font-semibold text-brand-blue">{t.view} →</a>
        </div>
      ) : (
        <button onClick={save} disabled={st === 'busy'} className="btn-blue shrink-0">{st === 'busy' ? t.busy : t.b}</button>
      )}
    </div>
  );
}
