import { getLocale } from '@/lib/i18n';
import CvChecker from '@/components/CvChecker';
import { safeCourses } from '@/lib/data/courses';

export const metadata = {
  title: 'فحص الـ CV بنظام ATS مجانًا — MEP LAB',
  description: 'افحص الـ CV بتاعك مجانًا لأي تخصص هندسي: نتيجة ATS، أقرب وظيفة ليك، والمرتب التقريبي.'
};

export default async function CvCheckPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const data = (await safeCourses()).slice(0, 4);
  return (
    <>
      <section className="relative overflow-hidden bg-brand-red text-white">
        <div className="container-x relative pb-16 pt-12 text-center md:pb-20 md:pt-14">
          <span className="badge bg-ink px-3 py-1.5 text-sm text-white">{ar ? 'مجاني 100% — من غير تسجيل' : '100% free — no sign-up needed'}</span>
          <h1 className="display mt-5 text-[2.6rem] leading-tight md:text-[4.25rem]">{ar ? 'فحص الـ CV بنظام ATS' : 'ATS CV Checker'}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/90">
            {ar
              ? 'ارفع الـ CV وفي ثواني تعرف نسبة توافقه مع أنظمة الـ ATS، وأقرب وظيفة ليه في تخصصك الهندسي، والمرتب التقريبي في مصر والسعودية والإمارات.'
              : 'Upload your CV and in seconds see its ATS score, the closest job title in your engineering discipline and an estimated salary in Egypt, KSA and UAE.'}
          </p>
          <p className="mt-3 text-sm text-white/85">
            {ar ? 'مش عندك CV؟ ' : 'No CV yet? '}
            <a href="/cv-builder" className="font-bold text-white underline">{ar ? 'اعمله بصوتك في دقايق' : 'Build one by voice in minutes'}</a>
          </p>
        </div>
      </section>
      <section className="container-x relative z-10 -mt-10 pb-4">
        <CvChecker locale={locale} whatsapp={process.env.NEXT_PUBLIC_WHATSAPP} courses={(data ?? []) as any}
          playerUrl={process.env.NEXT_PUBLIC_PLAYER_DOWNLOAD_URL} playerVersion={process.env.NEXT_PUBLIC_PLAYER_VERSION} facebook={process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/MEPLAB.EGY'} />
      </section>
    </>
  );
}
