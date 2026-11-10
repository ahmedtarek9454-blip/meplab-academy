import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hits = new Map<string, number[]>(); // best-effort per-instance throttle

/** "Notify me when it launches" for a coming-soon course */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const email = String(b?.email || '').trim().toLowerCase();
  const slug = String(b?.slug || '');
  if (!EMAIL.test(email) || email.length > 120 || !/^[a-z0-9-]{2,80}$/.test(slug)) return NextResponse.json({ error: 'bad' }, { status: 400 });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'na';
  const now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (recent.length >= 10) return NextResponse.json({ error: 'rate' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  try {
    const db = createAdminClient();
    const { data: c } = await db.from('courses').select('id, status').eq('slug', slug).eq('published', true).maybeSingle();
    if (!c || c.status !== 'soon') return NextResponse.json({ error: 'not_soon' }, { status: 400 });
    let user_id: string | null = null;
    try { const sb = await createClient(); user_id = (await sb.auth.getUser()).data.user?.id ?? null; } catch {}
    const { error } = await db.from('course_waitlist').upsert({ course_id: c.id, email, user_id }, { onConflict: 'course_id,email', ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
