import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { defaultModel } from '@/lib/ats/model';

export const dynamic = 'force-dynamic';

/** latest trained MEP LAB ATS model (public; the browser scores CVs with it) */
export async function GET() {
  let model = defaultModel();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('ats_models').select('model').order('id', { ascending: false }).limit(1).maybeSingle();
    if (data?.model?.weights) model = data.model;
  } catch {}
  return NextResponse.json(model, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
