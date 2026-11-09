import { createAdminClient } from '@/lib/supabase/admin';
import { trainModel } from './train';

/** train on the last 90 days of collected job posts and save a new model version */
export async function trainAndSave() {
  const db = createAdminClient();
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('jobs').select('title, snippet, role_id, market, salary').gte('fetched_at', since).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000 || rows.length >= 20000) break;
  }
  const model = trainModel(rows);
  const { error } = await db.from('ats_models').insert({ version: model.version, jobs_used: model.jobs_used, model });
  if (error) throw new Error(error.message);
  // keep the last 10 versions
  const { data: old } = await db.from('ats_models').select('id').order('id', { ascending: false }).range(10, 100);
  if (old?.length) await db.from('ats_models').delete().in('id', old.map((o: any) => o.id));
  return { version: model.version, jobs_used: model.jobs_used };
}
