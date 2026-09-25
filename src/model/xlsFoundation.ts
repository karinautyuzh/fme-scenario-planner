/**
 * XLS FOUNDATION — Authoritative model derived from:
 * "Fresenius Initiative KPI mapping_Draft.xlsx"
 *
 * This file is the canonical source of truth for:
 *  - Program definitions (scope, sub-initiatives)
 *  - Value driver taxonomy per program
 *  - KPI definitions (name, unit, value driver, XLS sheet reference)
 *  - Illustrative starting values from the XLS where quantified
 *  - Calculation formula metadata
 *
 * The scenario-planning integration layer (synergy, shared costs,
 * timeline compression) is built ON TOP of this foundation.
 */

// ─── Source Reference ─────────────────────────────────────────────────────────

export type XlsSheet =
  | 'Initiative Sheet'
  | 'EHR'
  | 'ESPHORA'
  | 'Supply Chain'
  | 'CE_Gemini'
  | 'EHR Operational Benefits';

// ─── Value Driver ─────────────────────────────────────────────────────────────

export interface XlsValueDriver {
  id: string;
  name: string;                 // As named in XLS
  programId: string;
  xlsSheet: XlsSheet;
  impactedMetric?: string;      // "Impacted Metric" column from XLS (Supply Chain)
  hasQuantifiedModel: boolean;  // True if EHR Operational Benefits sheet has a model
}

// ─── XLS KPI Definition ───────────────────────────────────────────────────────

export interface XlsKpiDefinition {
  id: string;
  name: string;
  valueDriverId: string;
  programId: string;
  xlsSheet: XlsSheet;
  unit: 'Days' | '%' | '€M' | 'Hours' | 'Count' | 'Other';
  description: string;
  illustrativeBaseline?: string;  // XLS starting value as string (with unit label)
  illustrativeTarget?: string;    // XLS target as string
  formulaHint?: string;           // How value is calculated in XLS
}

// ─── XLS Illustrative Operational Inputs ─────────────────────────────────────
// From EHR Operational Benefits sheet — Conservative/Model scenario values

export const EHR_OT_ILLUSTRATIVE = {
  annualOtHoursBaseline: 5_366_418,   // Annual DPC Overtime Hours
  otAddressablePct: 20,               // % Addressable by New EHR System
  otImprovementPct: 20,               // Improvement % (conservative/model)
  otNursePct: 40,                     // % of OT that is nursing
  otNurseRateEur: 44,                 // ~€44/hr (XLS: $48 USD converted)
  otPctRateEur: 28,                   // ~€28/hr (XLS: $31 USD converted)
  otPremiumPct: 50,                   // OT premium %
  // Conservative benefit: ~€11M/yr (XLS: $12.15M USD)
};

export const EHR_AGENCY_ILLUSTRATIVE = {
  rnLpnCount: 2_394,                  // RN+LPN headcount
  rnTurnoverPct: 20,                  // RN turnover %
  pctCount: 3_110,                    // PCT headcount
  pctTurnoverPct: 24,                 // PCT turnover %
  agencyRateEur: 73,                  // ~€73/hr (XLS: $80 USD premium agency rate)
  agencyImprovementPct: 20,           // Conservative improvement %
  // Conservative benefit: ~€2.4M/yr (XLS: $2.61M USD)
};

export const EHR_TURNOVER_ILLUSTRATIVE = {
  turnoverCostBaseEurM: 90,           // ~€90M/yr (XLS: $97.86M USD)
  turnoverImprovementPct: 10,         // Conservative improvement %
  // Conservative benefit: ~€9M/yr (XLS: $9.79M USD)
};

export const EHR_BACKFILL_ILLUSTRATIVE = {
  backfillHoursBaseline: 1_732_667,  // Annual backfill hours baseline
  backfillAddressablePct: 50,        // % Addressable by New EHR
  backfillImprovementPct: 10,        // Conservative improvement %
  backfillAvgRateEur: 7,             // ~€7/hr (XLS: $7.54 blended incremental rate)
  // Conservative benefit: ~€0.6M/yr (XLS: $0.65M USD)
};

// ─── ESPHORA Program Definition ───────────────────────────────────────────────
// XLS source: Initiative Sheet (rows 4-5) + ESPHORA sheet

export const ESPHORA_DEFINITION = {
  id: 'esphora-cd',
  name: 'ESPHORA',
  shortName: 'ESPHORA',
  xlsScope:
    'S/4HANA Core Finance & Operations and GBS Finance Automation (A2R, P2P, Order-to-Cash).',
  description:
    'Core finance and operations transformation. Implements S/4HANA to digitize and automate finance workflows — including Accounts Receivable, Payable, and Order-to-Cash — and deploys GBS Finance Automation to drive close-cycle efficiency, FTE productivity, and DSO reduction.',
  subInitiatives: [
    'S/4HANA Core Finance & Operations',
    'GBS Finance Automation (A2R, P2P, Order-to-Cash)',
  ],
  vendor: 'Accenture',
} as const;

export const ESPHORA_VALUE_DRIVERS: XlsValueDriver[] = [
  { id: 'esp-close-efficiency', name: 'Finance process efficiency (faster close, fewer manual steps)', programId: 'esphora-cd', xlsSheet: 'ESPHORA', hasQuantifiedModel: false },
  { id: 'esp-fte-productivity', name: 'Finance FTE Productivity', programId: 'esphora-cd', xlsSheet: 'ESPHORA', hasQuantifiedModel: false },
  { id: 'esp-audit-cost', name: 'Reduced Audit Cost', programId: 'esphora-cd', xlsSheet: 'ESPHORA', hasQuantifiedModel: false },
  { id: 'esp-compliance', name: 'Regulatory compliance & audit readiness', programId: 'esphora-cd', xlsSheet: 'ESPHORA', hasQuantifiedModel: false },
  { id: 'esp-resource-efficiency', name: 'Resource Efficiency', programId: 'esphora-cd', xlsSheet: 'ESPHORA', hasQuantifiedModel: false },
  { id: 'esp-dso', name: 'Reduced Days Sales Outstanding', programId: 'esphora-cd', xlsSheet: 'ESPHORA', hasQuantifiedModel: false },
];

export const ESPHORA_KPIS: XlsKpiDefinition[] = [
  {
    id: 'esp-close-days',
    name: 'Finance Close Cycle Time',
    valueDriverId: 'esp-close-efficiency',
    programId: 'esphora-cd',
    xlsSheet: 'ESPHORA',
    unit: 'Days',
    description: 'Days from period end to published financial close. Target is reduction via automated journal entry and reconciliation.',
    formulaHint: 'Process efficiency improvement reduces close cycle days.',
  },
  {
    id: 'esp-fte-productivity',
    name: 'Finance FTE Productivity',
    valueDriverId: 'esp-fte-productivity',
    programId: 'esphora-cd',
    xlsSheet: 'ESPHORA',
    unit: '%',
    description: 'Productive hours per finance FTE as a proportion of total capacity. Automation reduces manual effort and frees capacity.',
    formulaHint: 'FTE count × productivity improvement % × average FTE cost',
  },
  {
    id: 'esp-automation-rate',
    name: 'Process Automation Rate',
    valueDriverId: 'esp-close-efficiency',
    programId: 'esphora-cd',
    xlsSheet: 'ESPHORA',
    unit: '%',
    description: 'Percentage of finance transactions processed without manual intervention.',
  },
  {
    id: 'esp-dso',
    name: 'Days Sales Outstanding (DSO)',
    valueDriverId: 'esp-dso',
    programId: 'esphora-cd',
    xlsSheet: 'ESPHORA',
    unit: 'Days',
    description: 'Average days from invoice to cash receipt. DSO reduction releases working capital.',
    formulaHint: 'Revenue base × (DSO reduction / 365) = working capital improvement',
  },
  {
    id: 'esp-audit-cost',
    name: 'Audit & Compliance Cost',
    valueDriverId: 'esp-audit-cost',
    programId: 'esphora-cd',
    xlsSheet: 'ESPHORA',
    unit: '€M',
    description: 'Annual cost of internal and external audit preparation. Automation and data integrity reduce effort.',
  },
  {
    id: 'esp-maverick-spend',
    name: 'Finance Resource Efficiency',
    valueDriverId: 'esp-resource-efficiency',
    programId: 'esphora-cd',
    xlsSheet: 'ESPHORA',
    unit: '%',
    description: 'Finance overhead as a percentage of revenue. Target is reduction through process digitization.',
  },
];

// ─── EHR Program Definition ───────────────────────────────────────────────────
// XLS source: Initiative Sheet (rows 8-11) + EHR sheet + EHR Operational Benefits

export const EHR_DEFINITION = {
  id: 'ehr-patient-care',
  name: 'EHR / Patient Care',
  shortName: 'EHR / Patient Care',
  xlsScope:
    'EHR/EMR Platform Implementation (Soarian Replacement), Clinical Workflow Redesign & Documentation Standardization, Clinical Operating Model & Workforce Redesign, Revenue Cycle Modernization & Denial Reduction.',
  description:
    'Electronic Health Record transformation replacing Soarian with a modern EHR platform, redesigning clinical workflows and documentation, restructuring the clinical operating model and workforce, and modernizing the revenue cycle to reduce denials and accelerate cash collection.',
  subInitiatives: [
    'EHR/EMR Platform Implementation (Soarian Replacement)',
    'Clinical Workflow Redesign & Documentation Standardization',
    'Clinical Operating Model & Workforce Redesign',
    'Revenue Cycle Modernization & Denial Reduction',
  ],
} as const;

export const EHR_VALUE_DRIVERS: XlsValueDriver[] = [
  { id: 'ehr-no-show', name: 'Improved Treatment Yield (No-Shows)', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-drop-rate', name: 'Reduced Patient Drop Rate', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-referral', name: 'Improved Referral Velocity', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-consumables', name: 'Reduced Consumables Waste', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-hiring', name: 'Reduced Hiring & Deployment (Turnover)', programId: 'ehr-patient-care', xlsSheet: 'EHR Operational Benefits', hasQuantifiedModel: true },
  { id: 'ehr-backfill', name: 'Reduced Backfill Hours (Turnover)', programId: 'ehr-patient-care', xlsSheet: 'EHR Operational Benefits', hasQuantifiedModel: true },
  { id: 'ehr-agency', name: 'Reduced Agency Spend (Turnover)', programId: 'ehr-patient-care', xlsSheet: 'EHR Operational Benefits', hasQuantifiedModel: true },
  { id: 'ehr-overtime', name: 'Reduced Overtime Cost', programId: 'ehr-patient-care', xlsSheet: 'EHR Operational Benefits', hasQuantifiedModel: true },
  { id: 'ehr-cancel-avoid', name: 'Cost Avoidance — Cancellation', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-drop-avoid', name: 'Cost Avoidance — Patient Drop Rate', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-denials', name: 'Reduced Denials Write-Offs', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
  { id: 'ehr-cash', name: 'Accelerated Cash Collection', programId: 'ehr-patient-care', xlsSheet: 'EHR', hasQuantifiedModel: false },
];

export const EHR_KPIS: XlsKpiDefinition[] = [
  {
    id: 'ehr-noshow-rate',
    name: 'No-Show / Non-Attendance Rate',
    valueDriverId: 'ehr-no-show',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR',
    unit: '%',
    description: 'Percentage of scheduled treatments where the patient does not attend. Improved scheduling and reminders reduce no-shows.',
    illustrativeBaseline: '8%',
  },
  {
    id: 'ehr-drop-rate',
    name: 'Patient Drop Rate',
    valueDriverId: 'ehr-drop-rate',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR',
    unit: '%',
    description: 'Percentage of patients who discontinue care. Better care coordination and engagement reduce dropout.',
  },
  {
    id: 'ehr-referral-velocity',
    name: 'Referral-to-Treatment Time',
    valueDriverId: 'ehr-referral',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR',
    unit: 'Days',
    description: 'Average days from referral receipt to first treatment session. Faster referral processing increases patient volume.',
  },
  {
    id: 'ehr-consumables-waste',
    name: 'Consumables Waste Rate',
    valueDriverId: 'ehr-consumables',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR',
    unit: '%',
    description: 'Percentage of consumables disposed of unused. Better inventory integration and usage tracking reduces clinical waste.',
  },
  {
    id: 'ehr-overtime-hours',
    name: 'Annual Overtime Hours',
    valueDriverId: 'ehr-overtime',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR Operational Benefits',
    unit: 'Hours',
    description: 'Total overtime hours worked annually. EHR scheduling and workflow tools reduce overtime demand.',
    illustrativeBaseline: '5,366,418 hrs/yr',
    illustrativeTarget: '4,292,734 hrs/yr (−20%)',
    formulaHint: 'OT_hours × addressable% × improvement% × blended_rate × (1 + OT_premium)',
  },
  {
    id: 'ehr-staff-turnover',
    name: 'Nursing / PCT Turnover Rate',
    valueDriverId: 'ehr-hiring',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR Operational Benefits',
    unit: '%',
    description: 'Annual staff turnover rate for nursing and patient care technician roles. EHR improves workflow satisfaction and reduces avoidable turnover.',
    illustrativeBaseline: '19% nurses / 24% PCTs',
    illustrativeTarget: '17% nurses / 22% PCTs',
    formulaHint: 'Baseline turnover cost × improvement% = annual savings',
  },
  {
    id: 'ehr-agency-spend',
    name: 'Agency Staffing Spend',
    valueDriverId: 'ehr-agency',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR Operational Benefits',
    unit: '€M',
    description: 'Annual spend on premium agency/temporary staff driven by turnover-related vacancies. Reduced turnover decreases agency dependency.',
    formulaHint: 'Retained staff × retained hours × blended rate × improvement%',
  },
  {
    id: 'ehr-turnover-cost',
    name: 'Turnover Cost — Hiring & Deployment',
    valueDriverId: 'ehr-hiring',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR Operational Benefits',
    unit: '€M',
    description: 'Annual cost of hiring, onboarding, and deploying replacement staff. Includes recruiting, training, and productivity loss during ramp-up.',
    illustrativeBaseline: '~€90M/yr',
    illustrativeTarget: '~€81M/yr (−10%)',
    formulaHint: 'Baseline turnover cost × improvement%',
  },
  {
    id: 'ehr-backfill-hours',
    name: 'Backfill Hours',
    valueDriverId: 'ehr-backfill',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR Operational Benefits',
    unit: 'Hours',
    description: 'Hours of incremental backfill pay for staff covering vacant positions. EHR-enabled retention reduces backfill demand.',
    illustrativeBaseline: '1,732,667 hrs/yr',
    formulaHint: 'Backfill_hours × addressable% × improvement% × avg_incremental_rate',
  },
  {
    id: 'ehr-denial-rate',
    name: 'Claims Denial Rate',
    valueDriverId: 'ehr-denials',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR',
    unit: '%',
    description: 'Percentage of submitted claims denied by payers. Improved coding accuracy and documentation compliance reduces denials.',
  },
  {
    id: 'ehr-dso',
    name: 'Days Sales Outstanding (DSO)',
    valueDriverId: 'ehr-cash',
    programId: 'ehr-patient-care',
    xlsSheet: 'EHR',
    unit: 'Days',
    description: 'Average days from treatment delivery to payment receipt. Revenue cycle modernization accelerates cash collection.',
  },
];

// ─── Supply Chain Program Definition ─────────────────────────────────────────
// XLS source: Initiative Sheet (rows 6-7) + Supply Chain sheet

export const SUPPLY_CHAIN_DEFINITION = {
  id: 'supply-chain',
  name: 'Supply Chain',
  shortName: 'Supply Chain',
  xlsScope:
    'Supply Chain Network Redesign & Vendor Consolidation and Demand-Driven Replenishment & Inventory Optimization.',
  description:
    'End-to-end supply chain transformation comprising network redesign and vendor consolidation, followed by demand-driven replenishment and inventory optimization. Targets reduction in Days Inventory Outstanding, improved forecast accuracy, higher OTIF performance, and elimination of maverick spend.',
  subInitiatives: [
    'Supply Chain Network Redesign & Vendor Consolidation',
    'Demand-Driven Replenishment & Inventory Optimization',
  ],
} as const;

export const SUPPLY_CHAIN_VALUE_DRIVERS: XlsValueDriver[] = [
  { id: 'sc-dio', name: 'Reduced DIO', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Days Inventory Outstanding (DIO)', hasQuantifiedModel: false },
  { id: 'sc-inventory-cost', name: 'Reduced Inventory Cost', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Inventory turnover ratio', hasQuantifiedModel: false },
  { id: 'sc-forecast', name: 'Improved revenue due to forecast accuracy', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Forecast accuracy (MAPE %)', hasQuantifiedModel: false },
  { id: 'sc-stockout', name: 'Reduced Stockout Rate', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Stockout rate for critical SKUs (%)', hasQuantifiedModel: false },
  { id: 'sc-obsolete', name: 'Reduced Obsolete Inventory', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Inventory write-off / obsolescence', hasQuantifiedModel: false },
  { id: 'sc-fill-rate', name: 'Increased Number of Orders Fulfilled', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Order Fill rate (%)', hasQuantifiedModel: false },
  { id: 'sc-safety-stock', name: 'Reduction in lost sales due to stockouts', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Average Safety Stock as % of Total Inventory', hasQuantifiedModel: false },
  { id: 'sc-otif', name: 'Increased Revenue from Higher OTIF', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'OTIF', hasQuantifiedModel: false },
  { id: 'sc-supplier-otif', name: 'Improved Supplier OTIF', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Supplier OTIF', hasQuantifiedModel: false },
  { id: 'sc-maverick', name: 'Reduced spend with reductions in maverick spend', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Maverick Spend as % of Total Spend', hasQuantifiedModel: false },
  { id: 'sc-demand-efficiency', name: 'Demand Planning Resource Efficiency', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Cycle time in days to predict demand', hasQuantifiedModel: false },
  { id: 'sc-fulfillment-efficiency', name: 'Improved Fulfillment Resource Efficiency', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Fulfillment Order Cycle Time', hasQuantifiedModel: false },
  { id: 'sc-transport', name: 'Total Transportation spend', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Total Transportation Spend as % of Revenue', hasQuantifiedModel: false },
  { id: 'sc-expedited', name: 'Reduced Expedited Shipment Costs', programId: 'supply-chain', xlsSheet: 'Supply Chain', impactedMetric: 'Expedited shipment costs as % of total transportation costs', hasQuantifiedModel: false },
];

export const SUPPLY_CHAIN_KPIS: XlsKpiDefinition[] = [
  {
    id: 'sc-dio',
    name: 'Days Inventory Outstanding (DIO)',
    valueDriverId: 'sc-dio',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: 'Days',
    description: 'Average days of inventory on hand. DIO reduction frees working capital and reduces carrying cost.',
    formulaHint: 'Inventory cost base × (DIO reduction / 365) = working capital improvement',
  },
  {
    id: 'sc-inventory-turns',
    name: 'Inventory Turnover Ratio',
    valueDriverId: 'sc-inventory-cost',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: 'Other',
    description: 'Times inventory is replenished annually. Higher turns indicate leaner, more efficient inventory management.',
  },
  {
    id: 'sc-forecast-mape',
    name: 'Forecast Accuracy (MAPE)',
    valueDriverId: 'sc-forecast',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Mean Absolute Percentage Error of demand forecasts. Lower MAPE means less safety stock and fewer stockouts.',
  },
  {
    id: 'sc-stockout-rate',
    name: 'Stockout Rate (Critical SKUs)',
    valueDriverId: 'sc-stockout',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Percentage of instances where a critical medical supply SKU was unavailable when needed for treatment.',
  },
  {
    id: 'sc-order-fill',
    name: 'Order Fill Rate',
    valueDriverId: 'sc-fill-rate',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Percentage of orders fulfilled completely and on-time from stock.',
  },
  {
    id: 'sc-otif',
    name: 'OTIF — On-Time In-Full',
    valueDriverId: 'sc-otif',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Percentage of orders delivered on time and in full. OTIF improvement reduces last-minute substitutions and emergency orders.',
  },
  {
    id: 'sc-supplier-otif',
    name: 'Supplier OTIF',
    valueDriverId: 'sc-supplier-otif',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Supplier-side on-time, in-full delivery rate. Vendor consolidation and discipline improve supplier OTIF.',
  },
  {
    id: 'sc-maverick-spend',
    name: 'Maverick Spend Rate',
    valueDriverId: 'sc-maverick',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Unauthorized or off-contract purchasing as a percentage of total spend. Vendor consolidation and ERP controls reduce maverick spend.',
  },
  {
    id: 'sc-obsolete-inventory',
    name: 'Inventory Write-off / Obsolescence',
    valueDriverId: 'sc-obsolete',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '€M',
    description: 'Annual value of inventory written off due to expiry or obsolescence. Demand-driven replenishment reduces write-offs.',
  },
  {
    id: 'sc-transport-pct',
    name: 'Transportation Spend (% of Revenue)',
    valueDriverId: 'sc-transport',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Total inbound + outbound transportation cost as a proportion of revenue. Network redesign and consolidation reduce transport cost.',
  },
  {
    id: 'sc-expedited-pct',
    name: 'Expedited Shipment Rate',
    valueDriverId: 'sc-expedited',
    programId: 'supply-chain',
    xlsSheet: 'Supply Chain',
    unit: '%',
    description: 'Percentage of orders requiring expedited (premium) shipping. Lower expedited rates indicate better planning and reliability.',
  },
];

// ─── CE_Gemini (GEMINI) Program Definition ────────────────────────────────────
// XLS source: Initiative Sheet (rows 12-13) + CE_Gemini sheet

export const GEMINI_DEFINITION = {
  id: 'gemini',
  name: 'CE / GEMINI',
  shortName: 'CE / GEMINI',
  xlsScope:
    'R6 NexStage — Care Enablement ERP & Process Design and MES for Gemini Plants & AMD Plant Templates.',
  description:
    'Care Enablement ERP transformation implementing R6 NexStage to redesign care delivery processes, combined with a Manufacturing Execution System (MES) for Gemini dialyzer plants and AMD plant templates. Targets OEE improvement, production cost reduction, quality uplift, and warehouse efficiency.',
  subInitiatives: [
    'R6 NexStage — Care Enablement ERP & Process Design',
    'MES for Gemini Plants & AMD Plant Templates',
  ],
} as const;

export const GEMINI_VALUE_DRIVERS: XlsValueDriver[] = [
  { id: 'gem-oee', name: 'Improved Equipment Effectiveness', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-capacity', name: 'Improved Manufacturing Capacity Utilization', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-plan-accuracy', name: 'Improved Production Plan Accuracy', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-asset-util', name: 'Improved Asset Utilization', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-resource-eff', name: 'Manufacturing Resource Efficiency', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-prod-cost', name: 'Reduced Production Cost', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-inventory', name: 'Reduced Inventory Cost', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-obsolete', name: 'Reduced Obsolete Inventory', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-scrap', name: 'Reduced Manufacturing Scrap / Shrinkage', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-quality', name: 'Improved Product Quality', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
  { id: 'gem-warehouse', name: 'Reduced Warehouse Cost', programId: 'gemini', xlsSheet: 'CE_Gemini', hasQuantifiedModel: false },
];

export const GEMINI_KPIS: XlsKpiDefinition[] = [
  {
    id: 'gem-oee',
    name: 'Overall Equipment Effectiveness (OEE)',
    valueDriverId: 'gem-oee',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '%',
    description: 'Composite measure of equipment availability, performance rate, and quality rate for Gemini plant machinery.',
    formulaHint: 'OEE improvement × production throughput × margin per unit',
  },
  {
    id: 'gem-capacity-util',
    name: 'Manufacturing Capacity Utilization',
    valueDriverId: 'gem-capacity',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '%',
    description: 'Actual output as a percentage of maximum rated output. MES enables better scheduling and reduces downtime.',
  },
  {
    id: 'gem-plan-accuracy',
    name: 'Production Plan Accuracy',
    valueDriverId: 'gem-plan-accuracy',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '%',
    description: 'Percentage of production runs completed on schedule and at target volume. Improved planning reduces changeover waste and idle time.',
  },
  {
    id: 'gem-scrap-rate',
    name: 'Manufacturing Scrap / Shrinkage Rate',
    valueDriverId: 'gem-scrap',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '%',
    description: 'Proportion of input materials lost to defects, rework, or waste during production. MES-driven SPC reduces scrap.',
    formulaHint: 'Production cost base × scrap rate reduction %',
  },
  {
    id: 'gem-prod-cost',
    name: 'Production Cost per Unit',
    valueDriverId: 'gem-prod-cost',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '€M',
    description: 'Manufacturing cost per dialyzer unit. Efficiency gains, scrap reduction, and better yield improve unit cost.',
  },
  {
    id: 'gem-asset-util',
    name: 'Asset Utilization Rate',
    valueDriverId: 'gem-asset-util',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '%',
    description: 'Productive use of manufacturing assets relative to total available capacity.',
  },
  {
    id: 'gem-warehouse-cost',
    name: 'Warehouse Cost',
    valueDriverId: 'gem-warehouse',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '€M',
    description: 'Annual cost of warehousing finished goods and raw materials at Gemini and AMD plants.',
  },
  {
    id: 'gem-inventory-cost',
    name: 'Manufacturing Inventory Cost',
    valueDriverId: 'gem-inventory',
    programId: 'gemini',
    xlsSheet: 'CE_Gemini',
    unit: '€M',
    description: 'Carrying cost of work-in-progress and finished goods inventory. Better planning and JIT replenishment reduce inventory levels.',
  },
];

// ─── All Programs Index ───────────────────────────────────────────────────────

export const XLS_PROGRAMS = [
  ESPHORA_DEFINITION,
  EHR_DEFINITION,
  SUPPLY_CHAIN_DEFINITION,
  GEMINI_DEFINITION,
] as const;

export const XLS_KPIS_BY_PROGRAM: Record<string, XlsKpiDefinition[]> = {
  'esphora-cd': ESPHORA_KPIS,
  'ehr-patient-care': EHR_KPIS,
  'supply-chain': SUPPLY_CHAIN_KPIS,
  gemini: GEMINI_KPIS,
};

export const XLS_VALUE_DRIVERS_BY_PROGRAM: Record<string, XlsValueDriver[]> = {
  'esphora-cd': ESPHORA_VALUE_DRIVERS,
  'ehr-patient-care': EHR_VALUE_DRIVERS,
  'supply-chain': SUPPLY_CHAIN_VALUE_DRIVERS,
  gemini: GEMINI_VALUE_DRIVERS,
};

/** True if this program ID is backed by the FME workbook */
export function isXlsBacked(programId: string): boolean {
  return programId in XLS_KPIS_BY_PROGRAM;
}

/** Return all XLS KPI definitions for a program, or [] for user-added programs */
export function getXlsKpis(programId: string): XlsKpiDefinition[] {
  return XLS_KPIS_BY_PROGRAM[programId] ?? [];
}

/** Return all XLS value drivers for a program */
export function getXlsValueDrivers(programId: string): XlsValueDriver[] {
  return XLS_VALUE_DRIVERS_BY_PROGRAM[programId] ?? [];
}
