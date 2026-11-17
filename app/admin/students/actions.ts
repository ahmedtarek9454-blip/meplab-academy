'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { toSheet } from '@/lib/sheet';

const back = (q = '') => { revalidatePath('/admin/students'); redirect(`/admin/students${q}`); };

/** a new code for a course; the old one stops working */
export async function newCode(fd: FormData) {
  await requireAdmin();
  const course_id = String(fd.get('course_id') || '');
  const slug = String(fd.get('slug') || 'COURSE').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14) || 'COURSE';
  const code = `${slug}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const admin = createAdminClient();
  await admin.from('course_codes').update({ active: false }).eq('course_id', course_id);
  const { error } = await admin.from('course_codes').insert({ code, course_id, active: true });
  back(error ? `?error=${encodeURIComponent(error.message)}` : `?code=${code}`);
}

export async function closeCode(fd: FormData) {
  await requireAdmin();
  await createAdminClient().from('course_codes').update({ active: false }).eq('code', String(fd.get('code') || ''));
  back();
}

/** add a student who already has an account, by e-mail */
export async function addStudent(fd: FormData) {
  await requireAdmin();
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const course_id = String(fd.get('course_id') || '');
  const admin = createAdminClient();
  const { data: p } = await admin.from('profiles').select('id, full_name, phone').ilike('email', email).maybeSingle();
  if (!p) back(`?error=${encodeURIComponent('مفيش حساب بالإيميل ده. خلّيه يعمل حساب الأول من meplab.net/signup')}`);
  const { data: has } = await admin.from('orders').select('id').eq('user_id', p!.id).eq('course_id', course_id).eq('status', 'approved').maybeSingle();
  if (!has) {
    const { error } = await admin.from('orders').insert({ user_id: p!.id, course_id, method: 'manual', amount: 0, receipt_path: '', machine_code: '', status: 'approved', reviewed_at: new Date().toISOString(), admin_note: 'added by admin' });
    if (error) back(`?error=${encodeURIComponent(error.message)}`);
    const { data: c } = await admin.from('courses').select('title_ar').eq('id', course_id).maybeSingle();
    await toSheet({ event: 'course', name: p!.full_name, email, whatsapp: p!.phone, course: c?.title_ar || '' });
  }
  back('?added=1');
}
