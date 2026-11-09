import { NextResponse } from 'next/server';
import { createClient as createSb } from '@supabase/supabase-js';
import { normalizeMachineCode } from '@/lib/license';

export const API_VERSION = 1;

export function json(body: any, status = 200) {
  return NextResponse.json({ api: API_VERSION, ...body }, { status, headers: { 'Cache-Control': 'no-store' } });
}
export const fail = (error: string, status: number, extra: any = {}) => json({ ok: false, error, ...extra }, status);

/* very small best-effort rate limit (per server instance) */
const hits = new Map<string, number[]>();
export function limited(key: string, max = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

/** Sign the student in with email/password and return a client acting as that user (RLS applies). */
export async function signInPlayer(body: any) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const machine = normalizeMachineCode(String(body?.machine_id || ''));
  if (!email || !password || machine.length < 6) return { err: fail('bad_request', 400) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { err: fail('server_not_configured', 500) };
  const sb = createSb(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { err: fail('invalid_credentials', 401) };
  return { sb, user: data.user, machine, email };
}

export function ipOf(req: Request) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}
