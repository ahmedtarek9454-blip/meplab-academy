import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { SUPABASE_READY, hasAuthCookie } from './supabase/env';

/**
 * One auth lookup per request: the header and the page both call getSession(),
 * React's cache() makes the second call free. A visitor with no Supabase auth cookie
 * (most traffic) never triggers a network call to Supabase at all.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const store = await cookies();
  if (!SUPABASE_READY || !hasAuthCookie(store.getAll().map((c) => c.name))) {
    return { supabase, user: null as any, profile: null as any, isAdmin: false };
  }
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }
  let profile: any = null;
  if (user) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = p;
  }
  return { supabase, user, profile, isAdmin: profile?.role === 'admin' };
});

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
