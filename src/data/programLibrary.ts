import { ProgramLibraryEntry, ProgramKPI, accentureEstimate, emptyInput } from '../types';

function kpi(
  id: string,
  name: string,
  outcomeIds: ProgramLibraryEntry['outcomes'],
  unit: ProgramKPI['unit'] = '%',
  context = ''
): ProgramKPI {
  return { id, name, baseline: '', target: '', unit, outcomeIds, isCustom: false, isActive: true, context };
}

const EHR_KPIS: ProgramKPI[] = [
  kpi('ehr-volume', 'Patient / Treatment Volume', ['grow-patient-volume'], '%', 'Measures increase in scheduled and completed treatment sessions.'),
  kpi('ehr-noshow', 'No-show Rate', ['grow-patient-volume'], '%', 'Percentage of scheduled treatments where the patient does not attend.'),
  kpi('ehr-cancellation', 'Cancellation Rate', ['grow-patient-volume'], '%', 'Percentage of appointments cancelled by the patient or clinic.'),
  kpi('ehr-productivity', 'Clinic Productivity', ['reduce-cost-per-treatment'], '%', 'Treatments delivered per clinical FTE or per hour of available capacity.'),
  kpi('ehr-overtime', 'Overtime Hours', ['reduce-cost-per-treatment'], '%', 'Reduction in overtime driven by better scheduling and workflow management.'),
  kpi('ehr-dso', 'DSO (Days Sales Outstanding)', ['scalable-digital-enterprise'], 'Days', 'Days between service delivery and payment receipt.'),
];

const SUPPLY_KPIS: ProgramKPI[] = [
  kpi('sc-inventory-turns', 'Inventory Turns', ['reduce-cost-per-treatment'], '%', 'How frequently inventory is replenished — higher turns reduce carrying cost.'),
  kpi('sc-stockout', 'Stockout Rate', ['reduce-cost-per-treatment'], '%', 'Percentage of treatments where a required supply was unavailable.'),
  kpi('sc-waste', 'Supply / Consumable Waste', ['reduce-cost-per-treatment'], '%', 'Proportion of consumables disposed of unused — target for reduction.'),
  kpi('sc-lead-time', 'Procurement Lead Time', ['scalable-digital-enterprise'], 'Days', 'Average days from requisition to supply availability.'),
  kpi('sc-cost-per', 'Cost Per Treatment (Supply)', ['reduce-cost-per-treatment'], '€', 'Supply and consumable cost attributable to a single treatment.'),
];

const ESPHORA_KPIS: ProgramKPI[] = [
  kpi('esp-data-completeness', 'Clinical Data Completeness', ['scalable-digital-enterprise'], '%', 'Proportion of patient records with all required clinical data fields completed.'),
  kpi('esp-trial-productivity', 'Trial Site Productivity', ['grow-patient-volume'], '%', 'Patient throughput and protocol compliance across clinical trial sites.'),
  kpi('esp-submission-time', 'Regulatory Submission Time', ['scalable-digital-enterprise'], 'Days', 'Average days to prepare and submit regulatory documentation.'),
  kpi('esp-data-quality', 'Data Quality Score', ['scalable-digital-enterprise'], '%', 'Composite measure of accuracy, completeness, and timeliness of clinical data.'),
];

const GEMINI_KPIS: ProgramKPI[] = [
  kpi('gem-finance-productivity', 'Finance Team Productivity', ['scalable-digital-enterprise'], '%', 'Finance FTE hours saved through automated reporting and consolidated data access.'),
  kpi('gem-dso', 'DSO Reduction', ['scalable-digital-enterprise'], 'Days', 'Reduction in days sales outstanding enabled by real-time financial visibility.'),
  kpi('gem-report-time', 'Report Generation Time', ['scalable-digital-enterprise'], 'Days', 'Time to produce standard management and financial reports.'),
  kpi('gem-data-coverage', 'Consolidated Data Coverage', ['scalable-digital-enterprise'], '%', 'Proportion of enterprise data sources integrated into GEMINI reporting layer.'),
];

export const INITIAL_PROGRAM_LIBRARY: ProgramLibraryEntry[] = [
  {
    id: 'esphora-cd',
    name: 'ESPHORA / CD Transformation',
    shortName: 'ESPHORA / CD',
    description:
      'Clinical Data and ESPHORA modernization enabling unified patient and trial data, streamlined regulatory submission workflows, and a foundation for data-driven clinical operations.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q1 2026',
    targetCompletion: 'Q2 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['grow-patient-volume', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 70,
      'reduce-cost-per-treatment': 30,
      'scalable-digital-enterprise': 85,
    },
    kpis: ESPHORA_KPIS,
    dependencies: [],
    sharedWorkforce: false,
    sharedData: true,
    sharedTechnology: true,
    sharedChangePopulation: false,
    timingDependency: false,
    dependencyContext: '',
    integrationHypothesis:
      'Integrated design with EHR creates a shared patient data layer, eliminating duplicate clinical data architecture and accelerating both programs.',
    defaultTimeline: { startMonth: 0, durationMonths: 18 },
    additionalContext: '',
    notes: '',
    costAssumptions: {
      governanceCostBaseEurM: emptyInput(),
      changeCostBaseEurM: emptyInput(),
      trainingCostBaseEurM: emptyInput(),
      dataIntegrationCostBaseEurM: emptyInput(),
      programResourceCostBaseEurM: emptyInput(),
    },
  },
  {
    id: 'ehr-patient-care',
    name: 'EHR / Patient Care',
    shortName: 'EHR / Patient Care',
    description:
      'Electronic Health Record implementation transforming point-of-care workflows, patient engagement, and clinical decision support across FME treatment centers.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q1 2026',
    targetCompletion: 'Q4 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['grow-patient-volume', 'reduce-cost-per-treatment', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 90,
      'reduce-cost-per-treatment': 80,
      'scalable-digital-enterprise': 70,
    },
    kpis: EHR_KPIS,
    dependencies: [],
    sharedWorkforce: true,
    sharedData: true,
    sharedTechnology: true,
    sharedChangePopulation: true,
    timingDependency: false,
    dependencyContext: '',
    integrationHypothesis:
      'Integrated design with ESPHORA/CD and Supply Chain enables a single patient-to-cost data model, reducing per-treatment cost and increasing throughput simultaneously.',
    defaultTimeline: { startMonth: 2, durationMonths: 24 },
    additionalContext: '',
    notes: '',
    costAssumptions: {
      governanceCostBaseEurM: emptyInput(),
      changeCostBaseEurM: emptyInput(),
      trainingCostBaseEurM: emptyInput(),
      dataIntegrationCostBaseEurM: emptyInput(),
      programResourceCostBaseEurM: emptyInput(),
    },
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    shortName: 'Supply Chain',
    description:
      'End-to-end supply chain transformation optimizing medical supply procurement, inventory management, and logistics to reduce treatment cost and waste.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q2 2026',
    targetCompletion: 'Q2 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['reduce-cost-per-treatment', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 30,
      'reduce-cost-per-treatment': 90,
      'scalable-digital-enterprise': 70,
    },
    kpis: SUPPLY_KPIS,
    dependencies: [],
    sharedWorkforce: false,
    sharedData: true,
    sharedTechnology: false,
    sharedChangePopulation: false,
    timingDependency: false,
    dependencyContext: '',
    integrationHypothesis:
      'Integrated design with EHR connects clinical demand signals to procurement in real time, compressing the supply chain program by eliminating a separate demand-modeling workstream.',
    defaultTimeline: { startMonth: 3, durationMonths: 20 },
    additionalContext: '',
    notes: '',
    costAssumptions: {
      governanceCostBaseEurM: emptyInput(),
      changeCostBaseEurM: emptyInput(),
      trainingCostBaseEurM: emptyInput(),
      dataIntegrationCostBaseEurM: emptyInput(),
      programResourceCostBaseEurM: emptyInput(),
    },
  },
  {
    id: 'gemini',
    name: 'GEMINI',
    shortName: 'GEMINI',
    description:
      'Enterprise management and intelligence platform providing FME leadership with unified financial, operational, and patient-journey reporting across the organization.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q1 2026',
    targetCompletion: 'Q2 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['grow-patient-volume', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 50,
      'reduce-cost-per-treatment': 60,
      'scalable-digital-enterprise': 90,
    },
    kpis: GEMINI_KPIS,
    dependencies: [],
    sharedWorkforce: false,
    sharedData: true,
    sharedTechnology: false,
    sharedChangePopulation: false,
    timingDependency: false,
    dependencyContext: '',
    integrationHypothesis:
      'GEMINI integrated from the start becomes the intelligence layer for the entire transformation, eliminating the need for program-level reporting built and then discarded by each stream.',
    defaultTimeline: { startMonth: 1, durationMonths: 22 },
    additionalContext: '',
    notes: '',
    costAssumptions: {
      governanceCostBaseEurM: emptyInput(),
      changeCostBaseEurM: emptyInput(),
      trainingCostBaseEurM: emptyInput(),
      dataIntegrationCostBaseEurM: emptyInput(),
      programResourceCostBaseEurM: emptyInput(),
    },
  },
];
