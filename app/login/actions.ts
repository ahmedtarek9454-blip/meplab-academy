'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
    options: {
      data: {
        full_name: String(formData.get('full_name') || '').trim(),
        phone: String(formData.get('phone') || '').trim()
      },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });
  if (error) redirect(`/signup?error=1&next=${encodeURIComponent(next)}`);
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
