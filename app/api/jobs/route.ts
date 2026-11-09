import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Public read: /api/jobs?market=eg&role=hvac_design&limit=6 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const supabase = await createClient();
  let q = supabase.from('jobs').select('id,source,title,company,location,market,role_id,salary,url,posted_at').eq('active', true);
  const market = sp.get('market');
  const role = sp.get('role');
  if (market) q = q.eq('market', market);
  if (role) q = q.eq('role_id', role);
  const limit = Math.min(30, parseInt(sp.get('limit') || '6', 10) || 6);
  const { data, error } = await q.order('posted_at', { ascending: false, nullsFirst: false }).limit(limit);
  return NextResponse.json(
    { jobs: error ? [] : data ?? [] },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } }
  );
}
