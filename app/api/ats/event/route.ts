import { NextResponse, type NextRequest } from 'next/server';
import { ipHash } from '@/lib/stats/ip';
import { saveEvent, EVENTS, type EventType } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';

/** anonymous usage counter: visit, rewrite, download, share (event type + hashed visitor only) */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b || !EVENTS.includes(b.type)) return NextResponse.json({ error: 'bad' }, { status: 400 });
  try { await saveEvent(b.type as EventType, ipHash(req)); } catch {}
  return NextResponse.json({ ok: true });
}
