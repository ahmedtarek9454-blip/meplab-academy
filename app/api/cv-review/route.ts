import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reviewCv } from '@/lib/ai/cvReview';
import { MARKETS, type Market } from '@/lib/cv/data';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'login' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad' }, { status: 400 }); }
  const text = String(body.text || '').trim();
  if (text.length < 200) return NextResponse.json({ error: 'short' }, { status: 400 });

  // daily limit per user
  const limit = parseInt(process.env.AI_DAILY_LIMIT || '3', 10);
  const since = new Date(Date.now() - 86400000).toISOString();
  const { count } = await supabase.from('cv_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
  if ((count ?? 0) >= limit) return NextResponse.json({ error: 'limit', limit }, { status: 429 });

  try {
    const market = (['eg', 'sa', 'ae'].includes(body.market) ? body.market : 'eg') as Market;
    const review = await reviewCv(text, {
      locale: body.locale === 'en' ? 'en' : 'ar',
      market,
      marketName: MARKETS[market].name_en,
      role: String(body.role || 'MEP Mechanical Engineer').slice(0, 80),
      roleId: String(body.role_id || 'hvac_design').slice(0, 40),
      years: Number(body.years) || 0,
      atsScore: Number(body.score) || 0,
      jd: String(body.jd || '').slice(0, 6000)
    });
    // only usage metadata is stored — never the CV text
    await supabase.from('cv_reviews').insert({ user_id: user.id, role_id: String(body.role_id || '').slice(0, 40) || null, ats_score: Number(body.score) || null });
    return NextResponse.json({ review, left: Math.max(0, limit - (count ?? 0) - 1) });
  } catch (e: any) {
    const msg = e.message === 'not_configured' || e.message === 'busy' ? e.message : 'failed';
    if (msg === 'failed') console.error('cv-review', e);
    return NextResponse.json({ error: msg }, { status: msg === 'busy' ? 503 : 500 });
  }
}
