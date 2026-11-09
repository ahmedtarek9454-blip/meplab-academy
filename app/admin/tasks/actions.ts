'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { parseQuiz } from '@/lib/tasks/quiz';
import { notifyStudentGraded } from '@/lib/email';

export async function saveTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const g = (k: string) => String(formData.get(k) ?? '').trim();
  const id = g('id'); const courseId = g('course_id');
  const back = `/admin/tasks?course=${courseId}`;
  const kind = g('kind') === 'quiz' ? 'quiz' : 'file';
  let quiz: any = null;
  if (kind === 'quiz') {
    const r = parseQuiz(g('quiz_text'));
    if (r.error || !r.quiz.length) redirect(`${back}&${id ? `edit=${id}&` : 'new=1&'}error=${encodeURIComponent(r.error || 'no questions')}`);
    quiz = r.quiz;
  }
  const row = {
    course_id: courseId, kind, quiz,
    title_ar: g('title_ar'), title_en: g('title_en') || null,
    desc_ar: g('desc_ar') || null, desc_en: g('desc_en') || null,
    max_score: Math.max(1, parseInt(g('max_score') || '10', 10) || 10),
    due_at: g('due_at') ? new Date(g('due_at')).toISOString() : null,
    sort_order: parseInt(g('sort_order') || '0', 10) || 0,
    published: formData.get('published') === 'on'
  };
  const { error } = id ? await supabase.from('course_tasks').update(row).eq('id', id) : await supabase.from('course_tasks').insert(row);
  if (error) redirect(`${back}&error=${encodeURIComponent(error.message)}`);
  revalidatePath('/courses', 'layout');
  redirect(back);
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || ''); const courseId = String(formData.get('course_id') || '');
  await supabase.from('course_tasks').delete().eq('id', id);
  revalidatePath('/courses', 'layout');
  redirect(`/admin/tasks?course=${courseId}`);
}

export async function gradeSubmission(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || '');
  const back = String(formData.get('back') || '/admin/tasks');
  const score = parseFloat(String(formData.get('score') || ''));
  const feedback = String(formData.get('feedback') || '').trim().slice(0, 2000) || null;
  const { error } = await supabase.from('task_submissions').update({
    score: Number.isFinite(score) ? score : null, feedback, status: 'graded', graded_at: new Date().toISOString()
  }).eq('id', id);
  if (error) redirect(`${back}${back.includes('?') ? '&' : '?'}error=${encodeURIComponent(error.message)}`);
  // best-effort email to the student (skipped when RESEND_API_KEY is not set)
  const { data: s } = await supabase.from('task_submissions').select('profiles(full_name, email), course_tasks(title_ar, max_score)').eq('id', id).maybeSingle();
  const pr: any = (s as any)?.profiles, tk: any = (s as any)?.course_tasks;
  if (pr?.email) await notifyStudentGraded({ to: pr.email, name: pr.full_name, task: tk?.title_ar || '', score: Number.isFinite(score) ? score : null, max: tk?.max_score || 10, feedback }).catch(() => {});
  revalidatePath('/courses', 'layout'); revalidatePath('/profile');
  redirect(back);
}

/** Reopen a graded submission so the student can resubmit. */
export async function reopenSubmission(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || '');
  const back = String(formData.get('back') || '/admin/tasks');
  await supabase.from('task_submissions').update({ status: 'submitted', graded_at: null }).eq('id', id);
  redirect(back);
}
