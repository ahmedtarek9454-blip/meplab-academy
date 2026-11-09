'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { refreshJobs } from '@/lib/jobs/refresh';

export async function refreshNow() {
  await requireAdmin();
  let msg = '';
  try {
    const r = await refreshJobs();
    msg = `ok:${r.saved}${r.errors.length ? `:${encodeURIComponent(r.errors[0])}` : ''}`;
  } catch (e: any) {
    msg = `err:${encodeURIComponent(e.message)}`;
  }
  revalidatePath('/jobs');
  redirect(`/admin/jobs?r=${msg}`);
}

export async function addJob(formData: FormData) {
  const { supabase } = await requireAdmin();
  const g = (k: string) => String(formData.get(k) || '').trim();
  const url = g('url');
  if (!g('title') || !/^https?:\/\//.test(url)) redirect('/admin/jobs?r=err:missing');
  await supabase.from('jobs').insert({
    id: `manual:${crypto.randomUUID()}`,
    source: 'manual',
    title: g('title'),
    company: g('company') || null,
    location: g('location') || null,
    market: g('market') || 'eg',
    role_id: g('role') || null,
    url,
    posted_at: new Date().toISOString()
  });
  revalidatePath('/jobs');
  redirect('/admin/jobs');
}

export async function toggleJob(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('jobs').update({ active: formData.get('active') === '1' }).eq('id', String(formData.get('id')));
  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');
}

export async function deleteJob(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('jobs').delete().eq('id', String(formData.get('id')));
  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');
}
