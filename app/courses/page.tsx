import { getT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/CourseCard';

export default async function Courses() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('*').eq('published', true).order('sort_order');
  const courses = data ?? [];
  return (
    <section className="container-x py-12">
      <h1 className="h-section mb-8">{t.all_courses}</h1>
      {courses.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => <CourseCard key={c.id} c={c} locale={locale} t={t} i={i} />)}
        </div>
      ) : (
        <div className="card p-8 text-center text-slate-600">{t.no_courses}</div>
      )}
    </section>
  );
}
