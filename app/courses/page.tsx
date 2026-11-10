import { getT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/CourseCard';

export default async function Courses() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('*').eq('published', true).order('sort_order');
  const courses = data ?? [];
  const available = courses.filter((c: any) => c.status !== 'soon');
  const soon = courses.filter((c: any) => c.status === 'soon');
  const ar = locale === 'ar';
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x py-12 md:py-16">
          <h1 className="display text-[2.6rem] leading-tight md:text-[4rem]">{t.nav_courses}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{t.recorded_note}</p>
        </div>
      </section>
      <section className="container-x pt-10">
        {available.length > 0 && <div className="grid gap-4 md:grid-cols-2">{available.map((c: any) => <CourseCard key={c.id} c={c} locale={locale} t={t} />)}</div>}
        {soon.length > 0 && (
          <>
            <h2 className="display mt-14 text-2xl md:text-3xl">{ar ? 'قريبًا' : 'Coming soon'}</h2>
            <p className="mt-2 text-ink-soft">{ar ? 'سيب إيميلك على الكورس اللي يهمك ونبعتلك أول ما ينزل.' : 'Leave your email on the course you want and we will tell you the day it launches.'}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{soon.map((c: any) => <CourseCard key={c.id} c={c} locale={locale} t={t} size="sm" />)}</div>
          </>
        )}
        {!courses.length && <div className="card p-8 text-center text-ink-soft">{t.no_courses}</div>}
      </section>
    </>
  );
}
