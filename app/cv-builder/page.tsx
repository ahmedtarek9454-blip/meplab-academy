import Link from 'next/link';
import { getLocale } from '@/lib/i18n';
import CvBuilder from '@/components/CvBuilder';

export const metadata = {
  title: 'اعمل CV بصوتك مجانًا — MEP LAB',
  description: 'مش عندك CV؟ احكي خبرتك بصوتك أو اكتبها، واختار اللي عملته من قايمة جاهزة لتخصصك، وخد CV إنجليزي متوافق مع ATS تنزّله Word أو PDF.'
};

export default async function CvBuilderPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x pb-16 pt-12 text-center md:pb-20 md:pt-14">
          <span className="badge bg-brand-red px-3 py-1.5 text-sm text-white">{ar ? 'مجاني — من غير تسجيل' : 'Free — no sign-up'}</span>
          <h1 className="display mt-5 text-[2.4rem] leading-tight md:text-[4rem]">{ar ? 'مش عندك CV؟ احكيلنا' : 'No CV yet? Just tell us'}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/85">
            {ar
              ? 'اتكلم عن شغلك بصوتك أو اكتبه، وعلّم على المهام اللي عملتها من قايمة جاهزة لتخصصك. هنرتّبهم في CV إنجليزي متوافق مع ATS، وتنزّله Word أو PDF.'
              : 'Talk about your work or type it, and tick the tasks you did from a ready list for your field. We turn it into an ATS-friendly English CV you can download as Word or PDF.'}
          </p>
          <p className="mt-3 text-sm text-white/70">
            {ar ? 'عندك CV بالفعل؟ ' : 'Already have a CV? '}
            <Link href="/cv-check" className="font-bold text-white underline">{ar ? 'افحصه هنا' : 'Check it here'}</Link>
          </p>
        </div>
      </section>
      <section className="container-x relative z-10 -mt-10 max-w-5xl pb-16">
        <CvBuilder locale={locale} />
      </section>
    </>
  );
}
