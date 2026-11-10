import Link from 'next/link';
import { getT, L } from '@/lib/i18n';
import { requireUser } from '@/lib/auth';
import { ROLES, MARKETS, roleGroups, type Market } from '@/lib/cv/data';
import SubmitButton from '@/components/SubmitButton';
import { saveProfile, uploadCv, deleteCv } from './actions';

export const dynamic = 'force-dynamic';

export default async function Profile({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase, profile: p, user } = await requireUser('/profile');
  const { t, locale } = await getT();
  const ar = locale === 'ar';
  const role = ROLES.find((r) => r.id === p?.role_id), det = ROLES.find((r) => r.id === p?.detected_role);
  const initials = (p?.full_name || user!.email || '?').split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  // enrolled courses + tasks progress + saved CV link
  const [{ data: orders }, { data: subs }, cvUrl] = await Promise.all([
    supabase.from('orders').select('id, status, created_at, expires_at, courses(id, slug, title_ar, title_en, format, hours)').eq('user_id', user!.id).in('status', ['approved', 'pending']).order('created_at', { ascending: false }),
    supabase.from('task_submissions').select('id, task_id, status, score, submitted_at, course_tasks(title_ar, title_en, max_score, course_id)').eq('user_id', user!.id).order('submitted_at', { ascending: false }),
    p?.cv_path ? supabase.storage.from('cvs').createSignedUrl(p.cv_path, 600, { download: p.cv_name || undefined }).then((r: any) => r.data?.signedUrl as string | undefined) : Promise.resolve(undefined)
  ]);
  const enrolled = (orders ?? []).filter((o: any) => o.courses);
  const approvedIds = enrolled.filter((o: any) => o.status === 'approved').map((o: any) => o.courses.id);
  let taskTotals: Record<string, number> = {};
  if (approvedIds.length) {
    const { data: ts } = await supabase.from('course_tasks').select('id, course_id').in('course_id', approvedIds).eq('published', true);
    (ts ?? []).forEach((x: any) => { taskTotals[x.course_id] = (taskTotals[x.course_id] || 0) + 1; });
  }
  const subList = subs ?? [];
  const doneBy: Record<string, number> = {};
  subList.forEach((s: any) => { const cid = s.course_tasks?.course_id; if (cid) doneBy[cid] = (doneBy[cid] || 0) + 1; });

  const errMsg: Record<string, string> = { no_file: ar ? 'اختار ملف.' : 'Choose a file.', too_big: ar ? 'الملف أكبر من 10 ميجا.' : 'File is larger than 10 MB.', bad_type: ar ? 'PDF أو Word أو صورة بس.' : 'PDF, Word or image only.' };
  const F = ({ name, label, type = 'text', ltr = false, ph = '' }: any) => (
    <div><label className="label">{label}</label><input name={name} type={type} defaultValue={p?.[name] ?? ''} className="input" dir={ltr ? 'ltr' : 'auto'} placeholder={ph} /></div>
  );
  const fmtD = (d: string) => new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' });

  return (
    <section className="container-x max-w-5xl py-10">
      {sp.saved && <p className="mb-4 rounded-sheet bg-green-50 p-3 text-sm font-semibold text-green-800">✓ {ar ? 'اتحفظ' : 'Saved'}</p>}
      {sp.error && <p className="mb-4 rounded-sheet bg-red-50 p-3 text-sm font-semibold text-red-700">⚠️ {errMsg[sp.error] || sp.error}</p>}

      {/* header */}
      <div className="card overflow-hidden">
        <div className="relative bg-ink p-6 text-white md:p-8">
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sheet bg-ink text-white text-2xl font-bold" dir="ltr">{initials}</div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-extrabold" dir="auto">{p?.full_name || user!.email}</h1>
              <div className="mt-1 text-sm text-slate-300" dir="auto">{[p?.job_title, p?.company].filter(Boolean).join(' · ') || (role ? role[locale] : '')}</div>
              <div className="mt-1 text-xs text-slate-400" dir="ltr">{user!.email}{p?.phone ? ` · ${p.phone}` : ''}</div>
            </div>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-sheet bg-white/10 p-3"><div className="text-2xl font-bold">{p?.last_ats ?? '—'}</div><div className="text-[11px] text-slate-300">{ar ? 'آخر نتيجة ATS' : 'Last ATS'}</div></div>
            <div className="rounded-sheet bg-white/10 p-3"><div className="text-2xl font-bold">{p?.cv_checks ?? 0}</div><div className="text-[11px] text-slate-300">{ar ? 'مرات الفحص' : 'CV checks'}</div></div>
            <div className="rounded-sheet bg-white/10 p-3"><div className="text-2xl font-bold">{approvedIds.length}</div><div className="text-[11px] text-slate-300">{t.my_courses}</div></div>
            <div className="rounded-sheet bg-white/10 p-3"><div className="text-2xl font-bold">{subList.length}</div><div className="text-[11px] text-slate-300">{t.tasks_done}</div></div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="space-y-6">
          {/* my courses */}
          <div className="card p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-ink"> {t.my_courses}</h2><Link href="/dashboard" className="text-sm font-semibold text-brand-blue">{t.nav_dashboard} →</Link></div>
            {enrolled.length === 0 ? (
              <div className="mt-4 rounded-sheet bg-paper p-6 text-center text-ink-soft">{t.no_courses_yet} <Link href="/courses" className="font-bold text-brand-blue">{t.browse_courses}</Link></div>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {enrolled.map((o: any) => {
                  const c = o.courses; const tot = taskTotals[c.id] || 0; const dn = doneBy[c.id] || 0;
                  return (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <Link href={`/courses/${c.slug}`} className="font-bold text-ink hover:text-brand-blue">{L(c, 'title', locale)}</Link>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-ink-mute">
                          <span className="badge bg-red-50 text-brand-red">● {t.recorded_badge}</span>
                          {o.status === 'approved' ? <span className="badge bg-green-100 text-green-800">{t.status_approved}</span> : <span className="badge bg-amber-100 text-amber-800">{t.status_pending}</span>}
                          {o.expires_at && <span dir="ltr">{t.expires}: {o.expires_at}</span>}
                        </div>
                      </div>
                      {o.status === 'approved' && (
                        <div className="flex items-center gap-3">
                          {tot > 0 && <div className="text-xs font-semibold text-ink-soft" dir="ltr">{dn}/{tot} <span className="text-slate-400">{ar ? 'تاسك' : 'tasks'}</span></div>}
                          <Link href={`/courses/${c.slug}/tasks`} className="btn-blue btn-sm"> {t.go_tasks}</Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* my tasks */}
          {subList.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-ink"> {t.my_tasks}</h2>
              <div className="mt-3 divide-y divide-line text-sm">
                {subList.slice(0, 12).map((s: any) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="font-semibold text-ink-soft">{L(s.course_tasks, 'title', locale)} <span className="text-xs text-slate-400">· {fmtD(s.submitted_at)}</span></div>
                    {s.status === 'graded' ? <span className="badge bg-green-100 text-green-800" dir="ltr">{s.score}/{s.course_tasks?.max_score}</span> : <span className="badge bg-amber-100 text-amber-800">⏳ {t.waiting_grade}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* data form */}
          <form action={saveProfile} className="card grid gap-4 p-6 md:grid-cols-2">
            <h2 className="text-lg font-bold text-ink md:col-span-2"> {ar ? 'بياناتي' : 'My details'}</h2>
            <F name="full_name" label={ar ? 'الاسم بالكامل' : 'Full name'} />
            <F name="phone" label={ar ? 'رقم الموبايل (واتساب)' : 'Mobile (WhatsApp)'} ltr ph="+20 1xx xxx xxxx" />
            <div><label className="label">{ar ? 'التخصص' : 'Specialty'}</label>
              <select name="role_id" defaultValue={p?.role_id ?? ''} className="input"><option value="">—</option>{roleGroups(locale as 'ar' | 'en').map((g) => <optgroup key={g.id} label={g.label}>{g.roles.map((r) => <option key={r.id} value={r.id}>{r[locale as 'ar' | 'en']}</option>)}</optgroup>)}</select></div>
            <F name="years" label={ar ? 'سنين الخبرة' : 'Years of experience'} type="number" ltr />
            <div><label className="label">{ar ? 'بتدوّر على شغل في' : 'Looking for work in'}</label>
              <select name="market" defaultValue={p?.market ?? ''} className="input"><option value="">—</option>{(Object.keys(MARKETS) as Market[]).map((m) => <option key={m} value={m}>{MARKETS[m][ar ? 'name_ar' : 'name_en']}</option>)}</select></div>
            <F name="job_title" label={ar ? 'المسمى الوظيفي الحالي' : 'Current job title'} />
            <F name="company" label={ar ? 'الشركة الحالية' : 'Current company'} />
            <F name="linkedin" label="LinkedIn" ltr ph="linkedin.com/in/..." />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <SubmitButton className="btn-red px-6">{ar ? 'حفظ البروفايل' : 'Save profile'}</SubmitButton>
              <Link href="/cv-check" className="btn-ghost">{t.nav_cv}</Link>
            </div>
          </form>
        </div>

        {/* CV side */}
        <aside className="space-y-6">
          <div id="cv" className="card scroll-mt-24 p-6">
            <h2 className="text-lg font-bold text-ink"> {t.my_cv}</h2>
            {p?.cv_path ? (
              <div className="mt-3 rounded-sheet bg-paper p-4">
                <div className="truncate font-semibold text-ink-soft" dir="ltr">📎 {p.cv_name}</div>
                {p.cv_updated_at && <div className="mt-1 text-xs text-ink-mute">{t.cv_saved_at}: {fmtD(p.cv_updated_at)}</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {cvUrl && <a href={cvUrl} className="btn-blue btn-sm"> {t.cv_download}</a>}
                  <form action={deleteCv}><button className="btn-ghost btn-sm text-red-600">{t.cv_delete}</button></form>
                </div>
              </div>
            ) : <p className="mt-3 text-sm leading-6 text-ink-soft">{t.cv_none}</p>}
            <form action={uploadCv} className="mt-4 space-y-2">
              <label className="label">{t.cv_replace}</label>
              <input type="file" name="file" required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt" className="input" />
              <SubmitButton className="btn-ghost btn-sm w-full">{t.cv_upload_btn}</SubmitButton>
            </form>
            <div className="mt-4 rounded-sheet bg-green-50 p-3 text-sm">
              <div className="font-bold text-green-800">{t.nav_cv}</div>
              <div className="mt-1 text-ink-soft">{p?.last_ats != null ? `${ar ? 'آخر نتيجة' : 'Last score'}: ${p.last_ats}/100` : ar ? 'لسه ما فحصتش CV.' : 'No check yet.'}{det ? ` · ${det[locale].split(' / ')[0]}` : ''}</div>
              <Link href="/cv-check" className="mt-2 inline-block font-semibold text-green-700">{ar ? 'افحص / حدّث الـ CV' : 'Check / update CV'} →</Link>
            </div>
          </div>
        </aside>
      </div>
      {p?.last_check_at && <p className="mt-3 text-xs text-ink-mute" dir="ltr">{ar ? 'آخر فحص: ' : 'Last check: '}{new Date(p.last_check_at).toLocaleString('en-GB')}{p?.detected_years ? ` · ${ar ? 'الخبرة المحسوبة' : 'detected experience'}: ${p.detected_years} ${ar ? 'سنة' : 'yrs'}` : ''}</p>}
    </section>
  );
}
