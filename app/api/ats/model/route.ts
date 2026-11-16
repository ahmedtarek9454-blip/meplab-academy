import { NextResponse } from 'next/server';
import { defaultModel } from '@/lib/ats/model';
import { trainModel } from '@/lib/ats/train';
import { getModel, setModel, trainingRows } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DAY = 86400000;
const MIN_CVS = 20; // learn only once there are enough checked CVs

/** latest trained MEP LAB ATS model (public; the browser scores CVs with it).
 *  Retrains itself once a day from the anonymous signals of the CVs people checked. */
export async function GET() {
  let model: any = defaultModel();
  try {
    const saved = await getModel<any>();
    if (saved?.weights) model = saved;
    const age = saved?.trained_at ? Date.now() - Date.parse(saved.trained_at) : Infinity;
    if (age > DAY) {
      const rows = await trainingRows();
      if (rows.length >= MIN_CVS) {
        const fresh = trainModel([], rows, new Set());
        fresh.version = `cv-${new Date().toISOString().slice(0, 10)}-${rows.length}`;
        await setModel(fresh); model = fresh;
      } else if (saved?.weights) {
        await setModel({ ...saved, trained_at: new Date().toISOString() });
      }
    }
  } catch {}
  if (model.version === defaultModel().version) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data } = await supabase.from('ats_models').select('model').order('id', { ascending: false }).limit(1).maybeSingle();
      if (data?.model?.weights) model = data.model;
    } catch {}
  }
  return NextResponse.json(model, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
