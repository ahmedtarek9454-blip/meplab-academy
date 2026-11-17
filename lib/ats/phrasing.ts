/**
 * How people actually write a skill in a CV: "selected booster pumps", "sizing of pipes", "calculating quantities".
 * Each rule is two groups of word stems that must sit close together in the same line, in either order.
 * Stems match the start of a word ("select" → select, selected, selection, selecting).
 */
export type Near = [string[], string[], number]; // group A, group B, max words between

const EQUIP = ['chiller', 'ahu', 'fcu', 'fahu', 'fan', 'pump', 'boiler', 'cooling tower', 'heater', 'tank', 'compressor', 'package unit', 'vrf', 'split unit', 'diffuser', 'grille', 'equipment', 'calorifier', 'heat exchanger', 'valve', 'breaker'];

export const NEAR: Record<string, Near[]> = {
  equip_sel: [[['select', 'siz'], EQUIP.filter((x) => x !== 'breaker' && x !== 'diffuser' && x !== 'grille' && x !== 'valve'), 5], [['select'], ['diffuser', 'grille', 'valve'], 3]],
  hydraulic: [
    [['hydraulic'], ['calc', 'calculat', 'design', 'analys', 'check', 'study', 'studies', 'model'], 3],
    [['pressure loss', 'pressure drop', 'friction loss', 'head loss', 'pump head', 'residual pressure'], ['calc', 'comput', 'sprinkler', 'fire', 'network', 'pipe'], 4]
  ],
  pipe_design: [[['siz', 'design', 'layout', 'rout', 'calculat'], ['pipe', 'piping'], 3]],
  load_calc: [[['cool', 'heat', 'thermal', 'hvac', 'a/c'], ['load'], 3]], // never just "calculated the load" (a structural engineer says that too)
  duct_design: [[['design', 'siz', 'layout', 'rout'], ['duct'], 3]],
  fire_pump: [[['fire'], ['pump'], 2]],
  shop_dwg: [[['shop'], ['dwg', 'drawing'], 0]],
  qto: [[['quantit'], ['calculat', 'take', 'survey', 'estimat', 'count', 'measur'], 3]],
  cable_sizing: [[['cable', 'wire', 'conductor', 'breaker'], ['siz', 'select', 'calculat'], 3]],
  clash: [[['clash'], ['detect', 'resolv', 'check', 'test', 'free', 'report', 'coordinat'], 4]],
  tnc: [[['pressure', 'hydrostatic', 'leak', 'flushing'], ['test'], 2], [['test'], ['commission'], 3]],
  concrete: [[['concrete'], ['cast', 'pour', 'works', 'placing', 'curing'], 3], [['cast', 'pour'], ['slab', 'column', 'beam', 'footing', 'foundation', 'raft', 'wall'], 3]],
  struct_design: [[['design', 'analys'], ['slab', 'beam', 'column', 'footing', 'foundation', 'structur', 'rc', 'shear wall', 'steel structure'], 4]],
  planning: [[['updat', 'prepar', 'monitor', 'track'], ['schedule', 'progress report', 'programme'], 4]],
  team_lead: [[['led', 'lead', 'leading', 'manag', 'supervis', 'head'], ['team of', 'engineers', 'technicians', 'foremen', 'workers', 'labour', 'labor', 'crew', 'staff', 'draftsmen', 'modelers', 'modellers'], 4]],
  lighting: [[['lighting', 'illumination', 'lux'], ['calc', 'calculat', 'design', 'study', 'layout'], 2]],
  water_supply: [[['water'], ['supply', 'distribution', 'network', 'booster', 'tank'], 2], [['domestic', 'potable', 'cold'], ['water'], 3]],
  submittals: [[['material', 'technical', 'equipment'], ['submit', 'submitt', 'approval'], 3]],
  installation: [[['install'], ['works', 'supervis', 'follow'], 4]],
  ppm: [[['preventive', 'planned', 'periodic', 'routine'], ['maintenance'], 2]]
};

/** the same, the way Egyptian and Gulf engineers write it in Arabic (stems match inside words, so ال / ات need no extra rule) */
const AR_NEAR: Record<string, Near[]> = {
  equip_sel: [[['اختيار', 'تحديد مقاس', 'تحديد سع'], ['مضخ', 'طلمب', 'تشيلر', 'شيلر', 'مبرد', 'وحد', 'مراوح', 'مروح', 'خزان', 'سخان', 'غلاي', 'معدات', 'المعد'], 3]],
  load_calc: [[['حساب', 'تقدير'], ['أحمال', 'احمال', 'الحمل الحراري', 'الحمل التبريد', 'أحمال التكييف'], 3]],
  duct_design: [[['تصميم', 'مقاسات', 'تحديد', 'توزيع'], ['مجاري الهواء', 'دكت', 'الدكتات', 'مسارات الهواء'], 3]],
  pipe_design: [[['تصميم', 'مقاسات', 'أقطار', 'اقطار', 'تحديد'], ['مواسير', 'المواسير', 'أنابيب', 'الأنابيب', 'شبكة المياه', 'شبكات المياه'], 3]],
  hydraulic: [[['حساب', 'تصميم'], ['هيدروليك', 'الهيدروليك'], 2]],
  team_lead: [[['إدارة', 'ادارة', 'قيادة', 'الإشراف على', 'الاشراف على', 'رئيس'], ['فريق', 'مهندسين', 'فنيين', 'عمال'], 3]],
  lighting: [[['حساب', 'تصميم', 'توزيع'], ['الإنارة', 'الانارة', 'إنارة', 'انارة', 'الإضاءة', 'الاضاءة'], 2]],
  concrete: [[['صب', 'أعمال', 'اعمال'], ['خرسان'], 2]],
  tnc: [[['اختبار', 'اختبارات'], ['ضغط', 'التشغيل', 'الاستلام'], 2]],
  qto: [[['حصر', 'حساب', 'تقدير'], ['كميات', 'الكميات'], 2]],
  planning: [[['إعداد', 'اعداد', 'تحديث', 'متابعة'], ['جدول زمني', 'الجدول الزمني', 'البرنامج الزمني'], 2]]
};
for (const [id, rules] of Object.entries(AR_NEAR)) NEAR[id] = [...(NEAR[id] || []), ...rules];

/** tools whose whole job is a skill: using them is doing it */
export const EXTRA_SYN: Record<string, string[]> = {
  load_calc: ['heat gain', 'heat gains', 'heat loss', 'cooling capacity calculation', 'tonnage calculation'],
  hydraulic: ['حسابات هيدروليكية', 'الحسابات الهيدروليكية', 'elite fire', 'hydracad', 'autosprink', 'pipenet', 'pipe flow expert', 'sprinkcad'],
  shop_dwg: ['شوب دروينج', 'شوب دراوينج', 'رسومات الورشة', 'shop dwg', 'shop dwgs', 'shopdrawings'],
  clash: ['clashes', 'clash free'],
  qto: ['quantities calculation', 'quantity calculation', 'quantities take off', 'quantity estimation']
};

const reOf = (stems: string[]) => stems.map((x) => x.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-_/]*')).join('|');
/** one regex per rule: A … (≤gap words) … B, or B … A, never across a line break */
export function nearRegex([a, b, gap]: Near): RegExp {
  // word endings only (select → selected / selection), so "pipe" never reads "pipeline" and "load" never "loader"
  const END = '(?:s|es|e|ed|d|ing|ion|ions|ation|ations|ies|y|is|al|er|ers|ment|ments|tal|tals|ted|ting|ally)?';
  const AL = '(?:[وبلف]?ال|لل|[وب])?'; // Arabic: الـ / وال / بال in front of a stem
  const A = `${AL}(?:${reOf(a)})${END}`, B = `${AL}(?:${reOf(b)})${END}`;
  const mid = `(?:[^\\S\\n]+[^\\s]+){0,${gap}}?[^\\S\\n]+`;
  return new RegExp(`(?:^|[^a-z0-9])((?:${A}${mid}${B})|(?:${B}${mid}${A}))(?=[^a-z0-9]|$)`, 'gim');
}
