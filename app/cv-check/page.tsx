import { getLocale } from '@/lib/i18n';
import CvChecker from '@/components/CvChecker';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'فحص الـ CV بنظام ATS مجانًا — MEP LAB',
  description: 'افحص الـ CV بتاعك مجانًا لأي تخصص هندسي: نتيجة ATS، أقرب وظيفة ليك، والمرتب التقريبي.'
};

export default async function CvCheckPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('slug, title_ar, title_en, desc_ar, desc_en, price_egp, access_days').eq('published', true).order('sort_order').limit(4);
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container-x relative py-14 text-center md:py-16">
          <span className="badge bg-green-500/20 px-3 py-1 text-sm text-green-300">{ar ? 'مجاني 100% — من غير تسجيل' : '100% free — no sign-up needed'}</span>
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">{ar ? 'فحص الـ CV بنظام ATS' : 'ATS CV Checker'}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-8 text-slate-300">
            {ar
              ? 'ارفع الـ CV وفي ثواني تعرف نسبة توافقه مع أنظمة الـ ATS، وأقرب وظيفة ليه في تخصصك الهندسي، والمرتب التقريبي في مصر والسعودية والإمارات.'
              : 'Upload your CV and in seconds see its ATS score, the closest job title in your engineering discipline and an estimated salary in Egypt, KSA and UAE.'}
          </p>
        </div>
      </section>
      <section className="container-x relative z-10 -mt-6 pb-4">
        <CvChecker locale={locale} whatsapp={process.env.NEXT_PUBLIC_WHATSAPP} courses={(data ?? []) as any}
          playerUrl={process.env.NEXT_PUBLIC_PLAYER_DOWNLOAD_URL} playerVersion={process.env.NEXT_PUBLIC_PLAYER_VERSION} facebook={process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/MEPLAB.EGY'} />
      </section>
    </>
  );
}
