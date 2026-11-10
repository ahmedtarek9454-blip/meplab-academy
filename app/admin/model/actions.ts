'use server';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { trainAndSave } from '@/lib/ats/store';
import { cleanTerm } from '@/lib/ats/learn';

export async function trainNow() {
  await requireAdmin();
  let r = '';
  try { const x = await trainAndSave(); r = `ok:${x.version}:${x.jobs_used}`; }
  catch (e: any) { r = `err:${encodeURIComponent(e.message)}`; }
  redirect(`/admin/model?r=${r}`);
}

/** stop the engine from using a learned word (then retrain) */
export async function blockTerm(fd: FormData) {
  const { supabase } = await requireAdmin();
  const term = cleanTerm(String(fd.get('term') || ''));
  if (term) await supabase.from('ats_term_blocks').upsert({ term });
  let r = '';
  try { const x = await trainAndSave(); r = `ok:${x.version}:${x.jobs_used}`; }
  catch (e: any) { r = `err:${encodeURIComponent(e.message)}`; }
  redirect(`/admin/model?r=${r}`);
}
