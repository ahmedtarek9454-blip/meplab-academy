'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { gradeQuiz, TASK_EXT, TASK_MAX_BYTES, type QuizQ } from '@/lib/tasks/quiz';

/** Member submits (or resubmits) an assignment: a file upload or quiz answers. */
export async function submitTask(formData: FormData) {
  const slug = String(formData.get('slug') || '');
  const taskId = String(formData.get('task_id') || '');
  const back = `/courses/${slug}/tasks`;
  const { supabase, user } = await requireUser(back);
  const fail = (msg: string) => redirect(`${back}?error=${encodeURIComponent(msg)}#task-${taskId}`);

  // task must be visible to this member (RLS: published + enrolled)
  const { data: task } = await supabase.from('course_tasks').select('*').eq('id', taskId).maybeSingle();
  if (!task) return fail('not_enrolled');

  const { data: prev } = await supabase.from('task_submissions').select('id, status, attempt, file_path').eq('task_id', taskId).eq('user_id', user!.id).maybeSingle();
  if (prev?.status === 'graded') return fail('graded');

  const row: Record<string, any> = {
    task_id: taskId, user_id: user!.id, status: 'submitted', submitted_at: new Date().toISOString(),
    note: String(formData.get('note') || '').trim().slice(0, 1000) || null,
    attempt: (prev?.attempt || 0) + 1, score: null, feedback: null, graded_at: null
  };

  if (task.kind === 'quiz') {
    const quiz: QuizQ[] = Array.isArray(task.quiz) ? task.quiz : [];
    const answers = quiz.map((_, i) => { const v = formData.get(`q${i}`); return v === null || v === '' ? null : parseInt(String(v), 10); });
    if (answers.some((a) => a === null)) return fail('pick_all');
    const g = gradeQuiz(quiz, answers, task.max_score || 10);
    Object.assign(row, { answers, score: g.score, status: 'graded', graded_at: new Date().toISOString() });
  } else {
    const file = formData.get('file') as File | null;
    if (!file || !file.size) return fail('no_file');
    if (file.size > TASK_MAX_BYTES) return fail('too_big');
    if (!TASK_EXT.test(file.name)) return fail('bad_type');
    const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = `${user!.id}/${taskId}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('tasks').upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (upErr) return fail(upErr.message);
    Object.assign(row, { file_path: path, file_name: file.name.slice(0, 120) });
    if (prev?.file_path) await supabase.storage.from('tasks').remove([prev.file_path]).catch(() => {});
  }

  const { error } = prev
    ? await supabase.from('task_submissions').update(row).eq('id', prev.id)
    : await supabase.from('task_submissions').insert(row);
  if (error) return fail(error.message);
  revalidatePath(back); revalidatePath('/profile'); revalidatePath('/dashboard');
  redirect(`${back}?sent=1#task-${taskId}`);
}
