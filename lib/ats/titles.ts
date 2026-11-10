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
  site: /((?<!civil\s|electrical\s|structural\s|architectural\s|survey\s|telecom\s)site\s*engineer|mep\s*engineer\s*[-–(]?\s*site|construction\s*engineer|execution\s*engineer|field\s*engineer|site\s*supervisor|mep\s*supervisor|مهندس\s*(?:موقع|تنفيذ))/i,
  tech_office: /(technical\s*office\s*engineer|technical\s*office|shop\s*drawing\s*engineer|draft(?:s)?man|mep\s*draughtsman|مهندس\s*مكتب\s*فني|مكتب\s*فني)/i,
  estimation: /(estimation\s*engineer|estimator|tendering\s*engineer|tender\s*engineer|quantity\s*surveyor|\bqs\b|cost\s*engineer|pre-?contracts?\s*engineer|مهندس\s*(?:حصر|تسعير|عطاءات|مناقصات))/i,
  sales: /(sales\s*engineer|application\s*engineer|pre-?sales\s*engineer|technical\s*sales|business\s*development|key\s*account|مهندس\s*مبيعات)/i,
  fm: /(maintenance\s*engineer|facilit(?:y|ies)\s*(?:management\s*)?engineer|facilit(?:y|ies)\s*manager|fm\s*engineer|o\s*&\s*m\s*engineer|operation(?:s)?\s*(?:and|&)\s*maintenance|service\s*engineer|مهندس\s*صيانة|مهندس\s*تشغيل)/i,
  // ---- other engineering disciplines ----
  civil_site: /(civil\s*(?:site\s*)?engineer|site\s*civil\s*engineer|structural\s*site\s*engineer|civil\s*works\s*engineer|مهندس\s*مدني|مهندس\s*موقع\s*مدني)/i,
  structural: /(structural\s*(?:design\s*)?engineer|structural\s*designer|design\s*engineer\s*[-–(]?\s*structural|مهندس\s*(?:تصميم\s*)?إنشائي)/i,
  infra: /(infrastructure\s*engineer|road\s*(?:design\s*)?engineer|highway\s*engineer|roads?\s*(?:&|and)\s*infrastructure|utilities\s*engineer|wet\s*utilities\s*engineer|مهندس\s*طرق|مهندس\s*بنية\s*تحتية)/i,
  survey: /(land\s*surveyor|(?<!quantity\s)surveyor|survey\s*engineer|surveying\s*engineer|gis\s*(?:engineer|analyst|specialist)|geomatics\s*engineer|مهندس\s*مساحة)/i,
  architect: /(\barchitect\b(?!ure)|architectural\s*(?:engineer|designer)|design\s*architect|project\s*architect|مهندس(?:ة)?\s*معماري(?:ة)?)/i,
  interior: /(interior\s*(?:designer|architect|design\s*engineer)|مصمم(?:ة)?\s*داخلي|مهندس(?:ة)?\s*ديكور)/i,
  elec_design: /(electrical\s*design\s*engineer|electrical\s*designer|design\s*engineer\s*[-–(]?\s*electrical|مهندس\s*تصميم\s*كهرباء)/i,
  elec_site: /(electrical\s*(?:site\s*)?engineer|site\s*electrical\s*engineer|electrical\s*supervisor|مهندس\s*كهرباء)/i,
  power: /(substation\s*engineer|power\s*systems?\s*engineer|protection\s*engineer|transmission\s*lines?\s*engineer|high\s*voltage\s*engineer|hv\s*engineer|مهندس\s*(?:قوى|محطات))/i,
  elv: /(elv\s*engineer|low[\s-]*current\s*engineer|light\s*current\s*engineer|security\s*systems\s*engineer|مهندس\s*تيار\s*خفيف)/i,
  mech_design: /(product\s*design\s*engineer|machine\s*design\s*engineer|mechanical\s*design\s*engineer\s*[-–(]?\s*(?:product|machine|solidworks)|r\s*&\s*d\s*engineer|design\s*engineer\s*[-–(]?\s*(?:product|machines?))/i,
  production: /(production\s*engineer(?!\s*[-–(]?\s*(?:oil|petroleum|wells?))|manufacturing\s*engineer|industrial\s*engineer|production\s*(?:supervisor|manager)|مهندس\s*(?:إنتاج|تصنيع))/i,
  mech_maint: /(mechanical\s*maintenance\s*engineer|maintenance\s*engineer\s*[-–(]?\s*mechanical|rotating\s*equipment\s*engineer|static\s*equipment\s*engineer|reliability\s*engineer|plant\s*maintenance\s*engineer|مهندس\s*صيانة\s*ميكانيكا)/i,
  process: /(process\s*engineer|chemical\s*engineer|process\s*design\s*engineer|مهندس\s*(?:عمليات|كيميائي))/i,
  petroleum: /(petroleum\s*engineer|drilling\s*engineer|reservoir\s*engineer|production\s*engineer\s*[-–(]?\s*(?:oil|petroleum|wells?)|completion\s*engineer|well\s*(?:site|test)\s*engineer|mud\s*(?:engineer|logger)|مهندس\s*(?:بترول|حفر))/i,
  automation: /(automation\s*engineer|control\s*(?:systems\s*)?engineer|instrumentation\s*(?:(?:and|&)\s*control\s*)?engineer|i\s*&\s*c\s*engineer|plc\s*(?:engineer|programmer)|scada\s*engineer|dcs\s*engineer|mechatronics\s*engineer|مهندس\s*(?:تحكم|أتمتة|ميكاترونكس))/i,
  software: /(software\s*(?:engineer|developer)|full[\s-]*stack|front[\s-]*end\s*(?:engineer|developer)|back[\s-]*end\s*(?:engineer|developer)|web\s*developer|mobile\s*(?:app\s*)?developer|flutter\s*developer|android\s*developer|ios\s*developer|devops\s*engineer|مطور\s*برمجيات|مهندس\s*برمجيات)/i,
  data: /(data\s*(?:engineer|scientist|analyst)|machine\s*learning\s*engineer|\bml\s*engineer|\bai\s*engineer|bi\s*developer|مهندس\s*بيانات|عالم\s*بيانات)/i,
  network: /(network\s*(?:engineer|administrator|admin)|system(?:s)?\s*administrator|\bit\s*(?:engineer|specialist|support\s*engineer|administrator)|noc\s*engineer|cyber\s*security\s*(?:engineer|analyst)|security\s*analyst|مهندس\s*شبكات)/i,
  telecom: /(telecom(?:munications?)?\s*engineer|rf\s*(?:planning\s*|optimi[sz]ation\s*)?engineer|\bran\s*engineer|drive\s*test\s*engineer|core\s*network\s*engineer|transmission\s*engineer\s*[-–(]?\s*(?:telecom|microwave)|مهندس\s*اتصالات)/i,
  embedded: /(embedded\s*(?:systems?\s*|software\s*)?engineer|firmware\s*engineer|electronics\s*engineer|hardware\s*(?:design\s*)?engineer|fpga\s*engineer|pcb\s*designer|مهندس\s*(?:إلكترونيات|الكترونيات))/i,
  biomedical: /(biomedical\s*engineer|clinical\s*engineer|medical\s*equipment\s*engineer|field\s*service\s*engineer\s*[-–(]?\s*(?:medical|biomedical|imaging)|مهندس\s*أجهزة\s*طبية)/i,
  planning: /(planning\s*engineer|\bplanner\b|project\s*controls?\s*engineer|\bscheduler\b|planning\s*(?:and|&)\s*(?:control|cost\s*control)\s*engineer|مهندس\s*تخطيط)/i,
  quality: /(qa\s*\/?\s*qc\s*engineer|quality\s*(?:control\s*|assurance\s*)?engineer|\bqc\s*engineer|quality\s*(?:inspector|manager)|welding\s*inspector|مهندس\s*جودة)/i,
  hse: /(hse\s*(?:engineer|officer|manager|supervisor)|safety\s*(?:engineer|officer|manager)|ehs\s*(?:engineer|specialist)|مهندس\s*سلامة|مسؤول\s*سلامة)/i
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
