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
      <h1 className="text-[1.9rem] font-bold md:text-h2">{t.all_courses}</h1>
      <p className="mb-8 mt-2 max-w-2xl leading-7 text-ink-soft">{t.recorded_note}</p>
      {courses.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c, i) => <CourseCard key={c.id} c={c} locale={locale} t={t} i={i} />)}
        </div>
      ) : (
        <div className="card p-8 text-center text-ink-soft">{t.no_courses}</div>
      )}
    </section>
  );
}
