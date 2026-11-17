import { NextResponse, type NextRequest } from 'next/server';
import { ipHash, fromOurSite, tooBig } from '@/lib/stats/ip';
import { saveEvent, EVENTS, type EventType } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';

/** anonymous usage counter: visit, rewrite, download, share (event type + hashed visitor only) */
export async function POST(req: NextRequest) {
  if (!fromOurSite(req) || tooBig(req, 2000)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const b = await req.json().catch(() => null);
  if (!b || !EVENTS.includes(b.type)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  try { await saveEvent(b.type as EventType, ipHash(req)); } catch {}
  return NextResponse.json({ ok: true });
}
