/**
 * Roles outside MEP — every engineering discipline the CV checker understands.
 * `mult` scales the reference salary band (lib/cv/data.ts BANDS) for that role.
 * Indicative only — adjust from real market data when you have it.
 */
import type { Role } from './data';

const r = (id: string, disc: string, ar: string, en: string, mult: number, q: string[]): Role => ({ id, disc, ar, en, mult, q, kw: [] });

export const EXTRA_ROLES: Role[] = [
  /* civil & structural */
  r('civil_site', 'civil', 'مهندس مدني موقع (تنفيذ)', 'Civil Site Engineer', 0.95, ['civil site engineer']),
  r('structural', 'civil', 'مهندس تصميم إنشائي', 'Structural Design Engineer', 1.0, ['structural engineer']),
  r('infra', 'civil', 'مهندس طرق وبنية تحتية', 'Roads & Infrastructure Engineer', 1.0, ['infrastructure engineer', 'road engineer']),
  r('survey', 'survey', 'مهندس مساحة و GIS', 'Surveyor / GIS Engineer', 0.85, ['land surveyor', 'GIS engineer']),
  /* architecture */
  r('architect', 'arch', 'مهندس معماري', 'Architect', 0.95, ['architect']),
  r('interior', 'arch', 'مصمم داخلي', 'Interior Designer', 0.85, ['interior designer']),
  /* electrical */
  r('elec_design', 'elec', 'مهندس تصميم كهرباء', 'Electrical Design Engineer', 1.0, ['electrical design engineer']),
  r('elec_site', 'elec', 'مهندس كهرباء موقع (تنفيذ)', 'Electrical Site Engineer', 0.95, ['electrical site engineer']),
  r('power', 'elec', 'مهندس قوى ومحطات كهرباء', 'Power Systems / Substation Engineer', 1.1, ['substation engineer', 'power systems engineer']),
  r('elv', 'elec', 'مهندس تيار خفيف ELV', 'ELV / Low-Current Engineer', 0.95, ['ELV engineer', 'low current engineer']),
  /* mechanical (non-MEP) & industrial */
  r('mech_design', 'mech', 'مهندس تصميم ميكانيكي (منتجات ومعدات)', 'Mechanical Design Engineer (Product / Machines)', 0.95, ['mechanical design engineer solidworks']),
  r('production', 'mech', 'مهندس إنتاج وتصنيع', 'Production / Manufacturing Engineer', 0.9, ['production engineer', 'manufacturing engineer']),
  r('mech_maint', 'mech', 'مهندس صيانة ميكانيكا (مصانع ومحطات)', 'Mechanical Maintenance Engineer (Plant)', 0.95, ['mechanical maintenance engineer']),
  /* chemical & petroleum */
  r('process', 'process', 'مهندس عمليات (كيميائي)', 'Process / Chemical Engineer', 1.1, ['process engineer', 'chemical engineer']),
  r('petroleum', 'petroleum', 'مهندس بترول', 'Petroleum Engineer', 1.35, ['petroleum engineer', 'drilling engineer']),
  /* automation */
  r('automation', 'automation', 'مهندس تحكم وأوتوميشن', 'Automation / Instrumentation & Control Engineer', 1.05, ['automation engineer', 'instrumentation engineer']),
  /* computer & software */
  r('software', 'it', 'مهندس برمجيات', 'Software Engineer / Developer', 1.2, ['software engineer']),
  r('data', 'it', 'مهندس بيانات وذكاء اصطناعي', 'Data / AI Engineer', 1.2, ['data engineer', 'machine learning engineer']),
  r('network', 'it', 'مهندس شبكات و IT', 'Network / IT Infrastructure Engineer', 0.95, ['network engineer']),
  /* communications & electronics */
  r('telecom', 'telecom', 'مهندس اتصالات و RF', 'Telecom / RF Engineer', 1.0, ['telecom engineer', 'RF engineer']),
  r('embedded', 'telecom', 'مهندس إلكترونيات وأنظمة مدمجة', 'Electronics / Embedded Systems Engineer', 1.05, ['embedded systems engineer']),
  /* biomedical */
  r('biomedical', 'biomedical', 'مهندس أجهزة طبية', 'Biomedical Engineer', 0.9, ['biomedical engineer']),
  /* any discipline */
  r('planning', 'any', 'مهندس تخطيط ومتابعة مشاريع', 'Planning / Project Control Engineer', 1.05, ['planning engineer primavera']),
  r('quality', 'any', 'مهندس جودة QA/QC', 'Quality (QA/QC) Engineer', 0.95, ['QA QC engineer']),
  r('hse', 'any', 'مهندس سلامة وصحة مهنية HSE', 'HSE / Safety Engineer', 0.95, ['HSE engineer'])
];

/** Disciplines, how a CV names them (degree / headline), in Arabic and English */
export const DISCIPLINES: Record<string, { ar: string; en: string; re: RegExp }> = {
  mep: { ar: 'ميكانيكا / MEP', en: 'Mechanical / MEP', re: /(\bmep\b|hvac|fire\s*fighting|fire\s*protection|plumbing|تكييف|mechanical|power\s*mechanics|mechanics|ميكانيكا|ميكانيكية|ميكانيكي|قوى\s*ميكانيكية)/i },
  mech: { ar: 'ميكانيكا وصناعة', en: 'Mechanical & Industrial', re: /(mechanical|mechanics|industrial|production\s*engineering|manufacturing|ميكانيكا|ميكانيكية|إنتاج|صناعية)/i },
  civil: { ar: 'مدني وإنشائي', en: 'Civil & Structural', re: /(civil|structural|construction\s*engineering|مدني|مدنية|إنشائ)/i },
  survey: { ar: 'مساحة و GIS', en: 'Surveying & GIS', re: /(surveying|geomatics|مساحة)/i },
  arch: { ar: 'عمارة وتصميم داخلي', en: 'Architecture & Interior', re: /(architect|architecture|interior\s*design|عمارة|معماري|معمارية|ديكور)/i },
  elec: { ar: 'كهرباء', en: 'Electrical', re: /(electrical|electric\s*power|power\s*(?:and|&)\s*machines|power\s*systems|كهرباء|كهربائية|كهربية|قوى\s*وآلات)/i },
  process: { ar: 'كيمياء وعمليات', en: 'Chemical & Process', re: /(chemical|petrochemical|كيميائية|كيماوية|بتروكيماويات)/i },
  petroleum: { ar: 'بترول', en: 'Petroleum', re: /(petroleum|oil\s*(?:and|&)\s*gas\s*engineering|mining|بترول|تعدين)/i },
  automation: { ar: 'تحكم وأوتوميشن', en: 'Automation & Control', re: /(mechatronic|automation|control\s*(?:systems?\s*)?engineering|instrumentation|ميكاترونكس|ميكاترونيكس|تحكم)/i },
  it: { ar: 'حاسبات وبرمجيات', en: 'Computer & Software', re: /(computer|software|information\s*technology|computer\s*science|\bcse\b|حاسبات|برمجيات|علوم\s*الحاسب)/i },
  telecom: { ar: 'اتصالات وإلكترونيات', en: 'Communications & Electronics', re: /(communication|telecommunication|electronics|اتصالات|إلكترونيات|الكترونيات)/i },
  biomedical: { ar: 'هندسة طبية', en: 'Biomedical', re: /(biomedical|bio-?medical|medical\s*engineering|systems\s*and\s*biomedical|طبية|الطبية)/i }
};

/** skill category → discipline it is evidence for */
export const CAT_DISC: Record<string, string> = {
  design: 'mep', systems: 'mep', fire: 'mep', plumbing: 'mep',
  civil: 'civil', structural: 'civil', survey: 'survey', arch: 'arch',
  electrical: 'elec', mech: 'mech', process: 'process', petroleum: 'petroleum',
  automation: 'automation', it: 'it', telecom: 'telecom', biomed: 'biomedical'
};
