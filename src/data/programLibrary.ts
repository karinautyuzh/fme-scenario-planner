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

// ─── EHR KPIs (sourced from XLS: EHR + EHR Operational Benefits sheets) ──────

const EHR_KPIS: ProgramKPI[] = [
  kpi('ehr-noshow', 'No-Show / Non-Attendance Rate', ['grow-patient-volume'], '%',
    'Percentage of scheduled treatments where the patient does not attend. Improved scheduling and reminders reduce no-shows.'),
  kpi('ehr-drop-rate', 'Patient Drop Rate', ['grow-patient-volume'], '%',
    'Percentage of patients who discontinue care. Better care coordination and engagement reduce dropout.'),
  kpi('ehr-referral-velocity', 'Referral-to-Treatment Time', ['grow-patient-volume'], 'Days',
    'Average days from referral receipt to first treatment session. Faster referral processing increases patient volume.'),
  kpi('ehr-consumables-waste', 'Consumables Waste Rate', ['reduce-cost-per-treatment'], '%',
    'Proportion of consumables disposed of unused. Better inventory integration and usage tracking reduces clinical waste.'),
  kpi('ehr-overtime-hours', 'Annual Overtime Hours', ['reduce-cost-per-treatment'], 'Hours',
    'Total overtime hours worked annually. EHR scheduling and workflow tools reduce overtime demand. XLS illustrative baseline: 5,366,418 hrs/yr.'),
  kpi('ehr-staff-turnover', 'Nursing / PCT Turnover Rate', ['reduce-cost-per-treatment'], '%',
    'Annual staff turnover rate for nursing and PCT roles. EHR improves workflow satisfaction and reduces avoidable turnover. XLS illustrative: ~19% nurses / ~24% PCTs.'),
  kpi('ehr-agency-spend', 'Agency Staffing Spend', ['reduce-cost-per-treatment'], '€M',
    'Annual spend on premium agency/temporary staff driven by turnover-related vacancies.'),
  kpi('ehr-turnover-cost', 'Turnover Cost — Hiring & Deployment', ['reduce-cost-per-treatment'], '€M',
    'Annual cost of hiring, onboarding, and deploying replacement staff. XLS illustrative: ~€90M/yr.'),
  kpi('ehr-backfill-hours', 'Backfill Hours', ['reduce-cost-per-treatment'], 'Hours',
    'Hours of incremental backfill pay for staff covering vacant positions. XLS illustrative: 1,732,667 hrs/yr.'),
  kpi('ehr-denial-rate', 'Claims Denial Rate', ['scalable-digital-enterprise'], '%',
    'Percentage of submitted claims denied by payers. Improved coding accuracy reduces denials.'),
  kpi('ehr-dso', 'Days Sales Outstanding (DSO)', ['scalable-digital-enterprise'], 'Days',
    'Average days from treatment delivery to payment receipt. Revenue cycle modernization accelerates cash collection.'),
];

// ─── Supply Chain KPIs (sourced from XLS: Supply Chain sheet) ────────────────

const SUPPLY_KPIS: ProgramKPI[] = [
  kpi('sc-dio', 'Days Inventory Outstanding (DIO)', ['reduce-cost-per-treatment'], 'Days',
    'Average days of inventory on hand. DIO reduction frees working capital and reduces carrying cost.'),
  kpi('sc-inventory-turns', 'Inventory Turnover Ratio', ['reduce-cost-per-treatment'], 'Other',
    'Times inventory is replenished annually. Higher turns indicate leaner, more efficient inventory management.'),
  kpi('sc-forecast-mape', 'Forecast Accuracy (MAPE)', ['reduce-cost-per-treatment'], '%',
    'Mean Absolute Percentage Error of demand forecasts. Lower MAPE reduces safety stock and stockouts.'),
  kpi('sc-stockout-rate', 'Stockout Rate (Critical SKUs)', ['reduce-cost-per-treatment'], '%',
    'Percentage of instances where a critical medical supply SKU was unavailable when needed for treatment.'),
  kpi('sc-order-fill', 'Order Fill Rate', ['reduce-cost-per-treatment'], '%',
    'Percentage of orders fulfilled completely and on-time from stock.'),
  kpi('sc-otif', 'OTIF — On-Time In-Full', ['reduce-cost-per-treatment'], '%',
    'Percentage of orders delivered on time and in full. OTIF improvement reduces last-minute substitutions.'),
  kpi('sc-supplier-otif', 'Supplier OTIF', ['scalable-digital-enterprise'], '%',
    'Supplier-side on-time, in-full delivery rate. Vendor consolidation improves supplier reliability.'),
  kpi('sc-maverick-spend', 'Maverick Spend Rate', ['reduce-cost-per-treatment'], '%',
    'Unauthorized or off-contract purchasing as a % of total spend. Vendor consolidation reduces maverick spend.'),
  kpi('sc-obsolete-inventory', 'Inventory Write-off / Obsolescence', ['reduce-cost-per-treatment'], '€M',
    'Annual value of inventory written off due to expiry or obsolescence.'),
  kpi('sc-transport-pct', 'Transportation Spend (% Revenue)', ['scalable-digital-enterprise'], '%',
    'Total inbound + outbound transportation cost as a proportion of revenue.'),
  kpi('sc-expedited-pct', 'Expedited Shipment Rate', ['reduce-cost-per-treatment'], '%',
    'Percentage of orders requiring expedited (premium) shipping. Lower rate means better planning.'),
];

// ─── ESPHORA KPIs (sourced from XLS: ESPHORA sheet — S/4HANA Finance) ────────

const ESPHORA_KPIS: ProgramKPI[] = [
  kpi('esp-close-days', 'Finance Close Cycle Time', ['scalable-digital-enterprise'], 'Days',
    'Days from period end to published financial close. Automated journal entry and reconciliation reduce close cycle time.'),
  kpi('esp-fte-productivity', 'Finance FTE Productivity', ['scalable-digital-enterprise'], '%',
    'Productive hours per finance FTE as a proportion of total capacity. Automation reduces manual effort.'),
  kpi('esp-automation-rate', 'Process Automation Rate', ['scalable-digital-enterprise'], '%',
    'Percentage of finance transactions processed without manual intervention.'),
  kpi('esp-dso', 'Days Sales Outstanding (DSO)', ['scalable-digital-enterprise'], 'Days',
    'Average days from invoice to cash receipt. DSO reduction releases working capital.'),
  kpi('esp-audit-cost', 'Audit & Compliance Cost', ['scalable-digital-enterprise'], '€M',
    'Annual cost of internal and external audit preparation. Automation and data integrity reduce audit effort.'),
  kpi('esp-resource-efficiency', 'Finance Resource Efficiency', ['scalable-digital-enterprise'], '%',
    'Finance overhead as a percentage of revenue. Target: reduction through process digitization.'),
];

// ─── GEMINI KPIs (sourced from XLS: CE_Gemini sheet — CE ERP + MES) ──────────

const GEMINI_KPIS: ProgramKPI[] = [
  kpi('gem-oee', 'Overall Equipment Effectiveness (OEE)', ['reduce-cost-per-treatment'], '%',
    'Composite measure of equipment availability, performance rate, and quality rate for Gemini plant machinery.'),
  kpi('gem-capacity-util', 'Manufacturing Capacity Utilization', ['grow-patient-volume'], '%',
    'Actual output as a percentage of maximum rated output. MES enables better scheduling and reduces downtime.'),
  kpi('gem-plan-accuracy', 'Production Plan Accuracy', ['reduce-cost-per-treatment'], '%',
    'Percentage of production runs completed on schedule and at target volume.'),
  kpi('gem-scrap-rate', 'Manufacturing Scrap / Shrinkage Rate', ['reduce-cost-per-treatment'], '%',
    'Proportion of input materials lost to defects, rework, or waste. MES-driven SPC reduces scrap.'),
  kpi('gem-prod-cost', 'Production Cost per Unit', ['reduce-cost-per-treatment'], '€M',
    'Manufacturing cost per dialyzer unit. Efficiency, scrap reduction, and better yield improve unit cost.'),
  kpi('gem-asset-util', 'Asset Utilization Rate', ['scalable-digital-enterprise'], '%',
    'Productive use of manufacturing assets relative to total available capacity.'),
  kpi('gem-warehouse-cost', 'Warehouse Cost', ['reduce-cost-per-treatment'], '€M',
    'Annual cost of warehousing finished goods and raw materials at Gemini and AMD plants.'),
  kpi('gem-inventory-cost', 'Manufacturing Inventory Cost', ['reduce-cost-per-treatment'], '€M',
    'Carrying cost of WIP and finished goods inventory.'),
];

// ─── Program Library ──────────────────────────────────────────────────────────

export const INITIAL_PROGRAM_LIBRARY: ProgramLibraryEntry[] = [
  {
    id: 'esphora-cd',
    name: 'ESPHORA',
    shortName: 'ESPHORA',
    description:
      'Core finance and operations transformation implementing S/4HANA and GBS Finance Automation (A2R, P2P, Order-to-Cash). Digitizes and automates finance workflows — Accounts Receivable, Payable, and Order-to-Cash — to drive close-cycle efficiency, FTE productivity, and DSO reduction.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q1 2026',
    targetCompletion: 'Q2 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['reduce-cost-per-treatment', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 20,
      'reduce-cost-per-treatment': 70,
      'scalable-digital-enterprise': 90,
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
      'Integrated design with EHR creates a shared patient-to-cost data model. Finance automation connects directly to clinical revenue data, eliminating a separate revenue reconciliation workstream and accelerating the cash collection cycle.',
    defaultTimeline: { startMonth: 0, durationMonths: 18 },
    additionalContext: 'Sub-initiatives: S/4HANA Core Finance & Operations; GBS Finance Automation (A2R, P2P, Order-to-Cash).',
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
      'Electronic Health Record transformation replacing Soarian with a modern EHR platform, redesigning clinical workflows and documentation, restructuring the clinical operating model and workforce, and modernizing the revenue cycle to reduce denials and accelerate cash collection.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q1 2026',
    targetCompletion: 'Q4 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['grow-patient-volume', 'reduce-cost-per-treatment', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 90,
      'reduce-cost-per-treatment': 85,
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
      'Integrated design with ESPHORA and Supply Chain enables a single patient-to-cost data model, reducing per-treatment cost and increasing throughput simultaneously. EHR operational data feeds directly into the supply chain replenishment signal, eliminating a separate demand-modeling workstream.',
    defaultTimeline: { startMonth: 2, durationMonths: 24 },
    additionalContext: 'Sub-initiatives: EHR/EMR Platform Implementation (Soarian Replacement); Clinical Workflow Redesign; Clinical Operating Model & Workforce Redesign; Revenue Cycle Modernization & Denial Reduction. XLS workforce value drivers quantified for OT, turnover, and backfill.',
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
      'End-to-end supply chain transformation comprising network redesign and vendor consolidation, followed by demand-driven replenishment and inventory optimization. Targets reduction in Days Inventory Outstanding, improved forecast accuracy, higher OTIF performance, and elimination of maverick spend.',
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
      'Integrated design with EHR connects clinical demand signals to procurement in real time, compressing the supply chain program by eliminating a separate demand-modeling workstream and enabling dynamic replenishment based on actual treatment schedules.',
    defaultTimeline: { startMonth: 3, durationMonths: 20 },
    additionalContext: 'Sub-initiatives: Supply Chain Network Redesign & Vendor Consolidation; Demand-Driven Replenishment & Inventory Optimization.',
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
    name: 'CE / GEMINI',
    shortName: 'CE / GEMINI',
    description:
      'Care Enablement ERP transformation implementing R6 NexStage to redesign care delivery processes, combined with a Manufacturing Execution System (MES) for Gemini dialyzer plants and AMD plant templates. Targets OEE improvement, production cost reduction, quality uplift, and warehouse efficiency.',
    isBuiltIn: true,
    status: 'planned',
    startTiming: 'Q1 2026',
    targetCompletion: 'Q2 2027',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: ['grow-patient-volume', 'reduce-cost-per-treatment', 'scalable-digital-enterprise'],
    outcomePriorities: {
      'grow-patient-volume': 50,
      'reduce-cost-per-treatment': 80,
      'scalable-digital-enterprise': 85,
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
      'Integrated design with Supply Chain connects manufacturing output directly to clinic inventory replenishment, eliminating a hand-off workstream. MES data on production capacity feeds the clinical supply planning model, enabling just-in-time replenishment across the Gemini plant network.',
    defaultTimeline: { startMonth: 1, durationMonths: 22 },
    additionalContext: 'Sub-initiatives: R6 NexStage — Care Enablement ERP & Process Design; MES for Gemini Plants & AMD Plant Templates.',
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
