'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { generateActivationCode } from '@/lib/license';
import { notifyStudentApproved, notifyStudentRejected, notifyWaitlistLaunch } from '@/lib/email';

export async function approveOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const { data: o } = await supabase.from('orders').select('*, courses(id, access_days, title_ar, product_key), profiles(email, full_name)').eq('id', id).maybeSingle();
  if (!o || o.status !== 'pending') return;

  const days = o.courses?.access_days;
  const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 10) : null;
  const code = generateActivationCode({ machineCode: o.machine_code, courseId: o.courses?.product_key || o.course_id, expiresAt });

  await supabase.from('orders').update({
    status: 'approved',
    activation_code: code,
    expires_at: expiresAt,
    reviewed_at: new Date().toISOString()
  }).eq('id', id);
  await notifyStudentApproved({ to: o.profiles?.email, name: o.profiles?.full_name, course: o.courses?.title_ar, code, expires: expiresAt });
  revalidatePath('/admin');
}

export async function rejectOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const note = String(formData.get('note') || '').trim() || null;
  const { data: o } = await supabase.from('orders').select('status, courses(title_ar), profiles(email, full_name)').eq('id', id).maybeSingle();
  if (!o || o.status !== 'pending') return;
  await supabase.from('orders').update({ status: 'rejected', admin_note: note, reviewed_at: new Date().toISOString() }).eq('id', id);
  const p: any = o.profiles, c: any = o.courses;
  await notifyStudentRejected({ to: p?.email, name: p?.full_name, course: c?.title_ar, note });
  revalidatePath('/admin');
}

export async function saveCourse(formData: FormData) {
  const { supabase } = await requireAdmin();
  const g = (k: string) => String(formData.get(k) ?? '').trim();
  const id = g('id');
  const row = {
    slug: g('slug').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
    title_ar: g('title_ar'),
    title_en: g('title_en'),
    desc_ar: g('desc_ar') || null,
    desc_en: g('desc_en') || null,
    curriculum_ar: g('curriculum_ar') || null,
    curriculum_en: g('curriculum_en') || null,
    price_egp: parseInt(g('price_egp') || '0', 10) || 0,
    access_days: g('access_days') ? parseInt(g('access_days'), 10) : null,
    cover_url: g('cover_url') || null,
    download_url: g('download_url') || null,
    product_key: g('product_key') || null,
    preview_url: g('preview_url') || null,
    published: formData.get('published') === 'on',
    sort_order: parseInt(g('sort_order') || '0', 10) || 0,
    format: g('format') === 'live' ? 'live' : 'recorded',
    status: g('status') === 'soon' ? 'soon' : 'available',
    level: ['beginner', 'intermediate', 'advanced'].includes(g('level')) ? g('level') : 'beginner',
    hours: g('hours') ? parseFloat(g('hours')) || null : null,
    software: g('software') || null,
    outcomes_ar: g('outcomes_ar') || null,
    outcomes_en: g('outcomes_en') || null,
    audience_ar: g('audience_ar') || null,
    audience_en: g('audience_en') || null
  };
  const { error } = id
    ? await supabase.from('courses').update(row).eq('id', id)
    : await supabase.from('courses').insert(row);
  if (error) redirect(`/admin/courses?${id ? `edit=${id}&` : ''}error=${encodeURIComponent(error.message)}`);
  revalidateTag('courses');
  revalidatePath('/', 'layout');
  redirect('/admin/courses');
}

/* ---------- device transfer requests (from MEP LAB Player) ---------- */
export async function approveDevice(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const { data: r } = await supabase.from('device_requests').select('*, orders(id, course_id, expires_at, device_changes, courses(title_ar, product_key)), profiles(email, full_name)').eq('id', id).maybeSingle();
  if (!r || r.status !== 'pending') return;
  const o: any = r.orders;
  const code = generateActivationCode({ machineCode: r.new_machine, courseId: o?.courses?.product_key || o?.course_id, expiresAt: o?.expires_at ?? null });
  await supabase.from('orders').update({ machine_code: r.new_machine, activation_code: code, device_changes: (o?.device_changes || 0) + 1 }).eq('id', r.order_id);
  await supabase.from('device_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
  const p: any = r.profiles;
  await notifyStudentApproved({ to: p?.email, name: p?.full_name, course: o?.courses?.title_ar, code, expires: o?.expires_at });
  revalidatePath('/admin');
}

export async function rejectDevice(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('device_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', String(formData.get('id'))).eq('status', 'pending');
  revalidatePath('/admin');
}

/* ---------- waitlist: email everyone waiting for a course that is now available ---------- */
export async function notifyWaitlist(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('course_id') || '');
  const { data: c } = await supabase.from('courses').select('id, slug, title_ar, status').eq('id', id).maybeSingle();
  if (!c || c.status !== 'available') redirect('/admin/courses?error=' + encodeURIComponent('خلّي الكورس "متاح" الأول وبعدين ابعت.'));
  const { data: list } = await supabase.from('course_waitlist').select('id, email').eq('course_id', id).is('notified_at', null).limit(500);
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  let sent = 0;
  for (const w of list ?? []) {
    const ok = await notifyWaitlistLaunch({ to: w.email, course: c!.title_ar, url: `${site}/courses/${c!.slug}` }).catch(() => false);
    if (ok !== false) { await supabase.from('course_waitlist').update({ notified_at: new Date().toISOString() }).eq('id', w.id); sent++; }
  }
  revalidatePath('/admin/courses');
  redirect(`/admin/courses?notified=${sent}`);
}
