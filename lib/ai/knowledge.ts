/**
 * =====================================================================
 *  MEP LAB AI — domain knowledge injected into every CV review.
 *  عدّل هنا براحتك: كل ما المعرفة دي تبقى أدق، التقييم بيبقى أذكى.
 * =====================================================================
 */
import type { Market } from '@/lib/cv/data';

type Rubric = { must: string[]; plus: string[]; software: string[]; codes: string[]; red_flags: string[]; seniority: string };

export const ROLE_RUBRICS: Record<string, Rubric> = {
  hvac_design: {
    must: ['cooling/heating load calculation', 'duct design & sizing', 'chilled water / DX / VRF system design', 'equipment selection (chillers, AHU, FCU, pumps, fans)', 'ventilation & IAQ', 'design drawings & calculation reports'],
    plus: ['energy modelling', 'smoke management / stair pressurisation', 'healthcare / lab / data-centre HVAC', 'CFD', 'value engineering'],
    software: ['Carrier HAP or Trane TRACE', 'Revit MEP', 'AutoCAD', 'duct sizer / pipe sizing tools', 'Excel calcs'],
    codes: ['ASHRAE 62.1 / 90.1 / 55', 'ASHRAE 170 (healthcare)', 'SMACNA', 'NFPA 90A / 92'],
    red_flags: ['only lists software without design outputs', 'no project types or sizes', 'no mention of calculations'],
    seniority: 'Senior: leads design packages, reviews juniors, coordinates with consultant/client. Lead: owns discipline on large projects, design reviews, sign-off.'
  },
  bim: {
    must: ['Revit MEP modelling (HVAC/plumbing/fire)', 'clash detection & coordination', 'LOD 300-400 models', 'shop/coordination drawings from model', 'families & templates', 'model QA/QC'],
    plus: ['Dynamo / pyRevit / add-in development', 'BIM 360 / ACC / CDE workflows', 'ISO 19650 & BEP', '4D/5D', 'scan-to-BIM'],
    software: ['Revit', 'Navisworks', 'AutoCAD', 'BIM 360 / ACC', 'Dynamo'],
    codes: ['ISO 19650', 'project BIM Execution Plan', 'MEP design codes awareness (ASHRAE/NFPA)'],
    red_flags: ['"BIM" claimed without model size, LOD or coordination results', 'no mention of clash numbers or federated models'],
    seniority: 'Senior/Coordinator: runs coordination meetings, owns MEP federated model, sets standards. Manager: BEP, CDE, team & deliverables.'
  },
  fire: {
    must: ['sprinkler system design', 'hydraulic calculations', 'fire pump sizing & pump room layout', 'standpipe / hose reel', 'clean agent / special systems', 'civil-defence submissions'],
    plus: ['foam / deluge / water-mist', 'fire alarm interface', 'smoke control', 'warehouse / high-piled storage design'],
    software: ['Elite Fire / FireCAD / AutoSPRINK', 'Revit', 'AutoCAD'],
    codes: ['NFPA 13 / 14 / 20 / 24 / 25', 'NFPA 2001', 'local fire code (SBC 801 / UAE Fire & Life Safety Code / Egyptian fire code)'],
    red_flags: ['no hydraulic calcs', 'no authority approvals mentioned'],
    seniority: 'Senior: owns fire package & authority approvals. Lead: multi-project review, value engineering.'
  },
  plumbing: {
    must: ['water supply & booster pump sizing', 'drainage & vent design', 'storm water', 'hot water systems', 'fixture unit calcs', 'tank sizing'],
    plus: ['irrigation', 'grey-water / sustainability', 'gas systems', 'medical gases'],
    software: ['AutoCAD', 'Revit', 'Excel calcs'],
    codes: ['IPC / UPC', 'local plumbing code (SBC 701 / Egyptian plumbing code)'],
    red_flags: ['no sizing/calculation evidence'],
    seniority: 'Senior: complete public-health packages for large buildings.'
  },
  site: {
    must: ['installation supervision', 'method statements & inspection requests', 'testing & commissioning', 'subcontractor & manpower management', 'progress reporting', 'handover & snagging'],
    plus: ['planning (P6)', 'HSE', 'QA/QC', 'material approvals'],
    software: ['AutoCAD', 'MS Project / Primavera', 'Excel'],
    codes: ['project specifications', 'ASHRAE/SMACNA installation standards', 'NFPA testing requirements'],
    red_flags: ['no project names/values', 'no T&C or handover experience'],
    seniority: 'Senior: leads MEP site team. Lead/Manager: whole MEP execution, budget & programme.'
  },
  tech_office: {
    must: ['shop drawings', 'material submittals', 'RFIs', 'as-built drawings', 'coordination drawings', 'consultant comments closure'],
    plus: ['quantity surveying', 'Revit coordination', 'document control'],
    software: ['AutoCAD', 'Revit', 'Navisworks', 'Aconex'],
    codes: ['project specifications', 'consultant standards'],
    red_flags: ['no volumes (number of drawings/submittals)'],
    seniority: 'Senior: leads technical office for MEP package.'
  },
  estimation: {
    must: ['quantity take-off', 'BOQ preparation', 'pricing & quotations', 'tender analysis', 'subcontractor/supplier comparison'],
    plus: ['variations & claims', 'cost control', 'value engineering'],
    software: ['Excel (advanced)', 'PlanSwift / Bluebeam', 'AutoCAD', 'Candy or similar'],
    codes: ['CESMM / POMI awareness', 'contract basics (FIDIC)'],
    red_flags: ['no tender values or win rates'],
    seniority: 'Senior: leads MEP estimation for tenders; Manager: pricing strategy.'
  },
  pm: {
    must: ['MEP project delivery', 'planning & scheduling', 'budget & cost control', 'client/consultant management', 'team leadership', 'risk management'],
    plus: ['PMP', 'contract management (FIDIC)', 'claims', 'commissioning management'],
    software: ['Primavera P6', 'MS Project', 'Excel'],
    codes: ['FIDIC', 'PMI practices'],
    red_flags: ['no project values, team sizes or outcomes'],
    seniority: 'Manager: P&L, multiple projects, stakeholders.'
  },
  sales: {
    must: ['HVAC product application & selection', 'technical proposals', 'client/consultant relationships', 'sales targets'],
    plus: ['CRM', 'after-sales', 'specification influencing with consultants'],
    software: ['manufacturer selection software', 'CRM', 'Excel'],
    codes: ['AHRI ratings', 'ASHRAE basics'],
    red_flags: ['no targets or achieved revenue'],
    seniority: 'Senior: key accounts & consultant specifying.'
  },
  fm: {
    must: ['planned preventive maintenance', 'breakdown troubleshooting', 'chiller plant operation', 'CMMS / work orders', 'spare parts & contractors'],
    plus: ['BMS', 'energy savings', 'SLA/KPI management'],
    software: ['CMMS (Maximo / SAP PM / similar)', 'BMS front-ends', 'Excel'],
    codes: ['manufacturer O&M', 'ASHRAE 180', 'NFPA 25 for fire systems'],
    red_flags: ['no asset size or KPIs'],
    seniority: 'Senior: site maintenance lead; Manager: FM contract.'
  }
};

export const MARKET_NOTES: Record<Market, string> = {
  sa: 'Saudi Arabia: Saudi Council of Engineers (SCE) professional accreditation is expected for engineers; mention it if held. Saudi Building Code (SBC 501 mechanical, SBC 601/602 energy, SBC 701 plumbing, SBC 801 fire) and Civil Defense approvals add value. Giga-project / government experience (e.g. NEOM, Red Sea, airports, Aramco standards) is attractive. Iqama transferability / notice period is often asked.',
  ae: 'UAE: Dubai Civil Defence / UAE Fire & Life Safety Code, Dubai Municipality and green-building rules (Al Sa\'fat in Dubai, Estidama in Abu Dhabi) add value. Local UAE experience and visa status / availability are commonly asked. Concise 2-page English CVs are the norm.',
  eg: 'Egypt: Egyptian Engineers Syndicate membership is expected; Egyptian codes (HVAC code, fire-protection code) add value. For male candidates employers often ask about military-service status. Gulf / consultant-office experience is valued. English CVs are standard for consultants and international contractors.'
};

export function knowledgeFor(roleId: string, market: Market) {
  const r = ROLE_RUBRICS[roleId] || ROLE_RUBRICS.hvac_design;
  return `ROLE RUBRIC
- Must-have: ${r.must.join('; ')}
- Strong plus: ${r.plus.join('; ')}
- Expected software: ${r.software.join('; ')}
- Codes/standards: ${r.codes.join('; ')}
- Red flags: ${r.red_flags.join('; ')}
- Seniority expectations: ${r.seniority}

MARKET NOTES
${MARKET_NOTES[market]}`;
}
