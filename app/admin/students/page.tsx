import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import SubmitButton from '@/components/SubmitButton';
import { newCode, closeCode, addStudent } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

/** Course students: join codes, who is in each course, their WhatsApp, how many tasks they handed in */
export default async function Students({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: courses }, { data: codes }, { data: orders }, { data: subs }, { count: members }] = await Promise.all([
    admin.from('courses').select('id, slug, title_ar').order('sort_order'),
    admin.from('course_codes').select('*').eq('active', true),
    admin.from('orders').select('user_id, course_id, method, created_at, profiles(full_name, email, phone)').eq('status', 'approved').order('created_at', { ascending: false }),
    admin.from('task_submissions').select('user_id, status, course_tasks(course_id)'),
    admin.from('profiles').select('id', { count: 'exact', head: true })
  ]);
  const done = (uid: string, cid: string) => (subs ?? []).filter((s: any) => s.user_id === uid && s.course_tasks?.course_id === cid).length;
  const fmt = (d: string) => new Date(d).toLocaleDateString('ar-EG', { dateStyle: 'medium' });

  return (
    <section className="container-x py-10" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h-section">طلاب الكورسات</h1>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/members.csv" className="btn-blue">تحميل كل الأعضاء ({members ?? 0}) Excel</a>
          <Link href="/admin/tasks" className="btn-ghost">التاسكات والتصحيح</Link>
          <Link href="/admin" className="btn-ghost">لوحة الأدمن</Link>
        </div>
      </div>
      {sp.error && <p className="mt-4 rounded-sheet bg-red-50 p-3 text-sm font-semibold text-red-700">{sp.error}</p>}
      {sp.code && <p className="mt-4 rounded-sheet border border-ink p-3 text-sm font-semibold">الكود الجديد: <span dir="ltr" className="font-mono text-lg">{sp.code}</span> ابعته في جروب الكورس، والطالب يكتبه في البروفايل بتاعه.</p>}
      {sp.added && <p className="mt-4 rounded-sheet bg-green-50 p-3 text-sm font-semibold text-green-800">اتضاف للكورس.</p>}

      {(courses ?? []).map((c: any) => {
        const code = (codes ?? []).find((x: any) => x.course_id === c.id);
        const st = (orders ?? []).filter((o: any) => o.course_id === c.id);
        return (
          <div key={c.id} className="card mt-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">{c.title_ar} <span className="text-sm font-normal text-ink-mute">· {st.length} طالب</span></h2>
              <div className="flex flex-wrap items-center gap-2">
                {code ? <span className="rounded-sheet border border-line px-3 py-1.5 font-mono text-sm" dir="ltr">{code.code} <span className="text-ink-mute">({code.uses})</span></span> : <span className="text-sm text-ink-mute">مفيش كود شغال</span>}
                <form action={newCode}><input type="hidden" name="course_id" value={c.id} /><input type="hidden" name="slug" value={c.slug} /><SubmitButton className="btn-ghost btn-sm">{code ? 'كود جديد' : 'اعمل كود'}</SubmitButton></form>
                {code && <form action={closeCode}><input type="hidden" name="code" value={code.code} /><SubmitButton className="btn-ghost btn-sm">اقفل الكود</SubmitButton></form>}
              </div>
            </div>
            <form action={addStudent} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="course_id" value={c.id} />
              <input name="email" type="email" required placeholder="إيميل الطالب (لازم يكون عامل حساب)" className="input max-w-sm" dir="ltr" />
              <SubmitButton className="btn-ghost btn-sm">ضيفه للكورس</SubmitButton>
            </form>
            {st.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-line text-ink-mute"><tr>{['الاسم', 'الإيميل', 'واتساب', 'دخل عن طريق', 'من يوم', 'سلّم تاسكات'].map((h) => <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>)}</tr></thead>
                  <tbody>
                    {st.map((o: any) => (
                      <tr key={o.user_id} className="border-b border-line last:border-0">
                        <td className="px-3 py-2" dir="auto">{o.profiles?.full_name || '—'}</td>
                        <td className="px-3 py-2" dir="ltr">{o.profiles?.email}</td>
                        <td className="px-3 py-2" dir="ltr">{o.profiles?.phone ? <a className="text-brand-blue" href={`https://wa.me/${o.profiles.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener">{o.profiles.phone}</a> : '—'}</td>
                        <td className="px-3 py-2">{o.method === 'code' ? 'الكود' : o.method === 'manual' ? 'إنت ضفته' : 'دفع'}</td>
                        <td className="px-3 py-2">{fmt(o.created_at)}</td>
                        <td className="px-3 py-2 tabular-nums">{done(o.user_id, c.id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
