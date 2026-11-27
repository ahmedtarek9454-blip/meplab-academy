'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { toSheet, normWhatsapp } from '@/lib/sheet';
import { DEPARTMENTS, COUNTRIES, cleanYear } from '@/lib/education';
import { saveEvent } from '@/lib/stats/store';
import { ipHashFromHeaders } from '@/lib/stats/ip';
import { recoveryLink } from '@/lib/authLinks';
import { sendResetLink } from '@/lib/email';

function safeNext(v: FormDataEntryValue | null) {
  const s = String(v || '/dashboard');
  return s.startsWith('/') && !s.startsWith('//') ? s : '/dashboard';
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const h = await headers();
  return `${h.get('x-forwarded-proto') || 'http'}://${h.get('host')}`;
}

export async function signIn(formData: FormData) {
  const next = safeNext(formData.get('next'));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || '')
  });
  if (error) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUp(formData: FormData) {
  const next = safeNext(formData.get('next'));
  const full_name = String(formData.get('full_name') || '').trim().slice(0, 80);
  const phone = normWhatsapp(String(formData.get('phone') || ''));
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (full_name.length < 3) redirect(`/signup?error=name&next=${encodeURIComponent(next)}`);
  if (!phone) redirect(`/signup?error=phone&next=${encodeURIComponent(next)}`);
  if (String(formData.get('password') || '').length < 8) redirect(`/signup?error=weak&next=${encodeURIComponent(next)}`);
  const department = String(formData.get('department') || '').trim();
  const university = String(formData.get('university') || '').trim().slice(0, 80);
  const grad_year = cleanYear(formData.get('grad_year'));
  const country = String(formData.get('country') || '').trim();
  if (!DEPARTMENTS.includes(department) || !COUNTRIES.includes(country) || university.length < 3 || !grad_year) redirect(`/signup?error=edu&next=${encodeURIComponent(next)}`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: String(formData.get('password') || ''),
    options: {
      data: { full_name, phone, department, university, grad_year, country },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });
  if (error) redirect(`/signup?error=${/already|registered|exists/i.test(error.message) ? 'exists' : '1'}&next=${encodeURIComponent(next)}`);
  try { await saveEvent('signup', ipHashFromHeaders(await headers())); } catch {}
  await toSheet({ event: 'signup', name: full_name, email, whatsapp: phone, department, university, grad_year, country, source: next.startsWith('/cv-check') ? 'فحص الـ CV' : next.startsWith('/courses') ? 'الكورسات' : 'الموقع' });
  // If email confirmation is disabled, a session exists already
  if (data.session) redirect(next);
  redirect(`/login?check=1&next=${encodeURIComponent(next)}`);
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get('next'));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` }
  });
  if (error || !data?.url) redirect('/login?error=1');
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * "forgot password": e-mail a reset link that lands on /auth/confirm, then /reset/new.
 * With RESEND_API_KEY set we make the link ourselves and send it through Resend.
 * Without it we fall back to Supabase's own mailer, which is rate limited and often does not deliver.
 */
export async function sendReset(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  let sent = false;
  if (email && process.env.RESEND_API_KEY) {
    const url = await recoveryLink(email, await siteUrl());
    if (url) sent = await sendResetLink({ to: email, url });
  }
  if (email && !sent) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteUrl()}/auth/callback?next=/reset/new` }).catch((e) => ({ error: e }));
    if (error) console.error('reset email', (error as any)?.message || error);
  }
  redirect('/reset?sent=1'); // same answer whether the e-mail exists or not
}

/** the button on /auth/confirm: trade the one-time token for a session, then ask for the new password */
export async function confirmRecovery(formData: FormData) {
  const token_hash = String(formData.get('token_hash') || '');
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash });
  if (error) redirect('/auth/confirm?error=1');
  redirect('/reset/new');
}

export async function setNewPassword(formData: FormData) {
  const pw = String(formData.get('password') || '');
  if (pw.length < 8) redirect('/reset/new?error=weak');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) redirect('/reset/new?error=1');
  await supabase.auth.signOut();
  redirect('/login?reset=1');
}
