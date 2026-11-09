import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAllJobs } from './fetch';

const KEEP_DAYS = 30;

export async function refreshJobs() {
  const db = createAdminClient();
  const { jobs, errors, calls } = await fetchAllJobs();
  if (jobs.length) {
    const { error } = await db.from('jobs').upsert(jobs, { onConflict: 'id', ignoreDuplicates: false });
    if (error) throw new Error(error.message);
  }
  // remove old auto-fetched jobs (manual ones stay until you delete them)
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString();
  await db.from('jobs').delete().neq('source', 'manual').lt('fetched_at', cutoff);
  return { saved: jobs.length, calls, errors: errors.slice(0, 5) };
}
