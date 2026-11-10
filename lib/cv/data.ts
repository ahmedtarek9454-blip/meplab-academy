/**
 * =====================================================================
 *  CV checker data — roles, keywords and salary bands
 *  عدّل الأرقام والكلمات هنا براحتك؛ الأداة بتقرا منها بس.
 * =====================================================================
 *  Salary bands are MONTHLY, rough market estimates (Nov 2026) built from
 *  public salary sites (PayScale, Paylab, NaukriGulf, GulfTalent, Indeed).
 *  They are indicative only — review and adjust them periodically.
 */

import { EXTRA_ROLES, DISCIPLINES } from './roles-extra';

export type Market = 'eg' | 'sa' | 'ae';
export type Level = 'junior' | 'mid' | 'senior' | 'lead';

export const MARKETS: Record<Market, { cur_ar: string; cur_en: string; name_ar: string; name_en: string; round: number; location: string; cc: string }> = {
  eg: { cur_ar: 'ج.م', cur_en: 'EGP', name_ar: 'مصر', name_en: 'Egypt', round: 1000, location: 'Egypt', cc: 'eg' },
  sa: { cur_ar: 'ر.س', cur_en: 'SAR', name_ar: 'السعودية', name_en: 'Saudi Arabia', round: 500, location: 'Saudi Arabia', cc: 'sa' },
  ae: { cur_ar: 'د.إ', cur_en: 'AED', name_ar: 'الإمارات', name_en: 'UAE', round: 500, location: 'United Arab Emirates', cc: 'ae' }
};

/** base monthly band for a generic MEP mechanical engineer, by level */
export const BANDS: Record<Market, Record<Level, [number, number]>> = {
  eg: { junior: [10000, 20000], mid: [20000, 38000], senior: [38000, 70000], lead: [65000, 120000] },
  sa: { junior: [4500, 7500], mid: [7500, 11500], senior: [11500, 17000], lead: [16000, 26000] },
  ae: { junior: [4500, 7500], mid: [8000, 13000], senior: [12000, 19000], lead: [18000, 30000] }
};

export const LEVELS: Record<Level, { ar: string; en: string; min: number }> = {
  junior: { ar: 'جونيور (0–2 سنة)', en: 'Junior (0–2 yrs)', min: 0 },
  mid: { ar: 'متوسط الخبرة (3–5 سنين)', en: 'Mid-level (3–5 yrs)', min: 3 },
  senior: { ar: 'سينيور (6–9 سنين)', en: 'Senior (6–9 yrs)', min: 6 },
  lead: { ar: 'ليد / مدير (10+ سنين)', en: 'Lead / Manager (10+ yrs)', min: 10 }
};

export type Role = {
  id: string;
  disc: string; // discipline id (lib/cv/roles-extra.ts DISCIPLINES) or 'any'
  ar: string;
  en: string;
  mult: number; // salary multiplier vs base band
  kw: [string, number][]; // keyword, weight
  q: string[]; // job-search queries used to fetch jobs for this role
};

const MEP_ROLES: Role[] = [
  {
    id: 'hvac_design', disc: 'mep', ar: 'مهندس تصميم تكييف HVAC', en: 'HVAC Design Engineer', mult: 1.0,
    q: ['HVAC design engineer', 'mechanical design engineer HVAC'],
    kw: [['hvac', 3], ['cooling load', 3], ['heat load', 3], ['hap', 3], ['carrier hap', 2], ['trace 700', 2], ['elite', 1], ['duct design', 3], ['duct sizing', 2], ['ductulator', 2], ['chiller', 2], ['ahu', 2], ['fcu', 2], ['vrf', 2], ['vav', 2], ['ashrae', 3], ['smacna', 2], ['psychrometric', 2], ['external static pressure', 2], ['ventilation', 2], ['cfm', 1], ['air balance', 1], ['equipment selection', 2], ['chilled water', 2], ['split units', 1], ['package units', 1], ['design criteria', 1], ['تكييف', 2]]
  },
  {
    id: 'bim', disc: 'mep', ar: 'مهندس BIM ميكانيكا / BIM Coordinator', en: 'Mechanical BIM Engineer / Coordinator', mult: 1.1,
    q: ['BIM mechanical engineer', 'Revit MEP'],
    kw: [['bim', 3], ['revit', 3], ['revit mep', 3], ['navisworks', 3], ['clash detection', 3], ['coordination', 2], ['lod', 2], ['families', 2], ['dynamo', 2], ['bim 360', 2], ['autodesk construction cloud', 2], ['iso 19650', 2], ['cde', 1], ['bep', 2], ['bim execution plan', 2], ['federated model', 2], ['4d', 1], ['5d', 1], ['scan to bim', 1], ['point cloud', 1], ['schedules', 1], ['add-in', 1], ['pyrevit', 1]]
  },
  {
    id: 'fire', disc: 'mep', ar: 'مهندس تصميم مكافحة حريق', en: 'Fire Protection Engineer', mult: 1.0,
    q: ['fire fighting engineer', 'fire protection engineer'],
    kw: [['fire fighting', 3], ['fire protection', 3], ['sprinkler', 3], ['nfpa', 3], ['nfpa 13', 2], ['nfpa 14', 1], ['nfpa 20', 2], ['hydraulic calculation', 3], ['elite fire', 2], ['fire pump', 2], ['hose reel', 2], ['standpipe', 2], ['fm200', 2], ['clean agent', 2], ['deluge', 2], ['foam system', 1], ['fire hydrant', 1], ['civil defense', 2], ['sbc 801', 2], ['حريق', 2]]
  },
  {
    id: 'plumbing', disc: 'mep', ar: 'مهندس صحي / Plumbing', en: 'Plumbing / Public Health Engineer', mult: 0.95,
    q: ['plumbing engineer'],
    kw: [['plumbing', 3], ['drainage', 3], ['water supply', 3], ['ipc', 2], ['upc', 2], ['booster pump', 2], ['fixture units', 2], ['sewage', 2], ['storm water', 2], ['hot water', 1], ['pipe sizing', 2], ['water tank', 1], ['manhole', 1], ['grease trap', 1], ['irrigation', 1], ['صحي', 2]]
  },
  {
    id: 'site', disc: 'mep', ar: 'مهندس موقع ميكانيكا (تنفيذ)', en: 'MEP Site Engineer (Execution)', mult: 0.95,
    q: ['MEP site engineer', 'mechanical site engineer'],
    kw: [['site engineer', 3], ['site', 1], ['installation', 3], ['supervision', 2], ['execution', 3], ['testing and commissioning', 3], ['t&c', 2], ['commissioning', 2], ['inspection request', 2], ['inspection', 1], ['method statement', 2], ['handover', 2], ['snag', 1], ['subcontractor', 2], ['manpower', 1], ['hse', 1], ['pressure test', 2], ['tbm', 1], ['تنفيذ', 2]]
  },
  {
    id: 'tech_office', disc: 'any', ar: 'مهندس مكتب فني / Shop Drawings', en: 'Technical Office Engineer', mult: 0.95,
    q: ['MEP technical office engineer', 'shop drawing engineer'],
    kw: [['technical office', 3], ['shop drawing', 3], ['shop drawings', 3], ['submittal', 3], ['material submittal', 2], ['as-built', 3], ['as built', 2], ['rfi', 2], ['autocad', 2], ['coordination drawings', 2], ['material approval', 2], ['prequalification', 1], ['consultant comments', 1], ['مكتب فني', 3]]
  },
  {
    id: 'estimation', disc: 'any', ar: 'مهندس حصر وتسعير / QS', en: 'Estimation / QS Engineer', mult: 0.95,
    q: ['MEP estimation engineer'],
    kw: [['estimation', 3], ['estimator', 3], ['quantity take-off', 3], ['quantity takeoff', 3], ['take off', 2], ['boq', 3], ['bill of quantities', 3], ['tender', 3], ['bid', 2], ['pricing', 3], ['cost estimate', 2], ['quotation', 2], ['variation', 1], ['claims', 1], ['cost control', 2], ['حصر', 3], ['تسعير', 3]]
  },
  {
    id: 'pm', disc: 'any', ar: 'مهندس / مدير مشروع', en: 'Project Engineer / Manager', mult: 1.25,
    q: ['MEP project engineer', 'MEP project manager'],
    kw: [['project manager', 3], ['project engineer', 3], ['project management', 3], ['pmp', 3], ['primavera', 3], ['p6', 2], ['ms project', 2], ['planning', 2], ['schedule', 1], ['budget', 2], ['stakeholder', 2], ['client', 1], ['progress report', 2], ['team lead', 2], ['led a team', 2], ['managed', 1], ['risk', 1], ['contract', 1], ['fidic', 2]]
  },
  {
    id: 'sales', disc: 'mep', ar: 'مهندس مبيعات / Application تكييف', en: 'HVAC Sales / Application Engineer', mult: 1.0,
    q: ['HVAC sales engineer'],
    kw: [['sales', 3], ['application engineer', 3], ['sales engineer', 3], ['business development', 2], ['targets', 2], ['customers', 2], ['crm', 2], ['selection software', 2], ['carrier', 1], ['trane', 1], ['daikin', 1], ['york', 1], ['mcquay', 1], ['product', 1], ['dealers', 1], ['مبيعات', 3]]
  },
  {
    id: 'fm', disc: 'any', ar: 'مهندس صيانة مباني / Facility Management', en: 'Maintenance / FM Engineer', mult: 0.9,
    q: ['HVAC maintenance engineer', 'facility management engineer'],
    kw: [['maintenance', 3], ['preventive maintenance', 3], ['ppm', 2], ['facility management', 3], ['facilities', 2], ['cmms', 3], ['breakdown', 2], ['troubleshooting', 2], ['operation', 1], ['chiller plant', 2], ['bms', 2], ['work orders', 2], ['spare parts', 1], ['صيانة', 3]]
  }
];

export const ROLES: Role[] = [...MEP_ROLES, ...EXTRA_ROLES];

/** roles grouped by discipline, for <select> menus */
export function roleGroups(locale: 'ar' | 'en') {
  const order = ['mep', 'civil', 'survey', 'arch', 'elec', 'mech', 'process', 'petroleum', 'automation', 'it', 'telecom', 'biomedical', 'any'];
  return order.map((d) => ({
    id: d,
    label: d === 'any' ? (locale === 'ar' ? 'لكل التخصصات' : 'Any discipline') : DISCIPLINES[d]?.[locale] || d,
    roles: ROLES.filter((r) => r.disc === d)
  })).filter((g) => g.roles.length);
}

export const SECTIONS: Record<string, string[]> = {
  summary: ['summary', 'profile', 'professional summary', 'objective', 'career objective', 'about me', 'نبذة', 'الملخص', 'الهدف'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'career history', 'work history', 'الخبرات', 'الخبرة', 'الخبرات العملية'],
  education: ['education', 'academic', 'qualifications', 'التعليم', 'المؤهلات'],
  skills: ['skills', 'technical skills', 'software', 'core competencies', 'competencies', 'tools', 'المهارات'],
  certifications: ['certifications', 'certificates', 'courses', 'training', 'licenses', 'الشهادات', 'الدورات'],
  projects: ['projects', 'key projects', 'selected projects', 'المشاريع']
};
