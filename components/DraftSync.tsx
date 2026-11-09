'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

/** After signing in through the email link (or Google), save the profile details typed in the sign-up form. */
export default function DraftSync() {
  useEffect(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem('meplab_profile_draft'); } catch {}
    if (!raw) return;
    const sb = supabaseBrowser(); if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      if (!data?.user) return;
      fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw! })
        .then((r) => { if (r.ok) try { localStorage.removeItem('meplab_profile_draft'); } catch {} })
        .catch(() => {});
    });
  }, []);
  return null;
}
