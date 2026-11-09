'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeMachineCode } from '@/lib/license';
import { notifyAdminNewOrder } from '@/lib/email';

const MAX = 5 * 1024 * 1024;
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export async function submitOrder(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout/${slug}`);

  const method = String(formData.get('method') || '');
  const machine = normalizeMachineCode(String(formData.get('machine_code') || ''));
  const senderRef = String(formData.get('sender_ref') || '').trim();
  const file = formData.get('receipt') as File | null;

  const bad = () => redirect(`/checkout/${slug}?error=1`);
  if (!['instapay', 'vodafone_cash'].includes(method) || machine.length < 6 || !senderRef) bad();
  if (!file || file.size === 0 || file.size > MAX || !OK_TYPES.includes(file.type)) bad();

  const { data: course } = await supabase.from('courses').select('id, price_egp, title_ar').eq('slug', slug).eq('published', true).maybeSingle();
  if (!course) redirect('/courses');

  // prevent duplicate open orders
  const { data: dup } = await supabase.from('orders').select('id').eq('user_id', user.id).eq('course_id', course.id)
    .in('status', ['pending', 'approved']).limit(1);
  if (dup && dup.length) redirect('/dashboard');

  const ext = (file!.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('receipts').upload(path, file!, { contentType: file!.type });
  if (upErr) bad();

  const { error } = await supabase.from('orders').insert({
    user_id: user.id,
    course_id: course.id,
    method,
    amount: course.price_egp,
    sender_ref: senderRef,
    receipt_path: path,
    machine_code: machine
  });
  if (error) bad();

  // email the admin (optional — skipped if RESEND_API_KEY is not set)
  const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
  await notifyAdminNewOrder({ student: prof?.full_name || user.email || '', email: user.email || '', phone: prof?.phone, course: course.title_ar, amount: course.price_egp, method });

  redirect('/dashboard?sent=1');
}
