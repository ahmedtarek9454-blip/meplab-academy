import { SHOW_PRICES } from '@/lib/features';
import { SUPABASE_READY } from '@/lib/supabase/env';
import { artKey, COURSE_COLOR, COURSE_DEEP } from '@/lib/ui/courseArt';
import { Mark } from './Logo';

type Loc = 'ar' | 'en';
export type CourseLite = { slug: string; title_ar: string; title_en: string; desc_ar?: string | null; desc_en?: string | null; price_egp: number; access_days?: number | null; status?: string | null };

const T = {
  ar: {
    tag: 'مين إحنا',
    title: 'MEP LAB — تعلّم HVAC و MEP من واقع المشاريع',
    desc: 'MEP LAB منصة تعليمية لمهندسي الميكانيكا، أسّسها مهندس BIM ميكانيكا شغال على مشاريع بنية تحتية ومطارات ومنشآت كبيرة في مصر والسعودية. الكورسات معمولة من واقع الشغل اليومي: تصميم تكييف، مكافحة حريق، Revit MEP، وأدوات مجانية زي AT Tools وفحص الـ CV اللي لسه مستخدمه.',
    courses: 'كورساتنا',
    view: 'تفاصيل الكورس',
    all: 'كل الكورسات',
    egp: 'ج.م',
    lifetime: 'مدى الحياة',
    days: 'يوم',
    no_courses: 'الكورسات الجديدة بتتعلن هنا وعلى صفحتنا. سجّل بإيميلك خلاص، فهيوصلك إشعار أول ما ينزل كورس.',
    player_t: 'MEP LAB Player',
    player_d: 'البرنامج اللي بتتفرج بيه على كورساتنا على جهازك، من غير نت بعد التفعيل. Windows 10/11.',
    player_btn: 'تحميل البرنامج',
    player_ver: 'الإصدار',
    follow: 'تابعنا',
    tools: 'أدوات مجانية (AT Tools لـ Revit)'
  },
  en: {
    tag: 'Who we are',
    title: 'MEP LAB — learn HVAC & MEP from real projects',
    desc: 'MEP LAB is a learning platform for mechanical engineers, founded by a Mechanical BIM Engineer working on infrastructure, airport and large-scale projects in Egypt and KSA. Courses come straight from day-to-day work: HVAC design, fire fighting, Revit MEP, plus free tools like AT Tools and the CV checker you just used.',
    courses: 'Our courses',
    view: 'Course details',
    all: 'All courses',
    egp: 'EGP',
    lifetime: 'Lifetime',
    days: 'days',
    no_courses: 'New courses are announced here and on our page. You are signed up, so you will be notified when one launches.',
    player_t: 'MEP LAB Player',
    player_d: 'The app you use to watch our courses on your PC, offline after activation. Windows 10/11.',
    player_btn: 'Download the Player',
    player_ver: 'Version',
    follow: 'Follow us',
    tools: 'Free tools (AT Tools for Revit)'
  }
};

export default function AboutMeplab({ locale, courses, playerUrl, playerVersion, hrefs, facebook, whatsapp }: {
  locale: Loc; courses: CourseLite[]; playerUrl?: string; playerVersion?: string; facebook?: string; whatsapp?: string;
  hrefs: { courses: string; course: (slug: string) => string; download: string; tools: string };
}) {
  const t = T[locale];
  const L = (c: CourseLite, f: 'title' | 'desc') => (c as any)[`${f}_${locale}`] || (c as any)[`${f}_ar`] || '';
  return (
    <section className="space-y-6">
      <div className="card relative overflow-hidden">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[auto,1fr] md:p-8">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-sheet border-[1.5px] border-ink"><Mark className="h-14 w-14" /></div>
          <div className="relative">
            <span className="badge rounded-[3px] border border-brand-blue text-brand-blue">{t.tag}</span>
            <h3 className="mt-2 text-2xl font-bold text-ink">{t.title}</h3>
            <p className="mt-2 max-w-3xl leading-7 text-ink-soft">{t.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {facebook && <a href={facebook} target="_blank" className="btn-ghost btn-sm">Facebook</a>}
              {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" className="btn-ghost btn-sm">WhatsApp</a>}
              {SUPABASE_READY && <a href={hrefs.tools} className="btn-ghost btn-sm">{t.tools}</a>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={SUPABASE_READY || playerUrl ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="display text-xl text-ink">{t.courses}</h3>
            <a href={hrefs.courses} className="text-sm font-bold text-brand-blue">{t.all} {locale === 'ar' ? '←' : '→'}</a>
          </div>
          {courses.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.slice(0, 4).map((c) => (
                <a key={c.slug} href={hrefs.course(c.slug)} className="group flex flex-col rounded-[3px] border-[1.5px] border-ink border-t-[5px] p-5 text-ink transition hover:bg-paper" style={{ borderTopColor: c.status === 'soon' ? '#C5CBD3' : COURSE_COLOR[artKey(c)] }}>
                  <div className="font-display text-lg font-bold group-hover:underline">{L(c, 'title')}</div>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm leading-6 text-ink-soft">{L(c, 'desc')}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    {c.status === 'soon'
                      ? <span className="rounded-[3px] border border-line px-2 py-0.5 font-bold text-ink-soft">{locale === 'ar' ? 'قريبًا' : 'Coming soon'}</span>
                      : SHOW_PRICES ? <span className="font-display text-xl font-bold">{c.price_egp} <span className="font-sans text-xs font-bold opacity-80">{t.egp}</span></span> : <span className="rounded-[3px] border border-line px-2 py-0.5 font-bold text-ink-soft">{locale === 'ar' ? 'متاح الآن' : 'Available now'}</span>}
                    <span className="font-bold">{t.view}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : <div className="card p-6 text-sm text-ink-soft">{t.no_courses}</div>}
        </div>

        {(SUPABASE_READY || playerUrl) && <div className="card flex flex-col overflow-hidden">
          <div className="border-b border-line p-5">
            <div className="mt-2 text-lg font-extrabold" dir="ltr" style={{ textAlign: 'inherit' }}>{t.player_t}</div>
            <p className="mt-1 text-sm leading-6 text-ink-soft">{t.player_d}</p>
            {playerVersion && <div className="mt-2 text-xs text-ink-mute">{t.player_ver} {playerVersion}</div>}
          </div>
          <div className="p-4"><a href={playerUrl || hrefs.download} target={playerUrl ? '_blank' : undefined} rel="noopener" className="btn-red w-full">{t.player_btn}</a></div>
        </div>}
      </div>
    </section>
  );
}
