/**
 * Ready-made, honest task lines per role for the voice CV builder.
 * The person ticks only what they actually did; nothing is added on their behalf.
 * No numbers here on purpose: figures must come from the person.
 */
export const TASKS: Record<string, string[]> = {
  hvac_design: [
    'Calculated cooling and heating loads using Carrier HAP',
    'Sized ductwork and prepared duct layouts per SMACNA',
    'Selected HVAC equipment (AHU, FCU, chillers, VRF) from manufacturer catalogues',
    'Calculated fan external static pressure and pump head',
    'Designed chilled-water piping networks',
    'Designed ventilation, kitchen and car park exhaust systems per ASHRAE 62.1',
    'Prepared design drawings, schedules and calculation reports for consultant approval',
    'Reviewed shop drawings and material submittals',
    'Coordinated HVAC design with architectural, structural and other MEP disciplines'
  ],
  bim: [
    'Modelled HVAC and piping systems in Revit MEP to LOD 300–400',
    'Ran clash detection in Navisworks and resolved clashes in coordination meetings',
    'Produced coordinated shop drawings, sections and builder\'s work drawings from the model',
    'Created and edited Revit families for equipment and air terminals',
    'Set up Revit templates, view templates and project standards',
    'Extracted quantities and schedules from the Revit model',
    'Followed the project BIM Execution Plan (BEP) and model naming standards',
    'Prepared as-built models and handed over models to the client'
  ],
  fire: [
    'Classified hazards and designed sprinkler systems per NFPA 13',
    'Designed standpipe, hose reel and fire hose cabinet systems per NFPA 14',
    'Performed hydraulic calculations for sprinkler networks',
    'Selected fire pumps and laid out pump rooms per NFPA 20',
    'Sized fire water tanks',
    'Prepared fire fighting riser diagrams and design drawings',
    'Coordinated fire fighting design with civil defence requirements',
    'Reviewed fire protection shop drawings and submittals'
  ],
  plumbing: [
    'Designed domestic water supply networks and calculated fixture units',
    'Designed drainage, vent and storm water systems',
    'Sized water tanks, booster pumps and water heaters',
    'Prepared plumbing riser diagrams and design drawings per IPC / UPC',
    'Selected plumbing fixtures and equipment',
    'Reviewed plumbing shop drawings and material submittals',
    'Coordinated plumbing routes with structure and other MEP services'
  ],
  site: [
    'Supervised installation of HVAC ductwork, piping and equipment on site',
    'Followed up subcontractors and site labour against the work programme',
    'Prepared inspection requests (IR) and attended inspections with the consultant',
    'Performed pressure tests, flushing and leak tests for piping systems',
    'Reviewed shop drawings before execution and raised site queries (RFI)',
    'Took site measurements and prepared quantity reports for invoices',
    'Participated in testing, adjusting and balancing (TAB) and commissioning',
    'Ensured work followed approved drawings, specifications and HSE rules'
  ],
  tech_office: [
    'Prepared shop drawings from the approved design drawings',
    'Prepared and followed up material submittals and approvals',
    'Prepared requests for information (RFI) and tracked consultant replies',
    'Extracted quantities from drawings for procurement and invoices',
    'Prepared as-built drawings',
    'Coordinated drawings between disciplines and with the site team',
    'Maintained the document control log for drawings and submittals'
  ],
  estimation: [
    'Prepared quantity take-offs from tender drawings',
    'Prepared bills of quantities (BOQ) and priced items',
    'Requested and compared supplier and subcontractor quotations',
    'Prepared monthly interim payment applications',
    'Prepared variation orders and cost reports',
    'Studied tender documents and specifications'
  ],
  pm: [
    'Planned and followed up project activities against the schedule',
    'Coordinated between the client, consultant, subcontractors and suppliers',
    'Prepared weekly and monthly progress reports',
    'Followed up procurement and material deliveries',
    'Reviewed invoices and controlled project cost',
    'Led project meetings and tracked action items',
    'Managed handover and close-out documents'
  ],
  sales: [
    'Prepared technical and commercial offers for HVAC equipment',
    'Selected equipment using manufacturer selection software',
    'Visited clients and consultants to present products',
    'Followed up offers until order confirmation',
    'Prepared technical comparisons and compliance statements',
    'Supported the after-sales and installation teams'
  ],
  fm: [
    'Managed preventive and corrective maintenance of building systems',
    'Prepared maintenance schedules and work orders',
    'Followed up maintenance subcontractors',
    'Troubleshot HVAC, plumbing and fire fighting systems',
    'Managed spare parts and maintenance inventory',
    'Monitored systems using the BMS',
    'Prepared maintenance reports and KPIs'
  ],
  civil_site: [
    'Supervised concrete works: formwork, reinforcement and casting',
    'Checked levels and setting out with the surveyor',
    'Followed up subcontractors and site labour against the programme',
    'Prepared inspection requests and attended inspections with the consultant',
    'Reviewed shop drawings and bar bending schedules',
    'Measured executed quantities for invoices',
    'Ensured work followed specifications and HSE rules'
  ],
  structural: [
    'Designed reinforced concrete buildings using ETABS and SAFE',
    'Designed foundations and retaining walls',
    'Prepared structural calculation reports',
    'Checked structural drawings and details',
    'Designed steel structures and connections',
    'Applied the Egyptian code / ACI / SBC requirements'
  ],
  infra: [
    'Designed road alignments, profiles and cross sections',
    'Designed storm water and utility networks',
    'Supervised earthworks, asphalt and utility installation on site',
    'Prepared quantity take-offs for infrastructure works',
    'Coordinated with authorities for utility approvals'
  ],
  survey: [
    'Performed site surveys using total station and GPS',
    'Set out building grids, levels and roads',
    'Prepared survey drawings in AutoCAD Civil 3D',
    'Calculated cut and fill quantities',
    'Prepared GIS maps and spatial databases'
  ],
  architect: [
    'Prepared concept and detailed architectural designs',
    'Produced working drawings and details',
    'Modelled buildings in Revit Architecture',
    'Prepared 3D visualisations and presentations',
    'Coordinated architectural design with structure and MEP',
    'Prepared design documents for authority approval'
  ],
  interior: [
    'Designed interior layouts and finishes',
    'Prepared 3D renders using 3ds Max / V-Ray / Lumion',
    'Prepared interior shop drawings and details',
    'Selected materials, furniture and lighting',
    'Followed up interior fit-out works on site'
  ],
  elec_design: [
    'Designed lighting and power layouts',
    'Calculated electrical loads and prepared load schedules',
    'Sized cables and selected protection devices',
    'Prepared single line diagrams and panel schedules',
    'Performed lighting calculations using DIALux',
    'Designed earthing and lightning protection systems',
    'Reviewed electrical shop drawings and submittals'
  ],
  elec_site: [
    'Supervised installation of conduits, cable trays, cables and panels',
    'Followed up electrical subcontractors against the programme',
    'Performed insulation resistance and continuity tests',
    'Prepared inspection requests and attended inspections',
    'Participated in testing and commissioning of electrical systems',
    'Prepared as-built drawings and quantity reports'
  ],
  power: [
    'Designed and reviewed MV / LV substations',
    'Performed short-circuit and load-flow studies using ETAP',
    'Coordinated protection relay settings',
    'Supervised installation and testing of transformers and switchgear',
    'Prepared single line diagrams for power networks'
  ],
  elv: [
    'Designed fire alarm systems per NFPA 72',
    'Designed CCTV, access control and data networks',
    'Designed public address and nurse call systems',
    'Prepared ELV riser diagrams and layouts',
    'Supervised installation and testing of ELV systems'
  ],
  mech_design: [
    'Designed mechanical parts and assemblies in SolidWorks',
    'Prepared manufacturing drawings with tolerances (GD&T)',
    'Performed strength checks and FEA simulations',
    'Selected materials, bearings and standard components',
    'Supported prototyping and testing'
  ],
  production: [
    'Planned and followed up daily production',
    'Improved production processes and reduced waste',
    'Prepared work instructions and production reports',
    'Followed up quality checks on the production line',
    'Applied lean manufacturing and 5S'
  ],
  mech_maint: [
    'Performed preventive and corrective maintenance of rotating equipment',
    'Maintained pumps, compressors and gearboxes',
    'Prepared maintenance plans using a CMMS',
    'Troubleshot mechanical failures and performed root-cause analysis',
    'Managed spare parts for the plant'
  ],
  process: [
    'Monitored and optimised process units',
    'Prepared process flow diagrams (PFD) and P&IDs',
    'Performed mass and energy balances',
    'Simulated processes using Aspen HYSYS',
    'Supported start-up and troubleshooting of process units'
  ],
  petroleum: [
    'Monitored well performance and production data',
    'Supported drilling and completion operations',
    'Prepared daily production and well reports',
    'Performed reservoir and production analysis',
    'Followed HSE procedures on site'
  ],
  automation: [
    'Programmed PLCs and HMIs',
    'Configured SCADA / DCS systems',
    'Calibrated and maintained field instruments',
    'Prepared control narratives and I/O lists',
    'Commissioned control systems on site'
  ],
  software: [
    'Developed web applications',
    'Built and maintained REST APIs',
    'Wrote unit and integration tests',
    'Worked with Git and code reviews',
    'Deployed applications to the cloud',
    'Fixed bugs and improved application performance'
  ],
  data: [
    'Cleaned and analysed data using Python and SQL',
    'Built dashboards in Power BI',
    'Trained and evaluated machine learning models',
    'Automated data pipelines',
    'Presented insights to stakeholders'
  ],
  network: [
    'Configured routers, switches and firewalls',
    'Managed Windows / Linux servers',
    'Monitored network performance and solved incidents',
    'Managed user accounts and access rights',
    'Supported backup and disaster recovery'
  ],
  telecom: [
    'Planned and optimised radio networks',
    'Performed drive tests and analysed KPIs',
    'Installed and commissioned telecom sites',
    'Configured transmission links',
    'Prepared site survey reports'
  ],
  embedded: [
    'Designed electronic circuits and PCBs',
    'Programmed microcontrollers in C',
    'Tested and debugged hardware prototypes',
    'Prepared technical documentation'
  ],
  biomedical: [
    'Installed and maintained medical equipment',
    'Performed preventive maintenance and calibration of medical devices',
    'Trained hospital staff on equipment use',
    'Followed up suppliers and service contracts',
    'Prepared equipment inventory and maintenance records'
  ],
  planning: [
    'Prepared project schedules using Primavera P6',
    'Updated schedules and tracked progress against the baseline',
    'Prepared progress reports and S-curves',
    'Analysed delays and prepared recovery plans',
    'Prepared resource and cash-flow plans'
  ],
  quality: [
    'Prepared inspection and test plans (ITP)',
    'Performed inspections and material receiving checks',
    'Raised and closed non-conformance reports (NCR)',
    'Followed up the quality management system per ISO 9001',
    'Prepared quality reports and audit records'
  ],
  hse: [
    'Performed site safety inspections',
    'Prepared risk assessments and method statements',
    'Delivered safety inductions and toolbox talks',
    'Investigated incidents and followed up corrective actions',
    'Prepared HSE reports and statistics'
  ]
};

export const GENERIC_TASKS = [
  'Prepared technical reports and documents',
  'Coordinated with other teams and disciplines',
  'Followed up work progress against the plan',
  'Reviewed drawings and documents'
];

export const tasksFor = (roleId: string) => TASKS[roleId] || GENERIC_TASKS;
