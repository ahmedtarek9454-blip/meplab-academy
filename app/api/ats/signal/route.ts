import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeSignal, isRole } from '@/lib/ats/learn';

export const dynamic = 'force-dynamic';

const ipHash = (req: NextRequest) => {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'na';
  return createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || 'meplab-salt'}`).digest('hex').slice(0, 24);
};

/** anonymous learning signal after a CV check (no CV text, no personal data) */
export async function POST(req: NextRequest) {
  const sig = sanitizeSignal(await req.json().catch(() => null));
  if (!sig) return NextResponse.json({ error: 'bad' }, { status: 400 });
  try {
    const db = createAdminClient();
    const h = ipHash(req);
    const { count } = await db.from('cv_signals').select('id', { count: 'exact', head: true }).eq('ip_hash', h).gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 40) return NextResponse.json({ error: 'rate' }, { status: 429 });
    const { data, error } = await db.from('cv_signals').insert({ ...sig, ip_hash: h }).select('id').single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ ok: false }); // learning is best-effort; never break the checker
  }
}

/** the person confirms or corrects the detected role (once per signal) */
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.id !== 'string' || !/^[0-9a-f-]{36}$/.test(b.id) || !isRole(b.confirmed_role)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  try {
    const db = createAdminClient();
    const { error } = await db.from('cv_signals').update({ confirmed_role: b.confirmed_role, feedback_at: new Date().toISOString() }).eq('id', b.id).is('feedback_at', null);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
