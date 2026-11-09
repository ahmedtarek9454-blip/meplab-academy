import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const str = (v: any, n: number) => (v === undefined || v === null ? undefined : String(v).trim().slice(0, n) || null);

/** GET: my profile — POST: update profile fields (from the sign-up gate, the profile page, or after a CV check) */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });
  let b: any = {};
  try { b = await req.json(); } catch {}
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [k, n] of [['full_name', 80], ['phone', 30], ['role_id', 40], ['job_title', 80], ['company', 80], ['linkedin', 120], ['detected_role', 40]] as const) {
    const v = str(b[k], n); if (v !== undefined) patch[k] = v;
  }
  if (b.market !== undefined) patch.market = ['eg', 'sa', 'ae'].includes(b.market) ? b.market : null;
  if (b.years !== undefined) patch.years = Number.isFinite(+b.years) ? Math.max(0, Math.min(50, +b.years)) : null;
  if (b.last_ats !== undefined && Number.isFinite(+b.last_ats)) patch.last_ats = Math.round(+b.last_ats);
  if (b.detected_years !== undefined && Number.isFinite(+b.detected_years)) patch.detected_years = +b.detected_years;
  if (b.check) {
    const { data: cur } = await supabase.from('profiles').select('cv_checks').eq('id', user.id).maybeSingle();
    patch.cv_checks = (cur?.cv_checks || 0) + 1; patch.last_check_at = new Date().toISOString();
  }
  // ensure a profile row exists (OTP sign-ups create it via trigger; this is a safety net)
  await supabase.from('profiles').upsert({ id: user.id, email: user.email, ...patch }, { onConflict: 'id' });
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return NextResponse.json({ ok: true, profile: data });
}
