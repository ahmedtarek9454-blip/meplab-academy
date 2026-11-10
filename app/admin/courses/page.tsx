import Link from 'next/link';
import { getT, L } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import { saveCourse, notifyWaitlist } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminCourses({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { t, locale } = await getT();
  const { data } = await supabase.from('courses').select('*').order('sort_order');
  const courses = data ?? [];
  const { data: wl } = await supabase.from('course_waitlist').select('course_id, notified_at');
  const waiting = (id: string) => (wl ?? []).filter((w: any) => w.course_id === id && !w.notified_at).length;
  const ar = locale === 'ar';
  const editing = sp.edit ? courses.find((c: any) => c.id === sp.edit) : null;
  const showForm = !!editing || sp.new === '1' || !!sp.error;
  const c: any = editing || {};

  const F = ({ name, label, type = 'text', ltr = false, required = false }: any) => (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} defaultValue={c[name] ?? ''} required={required} className="input" dir={ltr ? 'ltr' : undefined} />
    </div>
  );
  const A = ({ name, label, rows = 4, ltr = false }: any) => (
    <div>
      <label className="label">{label}</label>
      <textarea name={name} rows={rows} defaultValue={c[name] ?? ''} className="input" dir={ltr ? 'ltr' : undefined} />
    </div>
  );

  return (
    <section className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-section">{t.manage_courses}</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-ghost">{t.admin_title}</Link>
          <Link href="/admin/courses?new=1" className="btn-red">+ {t.new_course}</Link>
        </div>
      </div>

      {showForm && (
        <form action={saveCourse} className="card mt-6 space-y-4 p-6">
          <h2 className="text-lg font-bold text-ink">{editing ? t.edit_course : t.new_course}</h2>
          {sp.error && <p className="rounded-sheet bg-red-50 p-3 text-sm text-red-700" dir="ltr">{sp.error}</p>}
          <input type="hidden" name="id" value={c.id ?? ''} />
          <div className="grid gap-4 md:grid-cols-2">
            <F name="title_ar" label={t.title_ar} required />
            <F name="title_en" label={t.title_en} required ltr />
            <F name="slug" label={t.slug} required ltr />
            <F name="price_egp" label={t.price_egp} type="number" required ltr />
            <F name="access_days" label={t.access_days} type="number" ltr />
            <F name="sort_order" label={t.sort_order} type="number" ltr />
            <F name="cover_url" label={t.cover_url} ltr />
            <F name="preview_url" label={t.preview_url} ltr />
            <F name="download_url" label={t.download_url} ltr />
            <F name="product_key" label={t.product_key} ltr />
            <A name="desc_ar" label={t.desc_ar} />
            <A name="desc_en" label={t.desc_en} ltr />
            <A name="curriculum_ar" label={t.curr_ar} rows={7} />
            <A name="curriculum_en" label={t.curr_en} rows={7} ltr />
            <A name="outcomes_ar" label={`${t.outcomes_title} (AR)`} rows={4} />
            <A name="outcomes_en" label={`${t.outcomes_title} (EN)`} rows={4} ltr />
            <A name="audience_ar" label={`${t.audience_title} (AR)`} rows={3} />
            <A name="audience_en" label={`${t.audience_title} (EN)`} rows={3} ltr />
            <div><label className="label">{locale === 'ar' ? 'حالة الكورس' : 'Course status'}</label>
              <select name="status" defaultValue={c.status ?? 'available'} className="input"><option value="available">{locale === 'ar' ? 'متاح للاشتراك' : 'Available'}</option><option value="soon">{locale === 'ar' ? 'قريبًا (بلّغني)' : 'Coming soon (waitlist)'}</option></select></div>
            <div><label className="label">Format</label>
              <select name="format" defaultValue={c.format ?? 'recorded'} className="input"><option value="recorded">{t.recorded_badge}</option><option value="live">Live</option></select></div>
            <div><label className="label">{t.level}</label>
              <select name="level" defaultValue={c.level ?? 'beginner'} className="input"><option value="beginner">{t.level_beginner}</option><option value="intermediate">{t.level_intermediate}</option><option value="advanced">{t.level_advanced}</option></select></div>
            <F name="hours" label={t.video_hours} type="number" ltr />
            <F name="software" label={t.software_label} ltr />
          </div>
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" name="published" defaultChecked={c.published ?? true} className="h-5 w-5" /> {t.published}
          </label>
          <div className="flex gap-2">
            <SubmitButton className="btn-blue">{t.save}</SubmitButton>
            <Link href="/admin/courses" className="btn-ghost">{t.cancel}</Link>
          </div>
        </form>
      )}

      {sp.notified && <p className="mt-4 rounded-sheet bg-green-50 p-3 text-sm text-green-800">{ar ? `اتبعت لـ ${sp.notified} شخص.` : `Sent to ${sp.notified} people.`}</p>}
      <div className="card mt-6 divide-y divide-line">
        {courses.map((x: any) => (
          <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-bold text-ink">{L(x, 'title', locale)}</div>
              <div className="text-xs text-ink-mute" dir="ltr">/courses/{x.slug} · {x.price_egp} EGP</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${x.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-ink-soft'}`}>{x.published ? t.published : t.draft}</span>
              <span className={`badge ${x.status === 'soon' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-brand-blue'}`}>{x.status === 'soon' ? (ar ? 'قريبًا' : 'Soon') : (ar ? 'متاح' : 'Available')}</span>
              {waiting(x.id) > 0 && <span className="badge bg-paper text-ink-soft ring-1 ring-line">{waiting(x.id)} {ar ? 'مستني' : 'waiting'}</span>}
              {waiting(x.id) > 0 && x.status === 'available' && (
                <form action={notifyWaitlist}><input type="hidden" name="course_id" value={x.id} /><SubmitButton className="btn-red btn-sm">{ar ? 'ابعت لهم إن الكورس نزل' : 'Email the waitlist'}</SubmitButton></form>
              )}
              <Link href={`/admin/tasks?course=${x.id}`} className="btn-ghost btn-sm">📝 {t.tasks_title}</Link>
              <Link href={`/admin/courses?edit=${x.id}`} className="btn-ghost btn-sm">{t.edit}</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
