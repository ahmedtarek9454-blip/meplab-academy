import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** records a CV-check usage for the logged-in member (email + detected role/market/score). CV text is never stored. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });
  let b: any = {};
  try { b = await req.json(); } catch {}
  const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  await supabase.from('leads').insert({
    user_id: user.id,
    email: user.email,
    full_name: prof?.full_name || String(b.name || '').slice(0, 80) || null,
    role_id: String(b.role_id || '').slice(0, 40) || null,
    market: ['eg', 'sa', 'ae'].includes(b.market) ? b.market : null,
    ats_score: Number.isFinite(+b.score) ? Math.round(+b.score) : null,
    years: Number.isFinite(+b.years) ? +b.years : null,
    level: String(b.level || '').slice(0, 12) || null,
    source: String(b.source || 'cv-check').slice(0, 30)
  });
  return NextResponse.json({ ok: true });
}
