/**
 * =====================================================================
 *  MEP LAB ATS — Skills knowledge graph (taxonomy)
 *  كل مهارة ليها: معرّف، اسم، كل الأسماء والمرادفات والاختصارات اللي
 *  ممكن تتكتب بيها في الـ CV أو إعلان الوظيفة، وأهميتها لكل تخصص (0–3).
 *  زوّد مرادفات أو مهارات براحتك — المحرك والتدريب بيقروا من هنا.
 * =====================================================================
 */

export type Cat = 'design' | 'systems' | 'fire' | 'plumbing' | 'software' | 'codes' | 'execution' | 'office' | 'commercial' | 'management' | 'cert';

export type Skill = {
  id: string;
  label: string;
  cat: Cat;
  syn: string[]; // lower-case synonyms / spellings / abbreviations
  roles: Partial<Record<string, number>>; // importance per role id (0-3)
};

const s = (id: string, label: string, cat: Cat, syn: string[], roles: Skill['roles']): Skill => ({ id, label, cat, syn, roles });

export const SKILLS: Skill[] = [
  /* ---------------- HVAC design ---------------- */
  s('load_calc', 'Cooling/heating load calculation', 'design', ['cooling load', 'heat load', 'heating load', 'load calculation', 'load calc', 'load estimation', 'thermal load', 'hvac load', 'حساب الأحمال', 'الأحمال الحرارية'], { hvac_design: 3, sales: 1 }),
  s('duct_design', 'Duct design & sizing', 'design', ['duct design', 'duct sizing', 'ductwork design', 'duct layout', 'equal friction', 'static regain', 'ductulator', 'duct sizer', 'تصميم الدكت', 'مجاري الهواء'], { hvac_design: 3, bim: 1 }),
  s('pipe_design', 'Chilled-water / refrigerant pipe sizing', 'design', ['pipe sizing', 'piping design', 'chilled water piping', 'refrigerant piping', 'hydronic', 'pump head', 'pipe network'], { hvac_design: 2, plumbing: 1 }),
  s('equip_sel', 'Equipment selection', 'design', ['equipment selection', 'chiller selection', 'ahu selection', 'fan selection', 'pump selection', 'equipment sizing', 'selection of equipment', 'اختيار المعدات'], { hvac_design: 3, sales: 2 }),
  s('esp', 'Static pressure / fan calculations', 'design', ['external static pressure', 'static pressure calculation', 'esp calculation', 'fan static', 'pressure drop calculation'], { hvac_design: 2 }),
  s('ventilation', 'Ventilation & IAQ', 'design', ['ventilation', 'fresh air', 'outdoor air', 'iaq', 'indoor air quality', 'exhaust system', 'car park ventilation', 'kitchen exhaust', 'jet fans', 'تهوية'], { hvac_design: 2, fm: 1 }),
  s('psychro', 'Psychrometrics', 'design', ['psychrometric', 'psychrometrics', 'psychrometric chart', 'humidity control', 'dehumidification'], { hvac_design: 2 }),
  s('smoke', 'Smoke management / pressurisation', 'design', ['smoke management', 'smoke control', 'smoke extract', 'stair pressurization', 'stair pressurisation', 'staircase pressurization', 'nfpa 92', 'smoke exhaust'], { hvac_design: 2, fire: 2 }),
  s('energy', 'Energy modelling & efficiency', 'design', ['energy model', 'energy modeling', 'energy modelling', 'energy analysis', 'energy management', 'energy saving', 'energy savings', 'energy audit', 'ies ve', 'equest', 'energyplus', 'energy efficiency', 'leed'], { hvac_design: 1, fm: 1 }),
  s('cfd', 'CFD analysis', 'design', ['cfd', 'computational fluid dynamics', 'ansys fluent', 'airflow simulation'], { hvac_design: 1 }),
  s('healthcare', 'Healthcare / critical HVAC', 'design', ['hospital', 'healthcare', 'operating theatre', 'operating room', 'isolation room', 'clean room', 'cleanroom', 'laboratory hvac', 'lab hvac', 'data center', 'data centre'], { hvac_design: 2, site: 1 }),
  s('design_reports', 'Design reports & calculations', 'design', ['design report', 'basis of design', 'design criteria', 'design calculations', 'calculation report', 'design brief'], { hvac_design: 2, fire: 1, plumbing: 1 }),

  /* ---------------- HVAC systems ---------------- */
  s('chw', 'Chilled-water systems', 'systems', ['chilled water', 'chw', 'chiller', 'chillers', 'cooling tower', 'district cooling', 'ets', 'energy transfer station', 'tes', 'thermal storage'], { hvac_design: 3, site: 2, fm: 2, sales: 2 }),
  s('ahu_fcu', 'AHU / FCU / FAHU', 'systems', ['ahu', 'air handling unit', 'fcu', 'fan coil', 'fahu', 'fresh air handling unit', 'hrw', 'heat recovery'], { hvac_design: 2, site: 2, fm: 2, sales: 1 }),
  s('vrf', 'VRF / DX systems', 'systems', ['vrf', 'vrv', 'variable refrigerant', 'dx system', 'split unit', 'split units', 'package unit', 'packaged unit', 'rooftop unit', 'rtu'], { hvac_design: 2, site: 1, sales: 2, fm: 1 }),
  s('vav', 'VAV systems', 'systems', ['vav', 'variable air volume'], { hvac_design: 2 }),
  s('bms', 'BMS / controls', 'systems', ['bms', 'building management system', 'controls', 'ddc', 'sequence of operation', 'scada'], { fm: 2, hvac_design: 1, site: 1 }),
  s('tab', 'Testing, adjusting & balancing', 'systems', ['testing and balancing', 'testing adjusting and balancing', 'tab works', 'tab contractor', 'air balancing', 'water balancing'], { site: 2, fm: 1 }),

  /* ---------------- Fire ---------------- */
  s('sprinkler', 'Sprinkler system design', 'fire', ['sprinkler', 'sprinklers', 'wet riser', 'dry riser', 'fire sprinkler', 'رشاشات'], { fire: 3, bim: 1 }),
  s('hydraulic', 'Hydraulic calculations', 'fire', ['hydraulic calculation', 'hydraulic calculations', 'hydraulic calc', 'hydraulic analysis', 'hazen williams'], { fire: 3, plumbing: 1 }),
  s('fire_pump', 'Fire pumps & pump rooms', 'fire', ['fire pump', 'fire pumps', 'jockey pump', 'diesel pump', 'pump room', 'nfpa 20'], { fire: 2, site: 1 }),
  s('standpipe', 'Standpipe / hose reel / hydrants', 'fire', ['standpipe', 'hose reel', 'hose cabinet', 'landing valve', 'fire hydrant', 'hydrant', 'nfpa 14'], { fire: 2 }),
  s('special_fire', 'Clean agent / foam / deluge', 'fire', ['fm200', 'fm-200', 'novec', 'clean agent', 'co2 system', 'foam system', 'deluge', 'water mist', 'pre-action', 'preaction', 'nfpa 2001'], { fire: 2 }),
  s('ff_systems', 'Fire-fighting systems (general)', 'fire', ['fire fighting', 'fire-fighting', 'firefighting', 'fire protection system', 'fire protection systems', 'fire systems', 'مكافحة الحريق', 'الحريق'], { site: 2, tech_office: 1, plumbing: 1, fm: 1, fire: 1 }),
  s('fire_alarm', 'Fire alarm interface', 'fire', ['fire alarm', 'fire detection', 'facp', 'fire alarm interface'], { fire: 1, fm: 1 }),
  s('civil_defense', 'Civil-defence approvals', 'fire', ['civil defense', 'civil defence', 'dcd', 'dcd approval', 'authority approval', 'الدفاع المدني'], { fire: 3, tech_office: 1 }),

  /* ---------------- Plumbing ---------------- */
  s('water_supply', 'Water supply & booster pumps', 'plumbing', ['water supply', 'domestic water', 'booster pump', 'booster pumps', 'water distribution', 'water tank', 'تغذية'], { plumbing: 3 }),
  s('drainage', 'Drainage & vent', 'plumbing', ['drainage', 'soil and waste', 'vent system', 'sewage', 'sewer', 'manhole', 'grease trap', 'صرف'], { plumbing: 3 }),
  s('storm', 'Storm water', 'plumbing', ['storm water', 'stormwater', 'rain water', 'rainwater'], { plumbing: 2 }),
  s('hot_water', 'Hot water systems', 'plumbing', ['hot water', 'water heater', 'calorifier', 'solar water'], { plumbing: 2 }),
  s('fixture_units', 'Fixture-unit sizing', 'plumbing', ['fixture unit', 'fixture units', 'wsfu', 'dfu', 'loading units'], { plumbing: 2 }),
  s('med_gas', 'Medical gases', 'plumbing', ['medical gas', 'medical gases', 'mgps', 'htm 02-01', 'nfpa 99'], { plumbing: 1, hvac_design: 1 }),

  /* ---------------- Software ---------------- */
  s('revit', 'Revit / Revit MEP', 'software', ['revit', 'revit mep', 'autodesk revit'], { bim: 3, hvac_design: 2, fire: 1, plumbing: 1, tech_office: 1 }),
  s('navis', 'Navisworks', 'software', ['navisworks', 'navis works'], { bim: 3, tech_office: 1 }),
  s('autocad', 'AutoCAD', 'software', ['autocad', 'auto cad', 'cad drafting'], { tech_office: 2, hvac_design: 1, fire: 1, plumbing: 1, site: 1, estimation: 1 }),
  s('hap', 'Carrier HAP / TRACE', 'software', ['hap', 'carrier hap', 'hourly analysis program', 'trace 700', 'trace 3d', 'elite chvac', 'chvac'], { hvac_design: 3 }),
  s('fire_sw', 'Fire design software', 'software', ['elite fire', 'firecad', 'autosprink', 'hydracad', 'pipenet', 'sprinkcad'], { fire: 2 }),
  s('dynamo', 'Dynamo / scripting', 'software', ['dynamo', 'pyrevit', 'revit api', 'c#', 'python scripting', 'add-in', 'addin', 'plugin development'], { bim: 2 }),
  s('cde', 'BIM 360 / ACC / CDE', 'software', ['bim 360', 'bim360', 'acc', 'autodesk construction cloud', 'common data environment', 'cde', 'aconex', 'procore', 'projectwise'], { bim: 2, tech_office: 1 }),
  s('primavera', 'Primavera / MS Project', 'software', ['primavera', 'p6', 'ms project', 'microsoft project'], { pm: 3, site: 1 }),
  s('excel', 'Advanced Excel', 'software', ['excel', 'advanced excel', 'spreadsheets', 'vba', 'power bi'], { estimation: 2, pm: 1 }),
  s('estimating_sw', 'Take-off software', 'software', ['planswift', 'bluebeam', 'cubit', 'candy', 'costx'], { estimation: 2 }),
  s('cmms', 'CMMS', 'software', ['cmms', 'maximo', 'sap pm', 'cafm', 'work order', 'work orders'], { fm: 3 }),
  s('crm', 'CRM', 'software', ['crm', 'salesforce', 'hubspot'], { sales: 2 }),

  /* ---------------- Codes & standards ---------------- */
  s('ashrae', 'ASHRAE standards', 'codes', ['ashrae', 'ashrae 62.1', 'ashrae 90.1', 'ashrae 55', 'ashrae 170', 'ashrae handbook'], { hvac_design: 3, sales: 1, fm: 1 }),
  s('smacna', 'SMACNA', 'codes', ['smacna'], { hvac_design: 2, site: 1 }),
  s('nfpa', 'NFPA codes', 'codes', ['nfpa', 'nfpa 13', 'nfpa 25', 'nfpa 72', 'nfpa 90a', 'nfpa 101'], { fire: 3, hvac_design: 1 }),
  s('plumb_code', 'IPC / UPC', 'codes', ['ipc', 'upc', 'international plumbing code', 'uniform plumbing code', 'bs en 12056'], { plumbing: 3 }),
  s('sbc', 'Saudi Building Code', 'codes', ['sbc', 'saudi building code', 'sbc 501', 'sbc 601', 'sbc 701', 'sbc 801'], { hvac_design: 1, fire: 1, plumbing: 1 }),
  s('uae_code', 'UAE codes (fire / green building)', 'codes', ['uae fire code', 'uae fire and life safety code', 'estidama', 'al sa\'fat', 'dewa', 'dubai municipality'], { fire: 1, hvac_design: 1 }),
  s('eg_code', 'Egyptian codes', 'codes', ['egyptian code', 'الكود المصري'], { hvac_design: 1, fire: 1, plumbing: 1 }),
  s('iso19650', 'ISO 19650 / BEP', 'codes', ['iso 19650', 'bim execution plan', 'bep', 'eir', 'pas 1192'], { bim: 2 }),
  s('fidic', 'FIDIC / contracts', 'codes', ['fidic', 'contract management', 'contract administration'], { pm: 2, estimation: 1 }),

  /* ---------------- BIM workflow ---------------- */
  s('clash', 'Clash detection & coordination', 'execution', ['clash detection', 'clash avoidance', 'clash resolution', 'clash report', 'mep coordination', 'coordination meetings', 'federated model', 'interdisciplinary coordination'], { bim: 3, tech_office: 2 }),
  s('lod', 'LOD 300–500 modelling', 'execution', ['lod 300', 'lod 350', 'lod 400', 'lod 500', 'lod'], { bim: 2 }),
  s('families', 'Revit families & templates', 'execution', ['revit families', 'families', 'family creation', 'templates', 'shared parameters', 'duct modeling', 'duct modelling', 'pipe modeling', 'pipe modelling', 'mep modeling', 'mep modelling', 'hvac modeling', 'hvac modelling', '3d modeling', '3d modelling'], { bim: 2 }),
  s('scan2bim', 'Scan-to-BIM / point cloud', 'execution', ['scan to bim', 'scan-to-bim', 'point cloud', 'laser scan', 'recap'], { bim: 1 }),

  /* ---------------- Site execution ---------------- */
  s('installation', 'Installation supervision', 'execution', ['installation', 'supervision', 'site supervision', 'site execution', 'erection', 'تنفيذ', 'إشراف'], { site: 3, fm: 1 }),
  s('tnc', 'Testing & commissioning', 'execution', ['testing and commissioning', 't&c', 'commissioning', 'pre-commissioning', 'pressure test', 'hydrostatic test', 'start-up'], { site: 3, fm: 1, fire: 1 }),
  s('ms_ir', 'Method statements & IRs', 'execution', ['method statement', 'method statements', 'inspection request', 'inspection requests', 'wir', 'mir', 'itp'], { site: 2, tech_office: 1 }),
  s('handover', 'Handover & snagging', 'execution', ['handover', 'snag list', 'snagging', 'punch list', 'o&m manuals'], { site: 2, fm: 1 }),
  s('subcon', 'Subcontractor & manpower management', 'execution', ['subcontractor', 'subcontractors', 'manpower', 'foremen', 'labour'], { site: 2, pm: 1 }),
  s('hse', 'HSE', 'execution', ['hse', 'health and safety', 'osha', 'nebosh', 'iosh'], { site: 1, fm: 1 }),
  s('qaqc', 'QA/QC', 'execution', ['qa/qc', 'quality control', 'quality assurance', 'ncr'], { site: 1 }),

  /* ---------------- Technical office ---------------- */
  s('shop_dwg', 'Shop drawings', 'office', ['shop drawing', 'shop drawings', 'coordination drawings', 'combined services', 'csd', 'رسومات تنفيذية'], { tech_office: 3, bim: 2, site: 1 }),
  s('submittals', 'Material submittals', 'office', ['submittal', 'submittals', 'material submittal', 'material approval', 'technical submittal', 'prequalification'], { tech_office: 3, site: 1, sales: 1 }),
  s('rfi', 'RFIs & consultant comments', 'office', ['rfi', 'rfis', 'request for information', 'consultant comments', 'technical queries'], { tech_office: 2, bim: 1 }),
  s('asbuilt', 'As-built drawings', 'office', ['as-built', 'as built', 'asbuilt', 'record drawings'], { tech_office: 2, bim: 1, site: 1 }),
  s('doc_control', 'Document control', 'office', ['document control', 'transmittal', 'transmittals'], { tech_office: 1 }),

  /* ---------------- Commercial ---------------- */
  s('qto', 'Quantity take-off', 'commercial', ['quantity take-off', 'quantity takeoff', 'take off', 'take-off', 'quantity survey', 'quantity surveying', 'حصر'], { estimation: 3, tech_office: 1 }),
  s('boq', 'BOQ preparation', 'commercial', ['boq', 'bill of quantities', 'bills of quantities'], { estimation: 3, tech_office: 1 }),
  s('pricing', 'Pricing & tendering', 'commercial', ['pricing', 'tender', 'tendering', 'bidding', 'quotation', 'quotations', 'cost estimate', 'cost estimation', 'estimation engineer', 'mep estimation', 'tender estimation', 'estimator', 'تسعير'], { estimation: 3, sales: 2 }),
  s('variations', 'Variations & claims', 'commercial', ['variation order', 'variations', 'claims', 'change order'], { estimation: 2, pm: 2 }),
  s('cost_control', 'Cost control', 'commercial', ['cost control', 'budget control', 'budget management', 'managing budget', 'manage budget', 'budget', 'cost report', 'cash flow', 'procurement'], { pm: 2, estimation: 2 }),
  s('value_eng', 'Value engineering', 'commercial', ['value engineering', 've proposal', 'cost optimization'], { hvac_design: 1, estimation: 1, pm: 1 }),
  s('sales', 'Sales & targets', 'commercial', ['sales', 'sales target', 'sales targets', 'revenue', 'business development', 'key account', 'key accounts', 'key account management', 'client relationship', 'negotiation', 'negotiating', 'closing deals', 'مبيعات', 'تفاوض'], { sales: 3 }),
  s('application', 'Product application', 'commercial', ['application engineer', 'product selection', 'technical proposal', 'technical proposals', 'techno-commercial', 'techno commercial', 'technical offer', 'technical offers', 'commercial offer', 'selection software', 'product application'], { sales: 3 }),

  /* ---------------- Management ---------------- */
  s('planning', 'Planning & scheduling', 'management', ['planning', 'scheduling', 'schedule', 'programme', 'baseline', 'look ahead'], { pm: 3, site: 1 }),
  s('team_lead', 'Team leadership', 'management', ['team lead', 'team leader', 'team leadership', 'led a team', 'lead a team', 'leading a team', 'managed a team', 'manage a team', 'lead team of', 'led team of', 'team of', 'supervised engineers', 'supervise engineers', 'mentoring', 'mentored', 'line manager'], { pm: 2, bim: 1, hvac_design: 1, site: 1 }),
  s('stakeholders', 'Client & consultant management', 'management', ['stakeholder', 'stakeholders', 'client meetings', 'consultant meetings', 'client management'], { pm: 2, sales: 1 }),
  s('risk', 'Risk management', 'management', ['risk management', 'risk register', 'risk assessment'], { pm: 2 }),
  s('ppm', 'Preventive maintenance', 'management', ['preventive maintenance', 'planned preventive', 'ppm', 'predictive maintenance', 'maintenance schedule', 'hvac maintenance', 'mep maintenance', 'maintenance of hvac', 'maintenance engineer', 'صيانة'], { fm: 3 }),
  s('troubleshoot', 'Troubleshooting & breakdowns', 'management', ['troubleshooting', 'breakdown', 'fault finding', 'corrective maintenance', 'root cause'], { fm: 3, site: 1 }),
  s('fm', 'Facility management', 'management', ['facility management', 'facilities management', 'fm contract', 'sla', 'kpi', 'kpis'], { fm: 3 }),

  /* ---------------- Certifications ---------------- */
  s('pmp', 'PMP', 'cert', ['pmp', 'project management professional'], { pm: 3, site: 1 }),
  s('leed_ap', 'LEED AP / green building', 'cert', ['leed ap', 'leed green associate', 'estidama pqp', 'wells ap'], { hvac_design: 1 }),
  s('sce', 'Saudi Council of Engineers', 'cert', ['saudi council of engineers', 'sce', 'sce membership', 'sce accreditation', 'saudi engineering council', 'الهيئة السعودية للمهندسين'], {}),
  s('syndicate', 'Egyptian Engineers Syndicate', 'cert', ['engineers syndicate', 'syndicate of engineers', 'نقابة المهندسين'], {}),
  s('autodesk_cert', 'Autodesk certification', 'cert', ['autodesk certified', 'revit certified professional', 'autodesk certified professional'], { bim: 1 }),
  s('cfps', 'NFPA certification (CFPS/CFI)', 'cert', ['cfps', 'cfi', 'nicet', 'certified fire protection specialist'], { fire: 2 }),
  s('cem', 'Energy manager (CEM)', 'cert', ['cem', 'certified energy manager'], { fm: 1, hvac_design: 1 })
];

export const SKILL_BY_ID = new Map(SKILLS.map((k) => [k.id, k]));
