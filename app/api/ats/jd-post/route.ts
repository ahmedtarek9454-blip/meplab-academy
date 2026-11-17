import { NextResponse, type NextRequest } from 'next/server';
import { ipHash, fromOurSite, tooBig } from '@/lib/stats/ip';
import { saveJdPost } from '@/lib/stats/store';
import { isRole } from '@/lib/ats/learn';

export const dynamic = 'force-dynamic';

/** a job post someone matched their CV against: the engine learns what employers ask for per role. Employer text only, never the CV. */
export async function POST(req: NextRequest) {
  if (!fromOurSite(req) || tooBig(req, 16_000)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const b = await req.json().catch(() => null);
  const text = typeof b?.text === 'string' ? b.text.replace(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g, ' ').replace(/\+?\d[\d\s-]{7,}\d/g, ' ').slice(0, 6000) : '';
  if (!isRole(b?.role_id) || text.length < 150) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const market = ['eg', 'sa', 'ae'].includes(b.market) ? b.market : 'eg';
  try {
    const r = await saveJdPost({ title: String(b.title || '').slice(0, 120), text, role_id: b.role_id, market }, ipHash(req));
    return NextResponse.json({ ok: r === 'ok', r });
  } catch { return NextResponse.json({ ok: false }); }
}
