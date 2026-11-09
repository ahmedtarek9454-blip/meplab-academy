import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT, L } from '@/lib/i18n';
import { requireUser } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import { submitTask } from './actions';
import type { QuizQ } from '@/lib/tasks/quiz';

export const dynamic = 'force-dynamic';

export default async function CourseTasks({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireUser(`/courses/${slug}/tasks`);
  const { t, locale } = await getT();
  const ar = locale === 'ar';

  const { data: c } = await supabase.from('courses').select('id, slug, title_ar, title_en').eq('slug', slug).maybeSingle();
  if (!c) notFound();
  const { data: order } = await supabase.from('orders').select('status').eq('user_id', user!.id).eq('course_id', c.id).eq('status', 'approved').limit(1).maybeSingle();
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;

  if (!order) {
    return (
      <section className="container-x max-w-2xl py-14 text-center">
        <div className="card p-10">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-extrabold text-brand-navy">{t.task_not_enrolled}</h1>
          <p className="mt-2 text-slate-600">{L(c, 'title', locale)}</p>
          <Link href={`/courses/${slug}`} className="btn-red mt-6">{t.enroll}</Link>
        </div>
      </section>
    );
  }

  const [{ data: tasks }, { data: subs }] = await Promise.all([
    supabase.from('course_tasks').select('*').eq('course_id', c.id).eq('published', true).order('sort_order').order('created_at'),
    supabase.from('task_submissions').select('*').eq('user_id', user!.id)
  ]);
  const byTask: Record<string, any> = {};
  (subs ?? []).forEach((s: any) => { byTask[s.task_id] = s; });
  const list = tasks ?? [];
  const done = list.filter((x: any) => byTask[x.id]).length;

  const errMsg: Record<string, string> = {
    not_enrolled: t.task_not_enrolled, graded: ar ? 'التاسك ده اتصحّح خلاص.' : 'This assignment is already graded.',
    pick_all: t.task_pick_all, no_file: t.task_file, too_big: t.task_too_big, bad_type: t.task_file_hint
  };
  const fmt = (d: string) => new Date(d).toLocaleString(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <section className="container-x max-w-4xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t.tasks_title}</p>
          <h1 className="text-2xl font-extrabold text-brand-navy">{L(c, 'title', locale)}</h1>
        </div>
        <div className="text-sm font-semibold text-slate-600">{done} {t.tasks_done} {t.tasks_total} {list.length}</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-green-500 transition-all" style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} /></div>

      {sp.sent && <p className="mt-4 rounded-xl bg-green-50 p-3 font-semibold text-green-800">{t.task_sent}</p>}
      {sp.error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">⚠️ {errMsg[sp.error] || sp.error}</p>}

      {list.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-600">{t.task_no_tasks}</div>
      ) : (
        <div className="mt-6 space-y-5">
          {list.map((task: any, i: number) => {
            const s = byTask[task.id];
            const quiz: QuizQ[] = Array.isArray(task.quiz) ? task.quiz : [];
            const graded = s?.status === 'graded';
            const canSubmit = !graded;
            return (
              <div key={task.id} id={`task-${task.id}`} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy font-black text-white">{i + 1}</span>
                    <div>
                      <h2 className="text-lg font-bold text-brand-navy">{L(task, 'title', locale)}</h2>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="badge bg-slate-100 text-slate-600">{task.kind === 'quiz' ? '☑️ ' + t.task_kind_quiz : '📎 ' + t.task_kind_file}</span>
                        <span className="badge bg-slate-100 text-slate-600" dir="ltr">{task.max_score} pts</span>
                        {task.due_at && <span className="badge bg-amber-50 text-amber-700">{t.task_due}: {new Date(task.due_at).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}</span>}
                      </div>
                    </div>
                  </div>
                  {s ? (
                    graded ? <span className="badge bg-green-100 text-green-800">✓ {t.task_graded} · {t.task_score}: <b dir="ltr">{s.score}/{task.max_score}</b></span>
                      : <span className="badge bg-amber-100 text-amber-800">⏳ {t.task_submitted}</span>
                  ) : <span className="badge bg-slate-100 text-slate-600">—</span>}
                </div>

                <div className="p-5">
                  {L(task, 'desc', locale) && <p className="whitespace-pre-line leading-7 text-slate-700">{L(task, 'desc', locale)}</p>}

                  {/* previous submission */}
                  {s && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                      <div className="text-xs text-slate-500" dir="ltr">{t.task_attempt} {s.attempt} · {fmt(s.submitted_at)}</div>
                      {s.file_name && <div className="mt-1 font-semibold text-slate-700">📎 {t.task_your_file}: <span dir="ltr">{s.file_name}</span></div>}
                      {s.note && <div className="mt-1 text-slate-600">💬 {s.note}</div>}
                      {task.kind === 'quiz' && graded && Array.isArray(s.answers) && (
                        <ul className="mt-3 space-y-1.5">
                          {quiz.map((q, qi) => {
                            const ok = s.answers[qi] === q.answer;
                            return <li key={qi} className={`rounded-lg px-3 py-2 ${ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{ok ? '✓' : '✗'} {q.q} <span className="text-xs opacity-70">— {ok ? t.task_correct : `${t.task_wrong} · ${q.options[q.answer]}`}</span></li>;
                          })}
                        </ul>
                      )}
                      {graded && s.feedback && (
                        <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
                          <div className="text-xs font-bold text-green-700">{t.task_feedback}</div>
                          <p className="mt-1 whitespace-pre-line leading-6 text-slate-700">{s.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* submit form */}
                  {canSubmit && (
                    <form action={submitTask} className="mt-4 space-y-3">
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="task_id" value={task.id} />
                      {task.kind === 'quiz' ? (
                        <>
                          <p className="text-sm font-semibold text-slate-600">{t.task_quiz} <span className="font-normal text-slate-400">· {t.task_answers_hint}</span></p>
                          <ol className="space-y-3">
                            {quiz.map((q, qi) => (
                              <li key={qi} className="rounded-xl border border-slate-200 p-4">
                                <div className="font-semibold text-brand-navy">{qi + 1}. {q.q}</div>
                                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                  {q.options.map((o, oi) => (
                                    <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                                      <input type="radio" name={`q${qi}`} value={oi} required className="h-4 w-4" /> {o}
                                    </label>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </>
                      ) : (
                        <div>
                          <label className="label">{t.task_file}</label>
                          <input type="file" name="file" required className="input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rvt,.rfa,.dwg,.dxf,.nwc,.nwd,.ifc,.zip,.rar,.7z,.png,.jpg,.jpeg,.webp,.txt,.csv" />
                          <p className="mt-1 text-xs text-slate-500" dir="ltr">{t.task_file_hint}</p>
                        </div>
                      )}
                      <div>
                        <label className="label">{t.task_note}</label>
                        <input name="note" className="input" maxLength={1000} />
                      </div>
                      <SubmitButton className="btn-red">{s ? t.task_resubmit : t.task_submit}</SubmitButton>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/courses/${slug}`} className="btn-ghost">← {L(c, 'title', locale)}</Link>
        <Link href="/profile" className="btn-ghost">👤 {t.nav_profile}</Link>
        {wa && <a href={`https://wa.me/${wa}`} target="_blank" className="btn bg-green-600 text-white hover:bg-green-700">{t.need_help}</a>}
      </div>
    </section>
  );
}
