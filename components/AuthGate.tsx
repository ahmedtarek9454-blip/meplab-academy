'use client';
import EmailGate, { type GateMode } from './EmailGate';

/** /login and /signup: same email-code flow as the CV gate, then go to `next`. */
export default function AuthGate({ mode, next, locale, notice }: { mode: GateMode; next: string; locale: 'ar' | 'en'; notice?: string }) {
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  return (
    <section className="container-x max-w-3xl py-12">
      {notice && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-900">🔒 {notice}</p>}
      <EmailGate locale={locale} mode={mode} nextPath={safeNext} onDone={() => { window.location.assign(safeNext); }} />
    </section>
  );
}
