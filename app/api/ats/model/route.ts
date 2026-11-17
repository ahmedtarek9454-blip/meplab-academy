import { NextResponse } from 'next/server';
import { defaultModel } from '@/lib/ats/model';
import { trainModel } from '@/lib/ats/train';
import { getModel, setModel, trainingRows, jdPosts } from '@/lib/stats/store';

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
    if (age > DAY || saved?.score_v !== 2 || saved?.learn_v !== 2) {
      const rows = await trainingRows();
      const posts = await jdPosts().catch(() => []);
      if (rows.length >= MIN_CVS) {
        // job posts people pasted = what employers ask for; CVs = how people describe the same work
        const fresh = trainModel(posts.map((p) => ({ title: p.title || p.text.split('\n')[0], snippet: p.text, role_id: p.role_id, market: p.market })), rows, new Set());
        fresh.version = `cv-${new Date().toISOString().slice(0, 10)}-${rows.length}`;
        (fresh as any).score_v = 2; (fresh as any).learn_v = 2;
        await setModel(fresh); model = fresh;
      } else if (saved?.weights) {
        await setModel({ ...saved, trained_at: new Date().toISOString(), score_v: 2, learn_v: 2 });
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
