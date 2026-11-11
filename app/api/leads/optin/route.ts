import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { isRole } from '@/lib/ats/learn';
import { sendOptinWelcome } from '@/lib/email';
import { CONSENT_TEXT, EMAIL, normPhone } from '@/lib/leads';

export const dynamic = 'force-dynamic';

const ipHash = (req: NextRequest) => {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'na';
  return createHash('sha256').update(`${ip}|${process.env.CRON_SECRET || 'meplab-salt'}`).digest('hex').slice(0, 24);
};
export async function POST(req: NextRequest) {
  const b: any = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: 'bad' }, { status: 400 });
  if (b.consent !== true) return NextResponse.json({ error: 'consent' }, { status: 400 });
  if (typeof b.website === 'string' && b.website) return NextResponse.json({ ok: true }); // honeypot: bots fill hidden fields
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  const phone = normPhone(b.phone);
  if (phone === 'bad') return NextResponse.json({ error: 'phone' }, { status: 400 });
  const locale = b.locale === 'en' ? 'en' : 'ar';

  try {
    const db = createAdminClient();
    const h = ipHash(req);
    const { count } = await db.from('leads').select('id', { count: 'exact', head: true }).eq('ip_hash', h).gte('created_at', new Date(Date.now() - 3600000).toISOString());
    if ((count ?? 0) >= 8) return NextResponse.json({ error: 'rate' }, { status: 429 });

    const row = {
      email,
      phone,
      full_name: null,
      role_id: isRole(b.role_id) ? b.role_id : null,
      discipline: typeof b.discipline === 'string' ? b.discipline.slice(0, 20) : null,
      market: ['eg', 'sa', 'ae'].includes(b.market) ? b.market : null,
      ats_score: Number.isFinite(+b.score) ? Math.max(0, Math.min(100, Math.round(+b.score))) : null,
      years: Number.isFinite(+b.years) ? Math.max(0, Math.min(60, +b.years)) : null,
      level: typeof b.level === 'string' ? b.level.slice(0, 12) : null,
      locale,
      source: 'cv-optin',
      consent: true,
      consent_at: new Date().toISOString(),
      consent_text: CONSENT_TEXT[locale],
      ip_hash: h
    };
    const { data, error } = await db.from('leads').insert(row).select('unsub_token').single();
    if (error) throw error;
    // Someone who opts in again after unsubscribing has asked to hear from us again.
    await db.from('leads').update({ unsubscribed_at: null }).eq('email', email).not('unsubscribed_at', 'is', null);
    await sendOptinWelcome({ to: email, locale, score: row.ats_score, token: data.unsub_token }).catch(() => false);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

/** The box shows only when the database is ready for opt-ins (columns added, service key set). */
export async function GET() {
  let enabled = false;
  try {
    const db = createAdminClient();
    const { error } = await db.from('leads').select('consent, unsub_token').limit(1);
    enabled = !error;
  } catch {}
  return NextResponse.json({ enabled }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
}
