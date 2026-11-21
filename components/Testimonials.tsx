import { TESTIMONIALS } from '@/lib/data/testimonials';

/** students' own words about a course; renders nothing until real ones are added in lib/data/testimonials.ts */
export default function Testimonials({ slug, locale }: { slug: string; locale: 'ar' | 'en' }) {
  const list = TESTIMONIALS.filter((t) => t.course === slug || t.course === 'all');
  if (!list.length) return null;
  return (
    <section className="mt-10">
      <h2 className="display text-2xl">{locale === 'ar' ? 'رأي الطلبة' : 'What students say'}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {list.map((t, i) => (
          <figure key={i} className="card p-5">
            <blockquote className="leading-7 text-ink">“{t.text}”</blockquote>
            <figcaption className="mt-3 text-sm text-ink-mute"><span className="font-semibold text-ink">{t.name}</span>{t.role ? ` · ${t.role}` : ''}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
