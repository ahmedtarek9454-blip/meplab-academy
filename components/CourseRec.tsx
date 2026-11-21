'use client';
import { useEffect } from 'react';
import { track } from '@/lib/stats/track';
import type { CourseLite } from './AboutMeplab';

type Loc = 'ar' | 'en';

/**
 * After the CV result: ONE course suggestion that fits what the CV is missing.
 * Rules are simple on purpose (Hamada can read and change them):
 *  - Revit / BIM / Navisworks missing, or a BIM / technical-office / site role → Revit Mechanical diploma
 *  - HVAC roles, or HVAC design words missing (load, duct, HAP…) → HVAC design course
 *  - fire / plumbing / electrical roles → that course (shows "notify me" while it is still "soon")
 *  - anything outside MEP → nothing
 */
const REVIT_RE = /revit|bim|navisworks|clash|family|families|lod/i;
const HVAC_RE = /hvac|hap|load|duct|chiller|ahu|fcu|psychro|trace|vrf|ashrae|smacna|cooling/i;

function pick(roleId: string, discipline: string | null, missing: string[]): { slug: string; why: 'revit' | 'hvac' | 'fire' | 'plumb' | 'elec' } | null {
  const miss = missing.join(' ');
  if (roleId === 'fire') return { slug: 'fire-fighting-design', why: 'fire' };
  if (roleId === 'plumbing') return { slug: 'plumbing-design', why: 'plumb' };
  if (roleId === 'elec_design' || roleId === 'elec_site' || discipline === 'elec') return { slug: 'electrical-design', why: 'elec' };
  if (roleId === 'bim' || REVIT_RE.test(miss)) return { slug: 'revit-mechanical', why: 'revit' };
  if (['hvac_design', 'sales', 'fm'].includes(roleId) || HVAC_RE.test(miss)) return { slug: 'hvac-design-fundamentals', why: 'hvac' };
  if (discipline === 'mep' || discipline === 'mech' || ['site', 'tech_office', 'estimation'].includes(roleId)) return { slug: 'revit-mechanical', why: 'revit' };
  return null;
}

const WHY = {
  ar: {
    revit: 'الـ CV بتاعك ناقصه Revit / BIM، ودي من أكتر الحاجات اللي الشركات بتطلبها في وظايف الميكانيكا دلوقتي.',
    hvac: 'الـ CV بتاعك محتاج يقوى في تصميم التكييف: حساب الأحمال، الدكت، واختيار المعدات.',
    fire: 'إنت في مجال مكافحة الحريق، والكورس ده معمول لده بالظبط.',
    plumb: 'إنت في مجال الصحي، والكورس ده معمول لده بالظبط.',
    elec: 'إنت في مجال الكهربا، والكورس ده معمول لده بالظبط.'
  },
  en: {
    revit: 'Your CV is missing Revit / BIM, one of the most requested skills in mechanical jobs right now.',
    hvac: 'Your CV needs stronger HVAC design: load calculation, ductwork and equipment selection.',
    fire: 'You work in fire protection, and this course is built for exactly that.',
    plumb: 'You work in plumbing, and this course is built for exactly that.',
    elec: 'You work in electrical, and this course is built for exactly that.'
  }
};

export default function CourseRec({ locale, roleId, discipline, missing, score, courses, whatsapp, hrefBase = '' }: {
  locale: Loc; roleId: string; discipline: string | null; missing: string[]; score: number; courses: CourseLite[]; whatsapp?: string; hrefBase?: string;
}) {
  const p = pick(roleId, discipline, missing);
  const c = p ? courses.find((x) => x.slug === p.slug) : null;
  useEffect(() => { if (c) track('course_rec', { course: c.slug }); }, [c?.slug]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p || !c) return null;
  const ar = locale === 'ar';
  const title = (ar ? c.title_ar : c.title_en) || c.title_ar;
  const soon = c.status === 'soon';
  const waText = ar ? `السلام عليكم، عملت فحص الـ CV على الموقع (الدرجة ${score}) وعايز أعرف تفاصيل كورس ${title}` : `Hi, I checked my CV on your site (score ${score}) and I'd like details about the ${title} course`;
  return (
    <section className="card border-s-4 border-s-brand-red p-6">
      <span className="badge rounded-[3px] border border-brand-red text-brand-red">{ar ? 'خطوتك الجاية' : 'Your next step'}</span>
      <h3 className="mt-2 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-3xl leading-7 text-ink-soft">{WHY[locale][p.why]}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`${hrefBase}/courses/${c.slug}`} className="btn-red btn-sm">{soon ? (ar ? 'بلّغني لما ينزل' : 'Notify me when it launches') : (ar ? 'تفاصيل الكورس' : 'Course details')}</a>
        {!soon && whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" onClick={() => track('contact_wa', { course: c.slug, from: 'cv' })} className="btn-ghost btn-sm">
            {ar ? 'اسألنا على واتساب' : 'Ask on WhatsApp'}
          </a>
        )}
      </div>
    </section>
  );
}
