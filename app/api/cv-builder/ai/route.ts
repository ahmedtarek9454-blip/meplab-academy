import { NextResponse, type NextRequest } from 'next/server';
import { aiEnabled, interpretWithAi, addsNumbers } from '@/lib/ai/speechLines';
import { ROLES } from '@/lib/cv/data';

export const dynamic = 'force-dynamic';

// small in-memory limiter (per server instance): enough to stop a script hammering the free AI quota
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), win = 3600_000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}

export async function GET() {
  return NextResponse.json({ enabled: aiEnabled() });
}

export async function POST(req: NextRequest) {
  if (!aiEnabled()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'na';
  if (limited(ip)) return NextResponse.json({ error: 'rate' }, { status: 429 });
  const b: any = await req.json().catch(() => null);
  const lines: string[] = Array.isArray(b?.lines) ? b.lines.map((x: any) => String(x || '')).filter(Boolean).slice(0, 20) : [];
  if (!lines.length) return NextResponse.json({ error: 'bad' }, { status: 400 });
  const role = ROLES.find((r) => r.id === b?.roleId)?.en || '';
  try {
    const out = await interpretWithAi(lines, role);
    return NextResponse.json({
      lines: out.map((o, i) => (o.text && addsNumbers(lines[i], o.text) ? { text: '', unclear: true, rejected: true } : o))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.retryable ? 'busy' : 'failed' }, { status: e?.retryable ? 503 : 502 });
  }
}
