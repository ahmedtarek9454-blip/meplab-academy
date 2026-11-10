/**
 * Skills for disciplines outside MEP (same format as taxonomy.ts).
 * syn = every spelling / abbreviation a CV or job post may use (lower-case).
 * roles = importance for each role id (0-3).
 */
import type { Skill } from './taxonomy';

const s = (id: string, label: string, cat: Skill['cat'], syn: string[], roles: Skill['roles']): Skill => ({ id, label, cat, syn, roles });

export const EXTRA_SKILLS: Skill[] = [
  /* ---------------- Civil site ---------------- */
  s('concrete', 'Concrete works', 'civil', ['concrete works', 'concrete pouring', 'reinforced concrete works', 'rc works', 'ready mix', 'cube test', 'slump test', 'curing', 'خرسانة', 'صب الخرسانة'], { civil_site: 3, quality: 1 }),
  s('formwork', 'Formwork & reinforcement', 'civil', ['formwork', 'shuttering', 'reinforcement', 'rebar', 'steel fixing', 'bar bending schedule', 'bbs', 'نجارة مسلحة', 'حدادة مسلحة', 'تسليح'], { civil_site: 3, structural: 1 }),
  s('earthworks', 'Excavation & earthworks', 'civil', ['excavation', 'backfilling', 'backfill', 'earthworks', 'earth works', 'dewatering', 'compaction', 'grading', 'حفر', 'ردم'], { civil_site: 2, infra: 3 }),
  s('finishing', 'Finishing works', 'civil', ['finishing works', 'finishes', 'blockwork', 'block work', 'masonry', 'plastering', 'tiling', 'painting works', 'waterproofing', 'تشطيبات', 'مباني', 'عزل'], { civil_site: 3, interior: 2, architect: 1 }),
  s('piling', 'Piling & foundations works', 'civil', ['piling', 'piles', 'pile cap', 'raft foundation', 'shallow foundations', 'deep foundations', 'خوازيق', 'أساسات'], { civil_site: 2, structural: 2 }),
  s('steel_erect', 'Steel structure erection', 'civil', ['steel structure erection', 'steel erection', 'structural steel works', 'pre-engineered buildings', 'peb'], { civil_site: 2, structural: 1 }),

  /* ---------------- Structural design ---------------- */
  s('etabs', 'ETABS / SAP2000 / SAFE', 'structural', ['etabs', 'csi safe', 'safe software', 'sap2000', 'sap 2000', 'csi bridge'], { structural: 3 }),
  s('staad', 'STAAD / Robot / Tekla / Prokon', 'structural', ['staad', 'staad pro', 'staad.pro', 'robot structural', 'tekla', 'tekla structures', 'prokon', 'ram concept', 'ram structural', 'csc orion'], { structural: 3 }),
  s('struct_design', 'Structural analysis & design', 'structural', ['structural design', 'structural analysis', 'reinforced concrete design', 'rc design', 'steel design', 'steel structure design', 'design of steel structures', 'foundation design', 'slab design', 'تصميم إنشائي'], { structural: 3 }),
  s('struct_loads', 'Seismic / wind / load analysis', 'structural', ['seismic analysis', 'seismic design', 'wind load', 'wind analysis', 'dynamic analysis', 'lateral loads', 'load combinations'], { structural: 2 }),
  s('struct_codes', 'Structural codes (ACI / Eurocode / ECP)', 'structural', ['aci 318', 'aci', 'eurocode', 'eurocode 2', 'bs 8110', 'bs 5950', 'aisc', 'asce 7', 'ubc', 'ecp 203', 'ecp', 'الكود المصري للخرسانة'], { structural: 3 }),
  s('post_tension', 'Post-tension / precast', 'structural', ['post tension', 'post-tensioned', 'post tensioning', 'pt slabs', 'precast', 'pre-cast', 'prestressed'], { structural: 2, civil_site: 1 }),

  /* ---------------- Roads & infrastructure ---------------- */
  s('road_design', 'Road & highway design', 'civil', ['road design', 'highway design', 'geometric design', 'pavement design', 'road works', 'roads', 'highway', 'highways', 'interchange', 'طرق', 'رصف'], { infra: 3 }),
  s('asphalt', 'Asphalt & pavement works', 'civil', ['asphalt', 'asphalt works', 'subgrade', 'subbase', 'base course', 'wearing course', 'marshall test', 'pavement'], { infra: 3, civil_site: 1 }),
  s('utilities', 'Wet & dry utilities networks', 'civil', ['infrastructure works', 'utility networks', 'water networks', 'sewer network', 'sewer networks', 'storm network', 'watergems', 'sewergems', 'stormcad', 'شبكات المرافق', 'بنية تحتية'], { infra: 3 }),
  s('civil3d', 'Civil 3D / OpenRoads', 'software', ['civil 3d', 'civil3d', 'autocad civil', 'openroads', 'microstation', 'infraworks'], { infra: 3, survey: 2 }),
  s('bridges', 'Bridges & culverts', 'civil', ['bridges', 'culvert', 'culverts', 'flyover', 'كباري', 'كوبري'], { infra: 2, structural: 1 }),
  s('traffic', 'Traffic engineering', 'civil', ['traffic engineering', 'traffic study', 'traffic management', 'signage', 'road marking', 'aashto', 'synchro', 'vissim'], { infra: 2 }),

  /* ---------------- Surveying & GIS ---------------- */
  s('total_station', 'Total station & levelling', 'survey', ['total station', 'leveling', 'levelling', 'auto level', 'theodolite', 'setting out', 'set out', 'stake out', 'توتال استيشن', 'ميزانية'], { survey: 3, civil_site: 1 }),
  s('gnss', 'GPS / GNSS / RTK', 'survey', ['gps survey', 'gnss', 'rtk', 'dgps', 'trimble', 'leica', 'sokkia', 'topcon'], { survey: 3 }),
  s('gis', 'GIS (ArcGIS / QGIS)', 'survey', ['arcgis', 'gis analyst', 'gis mapping', 'gis data', 'arcmap', 'arcgis pro', 'qgis', 'geodatabase', 'spatial analysis'], { survey: 3, infra: 1 }),
  s('topo', 'Topographic & cadastral survey', 'survey', ['topographic survey', 'topographical survey', 'topo survey', 'cadastral', 'as-built survey', 'hydrographic', 'photogrammetry', 'drone survey', 'uav survey', 'رفع مساحي'], { survey: 3 }),

  /* ---------------- Architecture & interior ---------------- */
  s('arch_design', 'Architectural design', 'arch', ['architectural design', 'architectural concept', 'architectural detailing', 'design competitions', 'facade design', 'master planning', 'urban design', 'urban planning', 'landscape design', 'تصميم معماري'], { architect: 3, interior: 1 }),
  s('archicad', 'Revit Architecture / ArchiCAD / Rhino', 'software', ['archicad', 'rhino', 'rhinoceros', 'grasshopper', 'revit architecture', 'vectorworks'], { architect: 3 }),
  s('viz', '3D visualisation (3ds Max / V-Ray / Lumion)', 'software', ['3ds max', '3dsmax', '3d max', 'v-ray', 'vray', 'lumion', 'enscape', 'twinmotion', 'corona', 'corona renderer', 'd5 render', 'sketchup', 'sketch up', 'rendering', 'visualization', 'visualisation'], { architect: 2, interior: 3 }),
  s('adobe', 'Adobe Photoshop / Illustrator / InDesign', 'software', ['photoshop', 'illustrator', 'indesign', 'adobe creative', 'adobe suite', 'premiere'], { architect: 1, interior: 2 }),
  s('interior_design', 'Interior design & space planning', 'arch', ['interior design', 'interior designer', 'interior fit-out', 'space planning', 'furniture layout', 'ff&e', 'ffe', 'material selection', 'materials selection', 'mood board', 'moodboard', 'joinery', 'lighting concept', 'تصميم داخلي', 'ديكور'], { interior: 3, architect: 1 }),

  /* ---------------- Electrical design ---------------- */
  s('lighting', 'Lighting design (DIALux / Relux)', 'electrical', ['lighting design', 'lighting calculation', 'lighting calculations', 'dialux', 'relux', 'lux level', 'illumination', 'emergency lighting'], { elec_design: 3 }),
  s('power_dist', 'Power distribution & load schedules', 'electrical', ['power distribution', 'load schedule', 'load schedules', 'smdb', 'mdb', 'db schedule', 'distribution boards', 'panel schedule', 'small power', 'electrical load calculation', 'electrical loads', 'لوحات توزيع'], { elec_design: 3, elec_site: 1 }),
  s('cable_sizing', 'Cable sizing / voltage drop / short circuit', 'electrical', ['cable sizing', 'voltage drop', 'short circuit', 'short-circuit calculation', 'fault level', 'discrimination study', 'selectivity', 'earthing calculation'], { elec_design: 3, power: 2 }),
  s('elec_sw', 'ETAP / Ecodial / Amtech / DIgSILENT', 'software', ['etap', 'ecodial', 'amtech', 'prodesign', 'digsilent', 'powerfactory', 'pss/e', 'psse', 'skm', 'neplan', 'caneco'], { elec_design: 2, power: 3 }),
  s('sld', 'Single-line diagrams', 'electrical', ['single line diagram', 'single-line diagram', 'sld', 'schematic diagrams', 'riser diagram'], { elec_design: 2, power: 2, elec_site: 1 }),
  s('elec_codes', 'Electrical codes (IEC / BS 7671 / NEC)', 'electrical', ['iec', 'iec 60364', 'bs 7671', 'nec', 'nfpa 70', 'ieee', 'sasec', 'saudi electricity code', 'kahramaa', 'adwea'], { elec_design: 3, power: 2, elec_site: 1 }),
  s('earthing', 'Earthing & lightning protection', 'electrical', ['earthing', 'grounding', 'earthing system', 'lightning protection', 'lps', 'تأريض'], { elec_design: 2, elec_site: 2, power: 1 }),
  s('genset_ups', 'Generators / UPS / transformers sizing', 'electrical', ['generator sizing', 'diesel generator', 'generators', 'ups', 'ups sizing', 'ats panel', 'transformer sizing', 'capacitor bank', 'power factor correction'], { elec_design: 2, elec_site: 1, power: 1 }),
  s('elec_install', 'Electrical installation (cables, trays, panels)', 'electrical', ['cable pulling', 'cable laying', 'cable termination', 'cable tray', 'cable trays', 'trunking', 'conduits', 'conduit', 'panel installation', 'switchgear installation', 'electrical installation', 'electrical works', 'تمديدات كهربائية'], { elec_site: 3 }),
  s('elec_testing', 'Electrical testing & energisation', 'electrical', ['megger', 'insulation resistance', 'continuity test', 'loop impedance', 'energization', 'energisation', 'hi-pot', 'hipot', 'primary injection', 'secondary injection', 'commissioning of electrical'], { elec_site: 3, power: 2 }),

  /* ---------------- Power systems ---------------- */
  s('substation', 'Substations (MV / HV)', 'electrical', ['substation', 'substations', 'gis substation', 'ais substation', '11kv', '13.8kv', '22kv', '33kv', '66kv', '132kv', '220kv', '380kv', '500kv', 'medium voltage', 'high voltage', 'mv switchgear', 'hv switchgear', 'محطات محولات', 'جهد عالي', 'جهد متوسط'], { power: 3, elec_site: 1 }),
  s('protection', 'Protection relays & coordination', 'electrical', ['protection relays', 'protection relay', 'relay setting', 'relay settings', 'relay coordination', 'protection coordination', 'protection system', 'distance protection', 'differential protection', 'sel relays', 'siprotec'], { power: 3 }),
  s('transmission', 'Transmission & distribution lines', 'electrical', ['transmission lines', 'transmission line', 'overhead lines', 'overhead line', 'ohl', 'distribution network', 'distribution networks', 'underground cables', 'power grid', 'شبكات توزيع'], { power: 3 }),
  s('renewables', 'Solar PV & renewables', 'electrical', ['solar pv', 'photovoltaic', 'pv plant', 'pv system', 'pvsyst', 'solar energy', 'renewable energy', 'wind farm', 'wind energy', 'bess', 'battery energy storage', 'طاقة شمسية'], { power: 2, elec_design: 1 }),
  s('power_studies', 'Power-system studies', 'electrical', ['load flow', 'power flow', 'transient stability', 'harmonic analysis', 'arc flash', 'grid code', 'power quality'], { power: 3, elec_design: 1 }),

  /* ---------------- ELV ---------------- */
  s('cctv_access', 'CCTV / access control / intrusion', 'electrical', ['cctv', 'access control', 'intrusion alarm', 'intruder alarm', 'video surveillance', 'security systems', 'كاميرات مراقبة'], { elv: 3 }),
  s('elv_systems', 'ELV systems (PA / nurse call / SMATV)', 'electrical', ['elv', 'low current', 'light current', 'extra low voltage', 'public address', 'pa system', 'nurse call', 'smatv', 'iptv', 'mats', 'master antenna', 'intercom', 'تيار خفيف'], { elv: 3 }),
  s('structured_cabling', 'Structured cabling', 'it', ['structured cabling', 'cat6', 'cat 6', 'cat6a', 'data cabling', 'fiber optic cabling', 'patch panels'], { elv: 2, network: 2 }),

  /* ---------------- Mechanical design (non-MEP) ---------------- */
  s('cad3d', 'SolidWorks / CATIA / Creo / Inventor', 'mech', ['solidworks', 'solid works', 'catia', 'creo', 'pro/e', 'proe', 'inventor', 'autodesk inventor', 'siemens nx', 'unigraphics', 'fusion 360', 'solid edge'], { mech_design: 3, production: 1 }),
  s('gdt', 'GD&T & tolerance analysis', 'mech', ['gd&t', 'gdt', 'geometric dimensioning', 'tolerance analysis', 'tolerance stack', 'asme y14.5', 'fits and tolerances'], { mech_design: 3, quality: 1 }),
  s('fea', 'FEA / stress analysis', 'mech', ['fea', 'finite element', 'finite element analysis', 'stress analysis', 'ansys mechanical', 'ansys workbench', 'abaqus', 'static structural', 'fatigue analysis', 'caesar ii', 'caesar'], { mech_design: 3, structural: 1, process: 1 }),
  s('machine_design', 'Machine & product design', 'mech', ['machine design', 'product design', 'jigs and fixtures', 'sheet metal design', 'design of machine elements', 'mechanisms', 'jigs and fixtures', 'sheet metal design', 'weldments', 'prototyping', 'prototype', 'reverse engineering', 'dfm', 'design for manufacturing', 'تصميم ماكينات'], { mech_design: 3, production: 1 }),
  s('drawings_mech', 'Manufacturing drawings & BOM', 'mech', ['manufacturing drawings', 'detail drawings', 'assembly drawings', 'part drawings', 'bill of materials', 'bom', 'engineering change', 'ecn'], { mech_design: 2, production: 1 }),
  s('printing3d', '3D printing / CNC programming', 'mech', ['3d printing', 'additive manufacturing', 'cnc programming', 'mastercam', 'g-code', 'gcode'], { mech_design: 1, production: 2 }),

  /* ---------------- Production & industrial ---------------- */
  s('lean', 'Lean / Six Sigma / Kaizen', 'mech', ['lean manufacturing', 'six sigma', 'lean six sigma', 'green belt', 'black belt', 'yellow belt', 'kaizen', '5s', 'value stream mapping', 'vsm', 'smed', 'poka yoke', 'continuous improvement'], { production: 3, quality: 2 }),
  s('prod_planning', 'Production planning & control', 'mech', ['production planning', 'production control', 'production line', 'production lines', 'assembly line', 'shop floor', 'capacity planning', 'mrp', 'oee', 'line balancing', 'takt time', 'time study', 'motion study', 'industrial engineering', 'تخطيط الإنتاج', 'خطوط الإنتاج'], { production: 3 }),
  s('manufacturing', 'Manufacturing processes', 'mech', ['manufacturing processes', 'welding processes', 'machining', 'cnc machining', 'cnc', 'injection molding', 'injection moulding', 'extrusion', 'casting process', 'forging', 'stamping', 'heat treatment', 'تصنيع', 'لحام'], { production: 3, mech_design: 1, mech_maint: 1 }),
  s('erp', 'ERP (SAP PP / MM / Oracle)', 'software', ['sap pp', 'sap mm', 'sap', 'oracle erp', 'erp', 'odoo', 'dynamics 365'], { production: 2, planning: 1, quality: 1 }),

  /* ---------------- Plant maintenance ---------------- */
  s('rotating', 'Rotating equipment (pumps / compressors / turbines)', 'mech', ['rotating equipment', 'centrifugal pumps', 'gas compressors', 'centrifugal compressors', 'reciprocating compressors', 'gas turbine', 'gas turbines', 'steam turbine', 'turbines', 'gearbox', 'gearboxes', 'blowers', 'mechanical seals'], { mech_maint: 3, petroleum: 1, process: 1 }),
  s('static_eq', 'Static equipment (boilers / vessels / heat exchangers)', 'mech', ['steam boilers', 'industrial boilers', 'shell and tube', 'pressure vessels', 'pressure vessel', 'storage tanks', 'piping integrity', 'asme section viii', 'api 650', 'api 510', 'غلايات'], { mech_maint: 2, process: 2 }),
  s('condition_mon', 'Vibration analysis & condition monitoring', 'mech', ['vibration analysis', 'condition monitoring', 'laser alignment', 'shaft alignment', 'dynamic balancing', 'thermography', 'oil analysis', 'lubrication', 'bearings'], { mech_maint: 3 }),
  s('hyd_pneu', 'Hydraulics & pneumatics', 'mech', ['hydraulics', 'hydraulic systems', 'pneumatics', 'pneumatic systems', 'هيدروليك'], { mech_maint: 2, automation: 1, production: 1 }),
  s('overhaul', 'Shutdowns & overhauls', 'mech', ['overhaul', 'overhauling', 'shutdown', 'turnaround', 'plant shutdown', 'major overhaul', 'tpm', 'total productive maintenance', 'rcm', 'mtbf', 'mttr'], { mech_maint: 3, process: 1 }),

  /* ---------------- Process / chemical ---------------- */
  s('process_sim', 'Aspen HYSYS / Aspen Plus / PRO/II', 'process', ['aspen hysys', 'hysys', 'aspen plus', 'aspen', 'pro/ii', 'pro ii', 'unisim', 'chemcad', 'htri', 'process simulation'], { process: 3 }),
  s('pfd_pid', 'PFD / P&ID / H&MB', 'process', ['pfd', 'p&id', 'p&ids', 'pid diagrams', 'process flow diagram', 'piping and instrumentation', 'heat and material balance', 'h&mb', 'mass balance', 'material balance'], { process: 3, automation: 2 }),
  s('hazop', 'HAZOP / process safety', 'process', ['hazop', 'hazid', 'sil study', 'lopa', 'process safety', 'psm', 'process safety management', 'bowtie'], { process: 2, hse: 2, automation: 1 }),
  s('unit_ops', 'Unit operations', 'process', ['distillation', 'reactor', 'reactors', 'unit operations', 'refinery', 'refining', 'petrochemical', 'petrochemicals', 'gas processing', 'fertilizer', 'fertilizers', 'polymer', 'cement plant', 'pharmaceutical manufacturing'], { process: 3 }),
  s('water_treat', 'Water / wastewater treatment', 'process', ['water treatment', 'wastewater treatment', 'waste water treatment', 'desalination', 'reverse osmosis', 'ro plant', 'stp', 'wwtp', 'etp', 'معالجة المياه'], { process: 2, plumbing: 1 }),
  s('lab_qc', 'Lab analysis & QC (chemical)', 'process', ['laboratory analysis', 'lab analysis', 'chemical analysis', 'gc-ms', 'hplc', 'titration', 'spectroscopy', 'quality lab'], { process: 1, quality: 1 }),

  /* ---------------- Petroleum ---------------- */
  s('drilling', 'Drilling & completion', 'petroleum', ['drilling engineering', 'drilling operations', 'drilling engineer', 'drilling rig', 'well completion', 'workover', 'casing design', 'mud engineering', 'drilling fluids', 'well control', 'iwcf', 'well site', 'wellsite', 'حفر الآبار'], { petroleum: 3 }),
  s('reservoir', 'Reservoir engineering', 'petroleum', ['reservoir engineering', 'reservoir simulation', 'reservoir engineer', 'petrel', 'eclipse', 'cmg', 'material balance', 'decline curve', 'pvt', 'history matching', 'eor', 'enhanced oil recovery'], { petroleum: 3 }),
  s('production_eng', 'Production engineering & artificial lift', 'petroleum', ['production engineering', 'production optimization', 'prosper software', 'ipm suite', 'artificial lift', 'gas lift', 'esp pumps', 'electrical submersible pump', 'sucker rod', 'well testing', 'well test', 'pipesim', 'nodal analysis'], { petroleum: 3 }),
  s('petrophysics', 'Petrophysics & well logging', 'petroleum', ['petrophysics', 'well logging', 'mud logging', 'wireline', 'log interpretation', 'techlog', 'interactive petrophysics', 'geosteering'], { petroleum: 2 }),
  s('oil_gas', 'Oil & gas operations', 'petroleum', ['oil and gas', 'oil & gas', 'offshore platform', 'offshore platforms', 'upstream oil', 'oilfield', 'oil field', 'gas field', 'api standards', 'بترول', 'حقول'], { petroleum: 2, process: 1, mech_maint: 1, automation: 1 }),

  /* ---------------- Automation & instrumentation ---------------- */
  s('plc', 'PLC programming', 'automation', ['plc', 'plc programming', 'siemens s7', 's7-1200', 's7-1500', 's7-300', 'tia portal', 'step 7', 'allen bradley', 'allen-bradley', 'rslogix', 'studio 5000', 'codesys', 'ladder logic', 'schneider plc', 'mitsubishi plc', 'omron'], { automation: 3, embedded: 1 }),
  s('scada_hmi', 'SCADA / HMI / DCS', 'automation', ['hmi', 'wincc', 'intouch', 'factorytalk', 'ignition scada', 'dcs', 'deltav', 'experion', 'yokogawa', 'centum', 'abb 800xa', 'scada systems'], { automation: 3, power: 1 }),
  s('instrumentation', 'Field instrumentation & calibration', 'automation', ['instrumentation', 'field instruments', 'transmitters', 'pressure transmitter', 'calibration', 'loop check', 'loop checking', 'hart', 'analyzers'], { automation: 3, biomedical: 1, quality: 1 }),
  s('control_theory', 'Control systems & PID tuning', 'automation', ['control systems', 'pid control', 'pid tuning', 'closed loop', 'feedback control', 'matlab', 'simulink', 'labview'], { automation: 2, embedded: 2 }),
  s('drives', 'VFDs, motors & motion control', 'automation', ['servo', 'servo motors', 'motion control', 'motor control', 'robotics', 'robot programming', 'industrial robots'], { automation: 2, elec_site: 1, mech_maint: 1 }),
  s('sis', 'SIS / safety instrumented systems', 'automation', ['sis', 'safety instrumented', 'esd system', 'fire and gas system', 'f&g system', 'iec 61511', 'iec 61508', 'sil verification', 'tuv fs'], { automation: 2 }),
  s('protocols', 'Industrial protocols (Modbus / Profibus / OPC)', 'automation', ['modbus', 'profibus', 'profinet', 'ethernet/ip', 'opc ua', 'opc', 'iec 61850', 'can bus', 'canbus', 'mqtt'], { automation: 2, embedded: 2, power: 1 }),

  /* ---------------- Software & data & networks ---------------- */
  s('prog_lang', 'Programming languages', 'it', ['python', 'java', 'javascript', 'typescript', 'c++', 'golang', 'go lang', 'kotlin', 'swift', 'php', 'ruby', 'rust', 'scala', 'dart', 'برمجة'], { software: 3, data: 2, embedded: 1 }),
  s('web_fw', 'Web frameworks (React / Angular / Node / Django / .NET)', 'it', ['react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'angular', 'vue', 'vue.js', 'node.js', 'nodejs', 'django', 'flask', 'fastapi', 'spring boot', 'spring', '.net', 'asp.net', 'laravel', 'html', 'css', 'tailwind'], { software: 3 }),
  s('mobile', 'Mobile development (Flutter / Android / iOS)', 'it', ['flutter', 'android', 'ios development', 'react native', 'jetpack compose', 'swiftui', 'mobile app', 'mobile apps', 'mobile development'], { software: 2 }),
  s('databases', 'Databases & SQL', 'it', ['sql', 'mysql', 'postgresql', 'postgres', 'sql server', 'oracle database', 'mongodb', 'redis', 'firebase', 'database design', 'nosql'], { software: 2, data: 3 }),
  s('cloud_devops', 'Cloud & DevOps (AWS / Azure / Docker / CI-CD)', 'it', ['aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'ci cd', 'jenkins', 'github actions', 'terraform', 'devops', 'linux'], { software: 2, data: 1, network: 2 }),
  s('sw_practice', 'Engineering practice (Git / testing / APIs)', 'it', ['git', 'github', 'gitlab', 'rest api', 'restful', 'graphql', 'microservices', 'unit testing', 'unit tests', 'test driven', 'tdd', 'agile', 'scrum', 'jira', 'oop', 'design patterns', 'data structures', 'algorithms', 'system design', 'clean code'], { software: 3, data: 1 }),
  s('ml_ai', 'Machine learning & AI', 'it', ['machine learning', 'deep learning', 'artificial intelligence', 'neural networks', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'nlp', 'natural language processing', 'computer vision', 'llm', 'llms', 'generative ai', 'opencv', 'ذكاء اصطناعي'], { data: 3, software: 1 }),
  s('data_eng', 'Data analysis & pipelines', 'it', ['data analysis', 'data analytics', 'pandas', 'numpy', 'spark', 'pyspark', 'hadoop', 'airflow', 'etl', 'data pipeline', 'data pipelines', 'data warehouse', 'snowflake', 'databricks', 'tableau', 'looker', 'تحليل البيانات'], { data: 3 }),
  s('networking', 'Routing, switching & security', 'it', ['ccna', 'ccnp', 'routing protocols', 'ccie', 'routing and switching', 'cisco', 'juniper', 'mikrotik', 'lan', 'wan', 'vlan', 'ospf', 'bgp', 'firewall', 'firewalls', 'fortinet', 'fortigate', 'palo alto', 'vpn', 'network security', 'wireless networks', 'شبكات'], { network: 3, telecom: 1 }),
  s('sysadmin', 'Systems administration', 'it', ['windows server', 'active directory', 'vmware', 'virtualization', 'hyper-v', 'office 365', 'microsoft 365', 'exchange server', 'help desk', 'helpdesk', 'it support', 'mcsa', 'comptia', 'itil'], { network: 3 }),
  s('cyber', 'Cybersecurity', 'it', ['cybersecurity', 'cyber security', 'information security', 'penetration testing', 'siem', 'soc analyst', 'ceh', 'cissp', 'security+', 'iso 27001'], { network: 2, software: 1 }),

  /* ---------------- Telecom & electronics ---------------- */
  s('rf', 'RF planning & optimisation', 'telecom', ['rf planning', 'rf optimization', 'rf optimisation', 'rf engineer', 'drive test', 'drive testing', 'atoll', 'tems', 'nemo', 'actix', 'kpi optimization', 'link budget', 'antenna'], { telecom: 3 }),
  s('mobile_net', 'Mobile networks (2G–5G)', 'telecom', ['2g', '3g', '4g', 'lte', '5g', 'gsm', 'umts', 'bss', 'enodeb', 'gnodeb', 'core network', 'volte', 'ericsson', 'huawei', 'nokia', 'zte'], { telecom: 3 }),
  s('transmission_tel', 'Transmission, microwave & fibre', 'telecom', ['microwave', 'microwave links', 'transmission network', 'sdh', 'dwdm', 'ftth', 'gpon', 'fiber optics', 'fibre optics', 'fiber optic', 'otdr', 'splicing', 'ألياف ضوئية'], { telecom: 3, network: 1 }),
  s('embedded_sw', 'Embedded C & microcontrollers', 'telecom', ['embedded c', 'embedded systems', 'embedded software', 'microcontroller', 'microcontrollers', 'arduino', 'stm32', 'pic microcontroller', 'avr', 'esp32', 'raspberry pi', 'rtos', 'freertos', 'firmware', 'bare metal', 'uart', 'i2c', 'iot', 'internet of things'], { embedded: 3, automation: 1 }),
  s('pcb', 'PCB & circuit design', 'telecom', ['pcb design', 'pcb', 'altium', 'altium designer', 'kicad', 'orcad', 'eagle', 'proteus', 'multisim', 'ltspice', 'circuit design', 'analog circuits', 'digital circuits', 'power electronics'], { embedded: 3 }),
  s('fpga', 'FPGA / VHDL / Verilog', 'telecom', ['fpga', 'vhdl', 'verilog', 'systemverilog', 'asic', 'vivado', 'quartus', 'digital design', 'rtl design', 'uvm'], { embedded: 3 }),

  /* ---------------- Biomedical ---------------- */
  s('med_equipment', 'Medical equipment service', 'biomed', ['medical equipment', 'medical devices', 'biomedical equipment', 'hospital equipment', 'patient monitors', 'ventilators', 'infusion pumps', 'defibrillators', 'anesthesia machines', 'dialysis machines', 'icu equipment', 'lab equipment', 'أجهزة طبية'], { biomedical: 3 }),
  s('imaging', 'Medical imaging (X-ray / CT / MRI / US)', 'biomed', ['x-ray', 'xray', 'ct scanner', 'ct scan', 'mri', 'ultrasound', 'mammography', 'c-arm', 'radiology equipment', 'imaging systems', 'pacs'], { biomedical: 3 }),
  s('med_reg', 'Medical regulations (ISO 13485 / FDA / SFDA)', 'biomed', ['iso 13485', 'fda', 'sfda', 'ce marking', 'mdr', 'iec 60601', 'medical device regulation', 'jci', 'cbahi'], { biomedical: 2, quality: 1 }),

  /* ---------------- Planning & project control ---------------- */
  s('evm', 'Earned value & progress control', 'management', ['earned value', 'evm', 'evms', 's-curve', 's curve', 'progress measurement', 'progress monitoring', 'project control', 'project controls', 'variance analysis', 'cost loading', 'resource loading'], { planning: 3, pm: 1 }),
  s('delay', 'Delay analysis & EOT', 'management', ['delay analysis', 'eot', 'extension of time', 'time impact analysis', 'critical path', 'cpm', 'wbs', 'work breakdown structure', 'baseline schedule', 'recovery schedule', 'look-ahead schedule'], { planning: 3, pm: 1 }),

  /* ---------------- Quality ---------------- */
  s('iso9001', 'ISO 9001 / QMS & audits', 'management', ['iso 9001', 'qms', 'quality management system', 'internal audit', 'internal audits', 'quality audit', 'quality audits', 'lead auditor', 'iso 17025', 'iatf 16949'], { quality: 3, production: 1 }),
  s('capa', 'Inspection, NCR & CAPA', 'management', ['capa', 'corrective and preventive', 'corrective action', 'root cause analysis', '8d', 'fmea', 'pfmea', 'control plan', 'spc', 'statistical process control', 'ppap', 'apqp', 'inspection and test plan', 'incoming inspection'], { quality: 3, production: 2 }),
  s('ndt', 'Welding inspection & NDT', 'management', ['ndt', 'cswip', 'aws cwi', 'welding inspection', 'radiographic testing', 'ultrasonic testing', 'magnetic particle', 'dye penetrant', 'asnt level ii', 'asnt'], { quality: 3, mech_maint: 1, petroleum: 1 }),

  /* ---------------- HSE ---------------- */
  s('safety_mgmt', 'Safety management & permits', 'management', ['permit to work', 'ptw', 'toolbox talk', 'toolbox talks', 'jsa', 'jha', 'job safety analysis', 'safety induction', 'safety inspections', 'safety audits', 'incident investigation', 'accident investigation', 'emergency response', 'emergency drills', 'safety officer', 'safety engineer', 'سلامة وصحة مهنية'], { hse: 3 }),
  s('hse_std', 'ISO 45001 / 14001 standards', 'management', ['iso 45001', 'ohsas 18001', 'iso 14001', 'environmental management'], { hse: 3, quality: 1 }),

  /* ---------------- Certifications (non-MEP) ---------------- */
  s('nebosh', 'NEBOSH / OSHA certificate', 'cert', ['nebosh igc', 'nebosh', 'osha 30', 'osha 30 hours', 'osha certificate', 'iosh managing safely'], { hse: 3 }),
  s('cloud_cert', 'Cloud / dev certification', 'cert', ['aws certified', 'azure certified', 'az-900', 'az-104', 'google cloud certified', 'ckad', 'cka', 'oracle certified'], { software: 1, network: 1 }),
  s('pmi_sp', 'PMI-SP / planning certificate', 'cert', ['pmi-sp', 'pmi sp', 'pmi scheduling professional', 'planning & scheduling professional', 'psp'], { planning: 3 })
];

/** extra role weights for skills that already exist in the MEP taxonomy */
export const SKILL_ROLE_ADDS: Record<string, Record<string, number>> = {
  primavera: { planning: 3, civil_site: 1 },
  planning: { planning: 3 },
  pmp: { planning: 1 },
  risk: { planning: 1, hse: 2 },
  cost_control: { planning: 1 },
  excel: { planning: 2, data: 1, quality: 1 },
  autocad: { civil_site: 1, structural: 1, infra: 2, survey: 2, architect: 2, interior: 2, elec_design: 2, elv: 1, mech_design: 1 },
  revit: { architect: 2, structural: 1, elec_design: 1 },
  navis: { architect: 1 },
  shop_dwg: { civil_site: 1, elec_site: 1, architect: 1 },
  ms_ir: { civil_site: 2, elec_site: 2, quality: 2 },
  installation: { elec_site: 1, civil_site: 1 },
  tnc: { elec_site: 2, automation: 1, power: 1 },
  subcon: { civil_site: 2, elec_site: 1 },
  handover: { civil_site: 1, elec_site: 1 },
  hse: { hse: 3, civil_site: 1 },
  qaqc: { quality: 3, civil_site: 1 },
  troubleshoot: { mech_maint: 2, automation: 2, biomedical: 2, network: 1, elec_site: 1 },
  ppm: { mech_maint: 2, biomedical: 2 },
  cmms: { mech_maint: 2, biomedical: 1 },
  bms: { elv: 1, automation: 1 },
  fire_alarm: { elv: 2, elec_design: 1 },
  energy: { power: 1, architect: 1 },
  leed_ap: { architect: 1 },
  team_lead: { software: 1 },
  cfd: { mech_design: 1, process: 1 },
  value_eng: { architect: 1 }
};
