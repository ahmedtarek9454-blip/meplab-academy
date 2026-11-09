/**
 * Job-title evidence: what the candidate calls themselves (headline + most recent job title).
 * Real recruiters weigh this heavily; a PM's CV is full of site vocabulary but the title says PM.
 */
export const TITLE_PATTERNS: Record<string, RegExp> = {
  pm: /(project\s*manager|project\s*director|construction\s*manager|mep\s*manager|mep\s*head|head\s*of\s*mep|pmo|مدير\s*(?:مشروع|مشاريع|تنفيذ)|project\s*lead\b)/i,
  hvac_design: /(hvac\s*(?:design)?\s*engineer|mechanical\s*design\s*engineer|design\s*engineer\s*[-–(]?\s*(?:hvac|mechanical)|hvac\s*designer|mechanical\s*engineer\s*[-–(]\s*design|head\s*of\s*(?:mep\s*)?design|design\s*(?:manager|lead|head)|مهندس\s*تصميم\s*(?:تكييف|ميكانيك))/i,
  bim: /(bim\s*(?:engineer|coordinator|modeler|modeller|manager|specialist|lead)|revit\s*(?:mep\s*)?(?:modeler|modeller|technician)|mep\s*coordinator|مهندس\s*bim|منسق\s*bim)/i,
  fire: /(fire\s*(?:fighting|protection|safety)\s*(?:design\s*)?engineer|fire\s*engineer|sprinkler\s*(?:design\s*)?engineer|مهندس\s*(?:مكافحة\s*)?حريق|مهندس\s*إطفاء)/i,
  plumbing: /(plumbing\s*(?:design\s*)?engineer|public\s*health\s*engineer|drainage\s*engineer|wet\s*services\s*engineer|مهندس\s*(?:تصميم\s*)?صحي)/i,
  site: /(site\s*engineer|mep\s*engineer\s*[-–(]?\s*site|construction\s*engineer|execution\s*engineer|field\s*engineer|site\s*supervisor|mep\s*supervisor|مهندس\s*(?:موقع|تنفيذ))/i,
  tech_office: /(technical\s*office\s*engineer|technical\s*office|shop\s*drawing\s*engineer|draft(?:s)?man|mep\s*draughtsman|مهندس\s*مكتب\s*فني|مكتب\s*فني)/i,
  estimation: /(estimation\s*engineer|estimator|tendering\s*engineer|tender\s*engineer|quantity\s*surveyor|\bqs\b|cost\s*engineer|pre-?contracts?\s*engineer|مهندس\s*(?:حصر|تسعير|عطاءات|مناقصات))/i,
  sales: /(sales\s*engineer|application\s*engineer|pre-?sales\s*engineer|technical\s*sales|business\s*development|key\s*account|مهندس\s*مبيعات)/i,
  fm: /(maintenance\s*engineer|facilit(?:y|ies)\s*(?:management\s*)?engineer|facilit(?:y|ies)\s*manager|fm\s*engineer|o\s*&\s*m\s*engineer|operation(?:s)?\s*(?:and|&)\s*maintenance|service\s*engineer|مهندس\s*صيانة|مهندس\s*تشغيل)/i
};

const LEAD_WORDS = /\b(manage[ds]?|managing|lead|led|leading|head|director|chair(?:ed|ing)?|budget|cash\s*flow|team\s*of\s*\d+|\d+\s*(?:engineers|supervisors|subcontractors)|stakeholders?|p&l)\b|وقيادة|قيادة|إدارة\s*(?:فريق|المشروع)/i;

export type TitleEvidence = { headline: string; recent: string; hits: Record<string, number>; leadership: number };

/** headline = first 6 lines; recent title = the job title closest to the first work date range */
export function titleEvidence(rawText: string, firstWorkLine?: string): TitleEvidence {
  const text = rawText.replace(/\r/g, '').replace(/[–—]/g, '-').replace(/\u00a0/g, ' ').replace(/[ \t]{2,}/g, ' ');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // headline = top of the CV up to the first section heading / first date / first bullet (max 6 lines)
  const head: string[] = [];
  for (const l of lines.slice(0, 10)) {
    if (head.length >= 6) break;
    if (/^(summary|profile|objective|experience|education|skills|contact|work|professional|employment|الخبر|التعليم|المهارات|نبذة|الملخص)/i.test(l) && l.length < 45) break;
    if (/(19|20)\d{2}\s*(-|to|till|until)/i.test(l) || /^[•\-*▪●]/.test(l)) break;
    head.push(l);
  }
  const headline = head.join(' | ');
  let recent = '';
  if (firstWorkLine) {
    const key = firstWorkLine.replace(/[–—]/g, '-').replace(/[ \t]{2,}/g, ' ').slice(0, 40);
    const i = lines.findIndex((l) => l.includes(key));
    // title usually sits on the 1-3 lines above the date line, sometimes on the line right after
    if (i >= 0) recent = [...lines.slice(Math.max(0, i - 3), i + 1), lines[i + 1] || ''].filter((l) => !/^[•\-*▪●]/.test(l)).join(' | ');
  }
  const hits: Record<string, number> = {};
  for (const [role, re] of Object.entries(TITLE_PATTERNS)) {
    let h = 0;
    if (re.test(headline)) h += 2;
    if (recent && re.test(recent)) h += 2;
    // whole-document title mentions (weak) — ignore phrases like "reported to the project manager"
    const body = text.replace(/(report(?:ed|ing|s)?\s+to|coordinat\w*\s+with|liais\w*\s+with|support(?:ed|ing)?\s+the|assist(?:ed|ing)?\s+the|under\s+the)\s+[^.\n]{0,40}/gi, '');
    const all = body.match(new RegExp(re.source, 'gi'));
    if (all) h += Math.min(1, all.length * 0.25);
    if (h) hits[role] = h;
  }
  const leadership = Math.min(6, (text.match(new RegExp(LEAD_WORDS.source, 'gi')) || []).length);
  return { headline, recent, hits, leadership };
}
