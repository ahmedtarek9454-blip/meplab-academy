import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeSignal, isRole } from '@/lib/ats/learn';
import { ipHash } from '@/lib/stats/ip';
import { saveSignal, confirmSignal, BLOB_ID } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';

const supabaseOn = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const admin = async () => (await import('@/lib/supabase/admin')).createAdminClient();

/** anonymous learning signal after a CV check (no CV text, no personal data) */
export async function POST(req: NextRequest) {
  const sig = sanitizeSignal(await req.json().catch(() => null));
  if (!sig) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const h = ipHash(req);
  let sbId: string | null = null;
  if (supabaseOn()) {
    try {
      const { data } = await (await admin()).from('cv_signals').insert({ ...sig, ip_hash: h }).select('id').single();
      sbId = data?.id ?? null;
    } catch {}
  }
  try {
    const r = await saveSignal(sig, h, sbId);
    if ('error' in r) return NextResponse.json({ error: 'rate' }, { status: 429 });
    return NextResponse.json({ id: r.id });
  } catch {
    return NextResponse.json(sbId ? { id: sbId } : { ok: false }); // learning is best-effort; never break the checker
  }
}

/** the person confirms or corrects the detected role (once per signal) */
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.id !== 'string' || !isRole(b.confirmed_role)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  let sbId: string | null | undefined = /^[0-9a-f-]{36}$/.test(b.id) ? b.id : null;
  if (BLOB_ID.test(b.id)) {
    try { const r = await confirmSignal(b.id, b.confirmed_role); if (!r.ok) return NextResponse.json({ ok: false }); sbId = r.sb_id; } catch {}
  }
  if (sbId && supabaseOn()) {
    try { await (await admin()).from('cv_signals').update({ confirmed_role: b.confirmed_role, feedback_at: new Date().toISOString() }).eq('id', sbId).is('feedback_at', null); } catch {}
  }
  return NextResponse.json({ ok: true });
}
