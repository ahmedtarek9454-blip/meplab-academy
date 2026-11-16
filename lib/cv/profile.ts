/**
 * What the person actually did, read from the whole CV:
 * which MEP systems they cover (HVAC / fire / plumbing / electrical) and their job history,
 * job by job: kind of work, systems, duration, and what each job is missing.
 */
import { parseCv, type Entry } from '@/lib/cv/rebuild';
import type { CvResult, RoleMatch } from '@/lib/cv/analyze';

export type Sys = 'hvac' | 'fire' | 'plumb' | 'elec';
export type Kind = 'design' | 'site' | 'office' | 'qs' | 'bim' | 'maint';

export const SYS_LABEL: Record<Sys, { ar: string; en: string }> = {
  hvac: { ar: 'تكييف', en: 'HVAC' },
  fire: { ar: 'حريق', en: 'Fire fighting' },
  plumb: { ar: 'صحي (تغذية وصرف)', en: 'Plumbing (water & drainage)' },
  elec: { ar: 'كهرباء', en: 'Electrical' }
};
export const KIND_LABEL: Record<Kind, { ar: string; en: string }> = {
  design: { ar: 'تصميم', en: 'Design' },
  site: { ar: 'تنفيذ وموقع', en: 'Site execution' },
  office: { ar: 'مكتب فني', en: 'Technical office' },
  qs: { ar: 'حصر وتسعير', en: 'QS & estimation' },
  bim: { ar: 'BIM', en: 'BIM' },
  maint: { ar: 'تشغيل وصيانة', en: 'O&M' }
};

const SYS_RE: Record<Sys, RegExp> = {
  hvac: /\b(hvac|duct(?:s|work|ing)?|chill(?:ed|er)s?|ahus?|fcus?|vrf|vav|air[\s-]?condition\w*|heat(?:ing)?\s*load|cooling\s*load|ventilation|hap\b|split\s*units?)|تكييف|تهوية|دكت|مجاري\s*الهواء|تشيلر/i,
  fire: /\b(fire\s*(?:fighting|protection|pumps?|alarm|suppression|hydrants?)|firefighting|sprinklers?|fm[\s-]?200|novec|hose\s*reels?|standpipes?|nfpa|deluge|foam\s*system)|حريق|إطفاء|اطفاء|رشاشات|مكافحة/i,
  plumb: /\b(plumbing|water\s*(?:supply|networks?|tanks?)|drainage|sewage|sewer|manholes?|storm\s*water|sanitary|hot\s*water|booster\s*pumps?|upc\b|ipc\b)|صحي|صرف|تغذية|مياه|مواسير\s*المياه|غرف\s*تفتيش/i,
  elec: /\b(electrical|lighting|power\s*(?:distribution|system)|cables?|panels?\b|switchgear|sld\b|earthing|low\s*current|elv)|كهرباء|كهربائ|إنارة|لوحات/i
};
const KIND_RE: Record<Kind, RegExp> = {
  design: /\b(design(?:ed|ing|er)?|calculations?|sizing|selection|heat\s*load|load\s*calc)|تصميم|حسابات/i,
  site: /\b(site|execution|construction|installation|install(?:ed|ing)|supervis\w*|testing|commissioning|handover|foreman)|تنفيذ|موقع|تركيب|إشراف|اشراف|استلام/i,
  office: /\b(technical\s*office|shop\s*drawings?|submittals?|as[\s-]?built|rfi)|مكتب\s*فني|رسومات\s*تنفيذية/i,
  qs: /\b(boq|quantity|quantities|qs\b|estimat\w*|tender\w*|pricing|cost)|حصر|تسعير|مقايس|مناقص/i,
  bim: /\b(bim|revit\s*model\w*|clash|navisworks|coordination\s*model|lod\s*\d)|نمذجة/i,
  maint: /\b(maintenance|operation|o&m|ppm|facility)|صيانة|تشغيل/i
};

export type JobView = { title: string; company: string; dates: string; months: number; kinds: Kind[]; systems: Sys[]; bullets: number; numbers: boolean };
export type Note = { tone: 'good' | 'fix'; ar: string; en: string };
export type Profile = {
  systems: { id: Sys; n: number }[]; // what the CV shows, strongest first
  multi: boolean; // covers 2+ MEP systems for real
  jobs: JobView[];
  totalMonths: number;
  notes: Note[];
  missingBySys: { sys: Sys; role: RoleMatch }[];
  headlineTip: { ar: string; en: string } | null;
};

const SKILL_SYS: Record<string, Sys> = { design: 'hvac', systems: 'hvac', fire: 'fire', plumbing: 'plumb', electrical: 'elec' };
const ROLE_SYS: Record<string, Sys> = { hvac_design: 'hvac', fire: 'fire', plumbing: 'plumb', elec_design: 'elec', elec_site: 'elec' };
const hit = (re: RegExp, s: string) => re.test(s);
const months = (e: Entry) => (e.start && e.end && e.end >= e.start ? Math.max(1, Math.round((e.end - e.start) * 12)) : 0);
const fmtDur = (m: number, ar: boolean) => {
  const y = Math.floor(m / 12), r = m % 12;
  if (ar) return [y ? (y === 1 ? 'سنة' : y === 2 ? 'سنتين' : y <= 10 ? `${y} سنين` : `${y} سنة`) : '', r ? (r === 1 ? 'شهر' : r === 2 ? 'شهرين' : r <= 10 ? `${r} شهور` : `${r} شهر`) : ''].filter(Boolean).join(' و');
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', r ? `${r} mo` : ''].filter(Boolean).join(' ');
};
export const duration = fmtDur;

export function buildProfile(text: string, res: CvResult): Profile {
  const m = parseCv(text);
  const all = m.experience.map((e) => [e.title, ...(e.orig || e.bullets)].join(' ')).join(' ') + ' ' + m.summary.join(' ');

  // systems: skills the engine found + what the experience says
  const n: Record<Sys, number> = { hvac: 0, fire: 0, plumb: 0, elec: 0 };
  for (const s of res.skills) { const sys = SKILL_SYS[s.cat]; if (sys) n[sys]++; }
  for (const sys of Object.keys(n) as Sys[]) if (hit(SYS_RE[sys], all)) n[sys] += 1;
  const isMep = !res.general && ['mep', 'mech'].includes(res.discipline?.id || 'mep');
  const systems = (Object.keys(n) as Sys[]).filter((s) => n[s] >= 2 && (s !== 'elec' || !isMep || n.elec >= 3)).map((id) => ({ id, n: n[id] })).sort((a, b) => b.n - a.n);
  const mepSys = systems.filter((s) => s.id !== 'elec');
  const multi = !res.general && mepSys.length >= 2;

  // jobs, newest first as written
  const member = /\b(council|syndicate|association|society|institute\s+of|membership|member\b)|نقابة|الهيئة\s+السعودية|عضوية/i;
  const jobs: JobView[] = m.experience.filter((e) => !(member.test(`${e.title} ${e.company}`) && !(e.orig || e.bullets).length)).map((e) => {
    const body = [e.title, ...(e.orig || e.bullets)].join(' ');
    const kinds = (Object.keys(KIND_RE) as Kind[]).filter((k) => hit(KIND_RE[k], body));
    const sys = (Object.keys(SYS_RE) as Sys[]).filter((s) => hit(SYS_RE[s], body) && (s !== 'elec' || !isMep));
    const nums = (e.orig || e.bullets).some((b) => /\d/.test(b.replace(/\b(19|20)\d{2}\b/g, '').replace(/\b(?:nfpa|ashrae|smacna|iso|bs|en|upc|ipc|sbc|iec|ieee|fm|ul|lod)[\s-]*[\d.]+[a-z]?\b/gi, '').replace(/\b(?:ahu|fcu|r)-?\d+\b/gi, '')));
    const title = (e.title || '').replace(/^\s*\(?\d{1,2}[).\-]\s*/, '').trim();
    const company = /^[\d\s\/\-–.]+$|^(?:19|20)\d{2}/.test(e.company || '') ? '' : (e.company || '').trim();
    return { title: title || company || '—', company: title ? company : '', dates: e.dates, months: months(e), kinds: kinds.slice(0, 3), systems: sys, bullets: (e.orig || e.bullets).length, numbers: nums };
  });
  const totalMonths = jobs.reduce((x, j) => x + j.months, 0);

  // notes on the career, job by job
  const notes: Note[] = [];
  const name = (j: JobView) => `${j.title}${j.company ? ` (${j.company})` : ''}`;
  if (jobs.length >= 2) {
    const kindsAll = [...new Set(jobs.flatMap((j) => j.kinds))].filter((k) => k !== 'bim' || jobs.length > 1);
    if (kindsAll.includes('design') && kindsAll.includes('site'))
      notes.push({ tone: 'good', ar: 'عندك خبرة تصميم وتنفيذ مع بعض، ودي نقطة قوة. اكتبها صريحة في أول سطر في الملخص.', en: 'You have both design and site experience. Say it in the first line of your summary.' });
    const lvl = (t: string) => (/\b(senior|lead|head|manager|principal)\b|أول|رئيس|مدير/i.test(t) ? 2 : /\b(junior|trainee|assistant|intern)\b|مساعد|متدرب/i.test(t) ? 0 : 1);
    if (lvl(jobs[0].title) > lvl(jobs[jobs.length - 1].title))
      notes.push({ tone: 'good', ar: 'تاريخك بيبيّن ترقّي واضح من أول وظيفة لآخر وظيفة. سيب المسميات زي ما هي.', en: 'Your history shows clear progression from your first job to your latest. Keep the titles as they are.' });
  }
  const empty = jobs.filter((j) => j.bullets === 0);
  if (empty.length) notes.push({ tone: 'fix', ar: `${empty.map(name).join('، ')}: مفيهاش ولا نقطة بتشرح شغلك. اكتب 3 لـ 5 نقاط لكل وظيفة.`, en: `${empty.map(name).join(', ')}: no bullets about your work. Write 3 to 5 bullets per job.` });
  const noNum = jobs.filter((j) => j.bullets > 0 && !j.numbers);
  if (noNum.length && noNum.length === jobs.length && jobs.length > 1) notes.push({ tone: 'fix', ar: 'مفيش ولا رقم في خبرتك كلها. في كل وظيفة ضيف رقم واحد على الأقل: حجم المشروع، عدد الأدوار، الـ TR، عدد الرشاشات أو الـ GPM، أو قيمة العقد.', en: 'There are no numbers anywhere in your experience. Add at least one per job: project size, floors, TR, sprinkler count or GPM, or contract value.' });
  else if (noNum.length) notes.push({ tone: 'fix', ar: `${noNum.slice(0, 3).map(name).join('، ')}: مفيش ولا رقم. ضيف حجم المشروع، عدد الأدوار، الـ TR، عدد الرشاشات أو الـ GPM، أو قيمة العقد.`, en: `${noNum.slice(0, 3).map(name).join(', ')}: no numbers. Add project size, floors, TR, sprinkler count or GPM, or contract value.` });
  const temp = (t: string) => /\b(intern\w*|training|trainee|summer|part[\s-]?time|freelance|volunteer)\b|تدريب|متدرب|صيفي|جزئي|تطوع/i.test(t);
  const short = jobs.filter((j) => j.months > 0 && j.months < 6 && !temp(j.title + ' ' + j.company));
  if (short.length) notes.push({ tone: 'fix', ar: `${short.map(name).join('، ')}: أقل من 6 شهور. لو كانت مشروع مؤقت اكتب كده جنبها عشان متتقريش تنقّل كتير.`, en: `${short.map(name).join(', ')}: under 6 months. If it was a fixed-term project, say so.` });
  const ent = m.experience.filter((e) => e.start && e.end && !temp(e.title + ' ' + e.company)).sort((a, b) => b.start - a.start);
  for (let i = 0; i + 1 < ent.length; i++) {
    const gap = Math.round((ent[i].start - ent[i + 1].end) * 12);
    if (gap >= 6) { notes.push({ tone: 'fix', ar: `فيه فجوة حوالي ${fmtDur(gap, true)} قبل ${ent[i].title.replace(/^\s*\(?\d{1,2}[).\-]\s*/, '')}. لو كنت بتاخد كورسات أو شغل حر اكتبه.`, en: `There is a gap of about ${fmtDur(gap, false)} before ${ent[i].title.replace(/^\s*\(?\d{1,2}[).\-]\s*/, '')}. If you studied or freelanced, say so.` }); break; }
  }
  // a system done on the job but missing from the skills list
  if (multi) {
    const skillSys = new Set(res.skills.map((s) => SKILL_SYS[s.cat]).filter(Boolean));
    const lost = mepSys.filter((s) => !skillSys.has(s.id));
    if (lost.length) notes.push({ tone: 'fix', ar: `اشتغلت ${lost.map((s) => SYS_LABEL[s.id].ar).join(' و')} في الخبرة بس مش مكتوبة في المهارات. ضيفها.`, en: `You worked on ${lost.map((s) => SYS_LABEL[s.id].en).join(' and ')} but it is not in your skills list. Add it.` });
  }

  // missing keywords per system, from the best role of each system
  const missingBySys: Profile['missingBySys'] = [];
  if (multi) for (const s of mepSys) {
    const role = res.roles.find((r) => ROLE_SYS[r.role.id] === s.id);
    if (role && role.missing.length) missingBySys.push({ sys: s.id, role: { ...role, missing: role.missing.slice(0, 5) } });
  }

  // a headline that names every system they do
  let headlineTip: Profile['headlineTip'] = null;
  if (multi) {
    const head = (m.headline || '').toLowerCase();
    const named = mepSys.filter((s) => hit(SYS_RE[s.id], head));
    const ordered = (['hvac', 'fire', 'plumb'] as Sys[]).filter((x) => mepSys.some((s) => s.id === x)).map((id) => ({ id }));
    if (named.length < mepSys.length) {
      const en = `Mechanical Engineer (${ordered.map((s) => ({ hvac: 'HVAC', fire: 'Fire Fighting', plumb: 'Plumbing', elec: 'Electrical' }[s.id])).join(', ').replace(/, ([^,]*)$/, ' & $1')})`;
      headlineTip = { ar: `المسمى تحت اسمك مش بيقول إنك بتشتغل ${ordered.map((s) => SYS_LABEL[s.id].ar).join(' و')}. اكتبه: ${en}`, en: `Your headline doesn't name all your systems. Use: ${en}` };
    }
  }
  return { systems, multi, jobs, totalMonths, notes, missingBySys, headlineTip };
}
