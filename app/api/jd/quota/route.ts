import { NextResponse, type NextRequest } from 'next/server';
import { ipHash, fromOurSite, tooBig } from '@/lib/stats/ip';
import { freeJdAllowed } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';

/** visitors without an account get one job-post match; members are not limited (the page doesn't ask) */
export async function POST(req: NextRequest) {
  if (!fromOurSite(req) || tooBig(req, 500)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const b = await req.json().catch(() => null);
  const h = typeof b?.h === 'string' && /^[0-9a-f]{8,32}$/.test(b.h) ? b.h : '';
  if (!h) return NextResponse.json({ error: 'bad' }, { status: 400 });
  return NextResponse.json({ ok: await freeJdAllowed(ipHash(req), h) });
}
