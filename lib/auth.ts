import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  let profile: any = null;
  if (user) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = p;
  }
  return { supabase, user, profile, isAdmin: profile?.role === 'admin' };
}

export async function requireUser(next = '/dashboard') {
  const s = await getSession();
  if (!s.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s.user) redirect('/login?next=/admin');
  if (!s.isAdmin) redirect('/');
  return s;
}
