'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { toSheet, normWhatsapp } from '@/lib/sheet';

export async function saveProfile(formData: FormData) {
  const { supabase, user } = await requireUser('/profile');
  const g = (k: string, n: number) => String(formData.get(k) || '').trim().slice(0, n) || null;
  const market = g('market', 2);
  const years = String(formData.get('years') || '').trim();
  const phone = normWhatsapp(String(formData.get('phone') || ''));
  const full_name = g('full_name', 80);
  if (!phone) redirect('/profile?error=phone');
  if (!full_name || full_name.length < 3) redirect('/profile?error=name');
  await supabase.from('profiles').update({
    full_name, phone, role_id: g('role_id', 40),
    market: market && ['eg', 'sa', 'ae'].includes(market) ? market : null,
    years: years ? Math.max(0, Math.min(50, parseFloat(years) || 0)) : null,
    job_title: g('job_title', 80), company: g('company', 80), linkedin: g('linkedin', 120),
    updated_at: new Date().toISOString()
  }).eq('id', user!.id);
  await toSheet({ event: 'profile', name: full_name, email: user!.email || '', whatsapp: phone, job_title: g('job_title', 80) });
  revalidatePath('/profile'); revalidatePath('/dashboard');
  const next = String(formData.get('next') || '');
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/profile?saved=1');
}

const MAX = 10 * 1024 * 1024;
const OK = /\.(pdf|docx?|png|jpe?g|webp|txt)$/i;

/** Upload / replace the member's saved CV from the profile page. */
export async function uploadCv(formData: FormData) {
  const { supabase, user } = await requireUser('/profile');
  const file = formData.get('file') as File | null;
  if (!file || !file.size) redirect('/profile?error=no_file');
  if (file!.size > MAX) redirect('/profile?error=too_big');
  if (!OK.test(file!.name)) redirect('/profile?error=bad_type');
  const { data: prev } = await supabase.from('profiles').select('cv_path').eq('id', user!.id).maybeSingle();
  const ext = (file!.name.match(/\.(\w+)$/)?.[1] || 'pdf').toLowerCase();
  const path = `${user!.id}/cv-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('cvs').upload(path, file!, { contentType: file!.type || 'application/octet-stream' });
  if (upErr) redirect(`/profile?error=${encodeURIComponent(upErr.message)}`);
  const now = new Date().toISOString();
  await supabase.from('profiles').update({ cv_path: path, cv_name: file!.name.slice(0, 120), cv_updated_at: now, updated_at: now }).eq('id', user!.id);
  if (prev?.cv_path) await supabase.storage.from('cvs').remove([prev.cv_path]).catch(() => {});
  revalidatePath('/profile');
  redirect('/profile?saved=1#cv');
}

export async function deleteCv() {
  const { supabase, user } = await requireUser('/profile');
  const { data: p } = await supabase.from('profiles').select('cv_path').eq('id', user!.id).maybeSingle();
  if (p?.cv_path) await supabase.storage.from('cvs').remove([p.cv_path]).catch(() => {});
  await supabase.from('profiles').update({ cv_path: null, cv_name: null, cv_updated_at: null }).eq('id', user!.id);
  revalidatePath('/profile');
  redirect('/profile#cv');
}

/** A student types the course code Hamada gave the class: they get the course and its tasks right away. */
export async function joinCourse(formData: FormData) {
  const { user, profile } = await requireUser('/profile');
  const code = String(formData.get('code') || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{4,24}$/.test(code)) redirect('/profile?error=code#join');
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  const { data: c } = await admin.from('course_codes').select('course_id, active, uses, courses(slug, title_ar)').eq('code', code).maybeSingle();
  if (!c || !c.active) redirect('/profile?error=code#join');
  const { data: has } = await admin.from('orders').select('id').eq('user_id', user!.id).eq('course_id', c!.course_id).eq('status', 'approved').maybeSingle();
  if (!has) {
    const { error } = await admin.from('orders').insert({ user_id: user!.id, course_id: c!.course_id, method: 'code', amount: 0, receipt_path: '', machine_code: '', status: 'approved', reviewed_at: new Date().toISOString(), admin_note: `code ${code}` });
    if (error) redirect('/profile?error=join#join');
    await admin.from('course_codes').update({ uses: (c!.uses || 0) + 1 }).eq('code', code);
    await toSheet({ event: 'course', name: profile?.full_name, email: user!.email || '', whatsapp: profile?.phone, course: (c as any).courses?.title_ar || '' });
  }
  revalidatePath('/profile'); revalidatePath('/dashboard');
  redirect(`/courses/${(c as any).courses?.slug}/tasks?joined=1`);
}
