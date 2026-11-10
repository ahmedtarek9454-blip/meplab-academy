import Link from 'next/link';
import { getT, L } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import { quizToText } from '@/lib/tasks/quiz';
import { saveTask, deleteTask, gradeSubmission, reopenSubmission } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminTasks({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t, locale } = await getT();
  const ar = locale === 'ar';

  const { data: courses } = await supabase.from('courses').select('id, slug, title_ar, title_en').order('sort_order');
  const cs = courses ?? [];
  const courseId = sp.course || cs[0]?.id || '';
  const back = `/admin/tasks?course=${courseId}`;

  const [{ data: tasks }, { data: subs }] = await Promise.all([
    courseId ? supabase.from('course_tasks').select('*').eq('course_id', courseId).order('sort_order').order('created_at') : Promise.resolve({ data: [] as any[] }),
    supabase.from('task_submissions').select('*, profiles(full_name, email, phone), course_tasks(title_ar, title_en, kind, max_score, course_id)').order('submitted_at', { ascending: false }).limit(200)
  ]);
  const list = tasks ?? [];
  const allSubs = (subs ?? []).filter((s: any) => !courseId || s.course_tasks?.course_id === courseId);
  const pendingSubs = allSubs.filter((s: any) => s.status !== 'graded');
  const gradedSubs = allSubs.filter((s: any) => s.status === 'graded').slice(0, 30);

  // signed download links for files
  const urls: Record<string, string> = {};
  await Promise.all(allSubs.filter((s: any) => s.file_path).map(async (s: any) => {
    const { data } = await supabase.storage.from('tasks').createSignedUrl(s.file_path, 3600);
    if (data?.signedUrl) urls[s.id] = data.signedUrl;
  }));

  const editing = sp.edit ? list.find((x: any) => x.id === sp.edit) : null;
  const showForm = !!editing || sp.new === '1' || !!sp.error;
  const tk: any = editing || {};
  const fmt = (d: string) => new Date(d).toLocaleString(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  const SubCard = ({ s }: { s: any }) => (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-bold text-ink">{s.profiles?.full_name || '—'}</div>
          <div className="text-xs text-ink-mute" dir="ltr">{s.profiles?.email}{s.profiles?.phone ? ` · ${s.profiles.phone}` : ''}</div>
          <div className="mt-1 text-sm font-semibold text-ink-soft">📝 {L(s.course_tasks, 'title', locale)} <span className="text-xs text-slate-400">· {t.task_attempt} {s.attempt} · {fmt(s.submitted_at)}</span></div>
        </div>
        <span className={`badge ${s.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{s.status === 'graded' ? `${t.task_graded} · ${s.score}/${s.course_tasks?.max_score}` : t.waiting_grade}</span>
      </div>
      {s.note && <p className="mt-2 rounded-lg bg-paper p-2 text-sm text-ink-soft">💬 {s.note}</p>}
      {s.file_path && (urls[s.id]
        ? <a href={urls[s.id]} target="_blank" rel="noopener" className="btn-blue btn-sm mt-3">⬇ {t.download_file} <span dir="ltr" className="font-mono text-xs">{s.file_name}</span></a>
        : <p className="mt-2 text-xs text-slate-400" dir="ltr">{s.file_name}</p>)}
      {s.course_tasks?.kind === 'quiz' && Array.isArray(s.answers) && <p className="mt-2 text-xs text-ink-mute" dir="ltr">answers: {s.answers.join(', ')}</p>}
      <form action={gradeSubmission} className="mt-4 grid gap-2 sm:grid-cols-[110px,1fr,auto]">
        <input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={back} />
        <input name="score" type="number" step="0.5" min="0" max={s.course_tasks?.max_score || 10} defaultValue={s.score ?? ''} required className="input" dir="ltr" placeholder={`/${s.course_tasks?.max_score}`} />
        <input name="feedback" defaultValue={s.feedback ?? ''} className="input" placeholder={t.task_feedback} />
        <SubmitButton className="btn-red btn-sm">{t.grade_btn}</SubmitButton>
      </form>
      {s.status === 'graded' && (
        <form action={reopenSubmission} className="mt-2"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="back" value={back} />
          <button className="text-xs font-semibold text-ink-mute hover:text-brand-blue">↺ {ar ? 'افتح لإعادة التسليم' : 'Reopen for resubmission'}</button></form>
      )}
    </div>
  );

  return (
    <section className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-section">{t.adm_tasks}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">{t.admin_title}</Link>
          <Link href="/admin/courses" className="btn-ghost">{t.manage_courses}</Link>
          {courseId && <Link href={`${back}&new=1`} className="btn-red">+ {t.new_task}</Link>}
        </div>
      </div>

      {/* course tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {cs.map((c: any) => (
          <Link key={c.id} href={`/admin/tasks?course=${c.id}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${c.id === courseId ? 'bg-ink text-white' : 'bg-white text-ink-soft ring-1 ring-line hover:bg-paper'}`}>{L(c, 'title', locale)}</Link>
        ))}
      </div>

      {showForm && (
        <form action={saveTask} className="card mt-6 space-y-4 p-6">
          <h2 className="text-lg font-bold text-ink">{editing ? t.edit_task : t.new_task}</h2>
          {sp.error && <p className="rounded-sheet bg-red-50 p-3 text-sm text-red-700" dir="ltr">{sp.error}</p>}
          <input type="hidden" name="id" value={tk.id ?? ''} /><input type="hidden" name="course_id" value={courseId} />
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">{t.task_title_ar} *</label><input name="title_ar" required defaultValue={tk.title_ar ?? ''} className="input" /></div>
            <div><label className="label">{t.task_title_en}</label><input name="title_en" defaultValue={tk.title_en ?? ''} className="input" dir="ltr" /></div>
            <div><label className="label">{t.task_desc_ar}</label><textarea name="desc_ar" rows={4} defaultValue={tk.desc_ar ?? ''} className="input" /></div>
            <div><label className="label">{t.task_desc_en}</label><textarea name="desc_en" rows={4} defaultValue={tk.desc_en ?? ''} className="input" dir="ltr" /></div>
            <div><label className="label">{t.task_kind}</label>
              <select name="kind" defaultValue={tk.kind ?? 'file'} className="input"><option value="file">📎 {t.task_kind_file}</option><option value="quiz">☑️ {t.task_kind_quiz}</option></select></div>
            <div><label className="label">{t.task_max}</label><input name="max_score" type="number" min="1" defaultValue={tk.max_score ?? 10} className="input" dir="ltr" /></div>
            <div><label className="label">{t.task_due_input}</label><input name="due_at" type="date" defaultValue={tk.due_at ? String(tk.due_at).slice(0, 10) : ''} className="input" dir="ltr" /></div>
            <div><label className="label">{t.sort_order}</label><input name="sort_order" type="number" defaultValue={tk.sort_order ?? list.length + 1} className="input" dir="ltr" /></div>
            <div className="md:col-span-2">
              <label className="label">{t.quiz_label} <span className="font-normal text-slate-400">({t.task_kind_quiz})</span></label>
              <textarea name="quiz_text" rows={8} defaultValue={quizToText(tk.quiz)} className="input font-mono text-sm" dir="auto" placeholder={'ما وحدة الضغط الاستاتيكي؟\n- m³/h\n* Pa\n- kW\n\nسؤال تاني...\n* ...'} />
              <p className="mt-1 text-xs text-ink-mute">{t.quiz_hint}</p>
            </div>
          </div>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="published" defaultChecked={tk.published ?? true} className="h-5 w-5" /> {t.published}</label>
          <div className="flex gap-2"><SubmitButton className="btn-blue">{t.save}</SubmitButton><Link href={back} className="btn-ghost">{t.cancel}</Link></div>
        </form>
      )}

      {/* tasks list */}
      <h2 className="mt-8 mb-3 text-xl font-bold text-ink">{t.tasks_title} ({list.length})</h2>
      {list.length === 0 ? <div className="card p-8 text-center text-ink-mute">{t.task_no_tasks}</div> : (
        <div className="card divide-y divide-line">
          {list.map((x: any, i: number) => {
            const n = allSubs.filter((s: any) => s.task_id === x.id).length;
            return (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-ink-soft">{i + 1}</span>
                  <div>
                    <div className="font-bold text-ink">{x.title_ar}</div>
                    <div className="text-xs text-ink-mute">{x.kind === 'quiz' ? `☑️ ${t.task_kind_quiz} · ${Array.isArray(x.quiz) ? x.quiz.length : 0} Q` : `📎 ${t.task_kind_file}`} · {x.max_score} pts · {n} {t.submissions}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${x.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-ink-soft'}`}>{x.published ? t.published : t.draft}</span>
                  <Link href={`${back}&edit=${x.id}`} className="btn-ghost btn-sm">{t.edit}</Link>
                  <form action={deleteTask}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="course_id" value={courseId} /><button className="btn-ghost btn-sm text-red-600">✕</button></form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* submissions */}
      <h2 className="mt-10 mb-3 text-xl font-bold text-ink">{t.waiting_grade} ({pendingSubs.length})</h2>
      {pendingSubs.length === 0 ? <div className="card p-8 text-center text-ink-mute">{t.no_submissions}</div> : <div className="grid gap-4 lg:grid-cols-2">{pendingSubs.map((s: any) => <SubCard key={s.id} s={s} />)}</div>}

      {gradedSubs.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-xl font-bold text-ink">{t.task_graded} ({gradedSubs.length})</h2>
          <div className="grid gap-4 lg:grid-cols-2">{gradedSubs.map((s: any) => <SubCard key={s.id} s={s} />)}</div>
        </>
      )}
    </section>
  );
}
