'use server';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { trainAndSave } from '@/lib/ats/store';

export async function trainNow() {
  await requireAdmin();
  let r = '';
  try { const x = await trainAndSave(); r = `ok:${x.version}:${x.jobs_used}`; }
  catch (e: any) { r = `err:${encodeURIComponent(e.message)}`; }
  redirect(`/admin/model?r=${r}`);
}
