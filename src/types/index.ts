// ─── Programs & Outcomes ────────────────────────────────────────────────────

export type ProgramId = string;

export type OutcomeId =
  | 'grow-patient-volume'
  | 'reduce-cost-per-treatment'
  | 'scalable-digital-enterprise';

export interface Program {
  id: ProgramId;
  name: string;
  shortName: string;
  description: string;
  outcomes: OutcomeId[];
  accentureHypothesis: string;
  defaultTimeline: { startMonth: number; durationMonths: number };
}

export interface EnterpriseOutcome {
  id: OutcomeId;
  label: string;
  sublabel: string;
  description: string;
  programs: ProgramId[];
}

// ─── Program KPIs ────────────────────────────────────────────────────────────

export type KpiUnit = '%' | '€' | '€M' | '$' | 'Days' | 'Hours' | 'Volume' | 'Count' | 'Rate' | 'Other';

export interface ProgramKPI {
  id: string;
  name: string;
  baseline: string;
  target: string;
  unit: KpiUnit;
  outcomeIds: OutcomeId[];
  isCustom: boolean;
  isActive: boolean;
  context: string;
}

// ─── Program Library Entry ───────────────────────────────────────────────────

export type ProgramStatus = 'planned' | 'in-design' | 'in-flight' | 'scaling';

export interface ProgramLibraryEntry {
  id: string;
  name: string;
  shortName: string;
  description: string;
  isBuiltIn: boolean;
  status: ProgramStatus;
  startTiming: string;
  targetCompletion: string;
  investmentEurM: Assumption<number>;
  illustrativeValueEurM: Assumption<number>;
  outcomes: OutcomeId[];
  outcomePriorities: Partial<Record<OutcomeId, number>>;
  kpis: ProgramKPI[];
  dependencies: string[];
  sharedWorkforce: boolean;
  sharedData: boolean;
  sharedTechnology: boolean;
  sharedChangePopulation: boolean;
  timingDependency: boolean;
  dependencyContext: string;
  integrationHypothesis: string;
  defaultTimeline: { startMonth: number; durationMonths: number };
  additionalContext: string;
  notes: string;
  costAssumptions: {
    governanceCostBaseEurM: Assumption<number>;
    changeCostBaseEurM: Assumption<number>;
    trainingCostBaseEurM: Assumption<number>;
    dataIntegrationCostBaseEurM: Assumption<number>;
    programResourceCostBaseEurM: Assumption<number>;
  };
}

// ─── Assumption Provenance ──────────────────────────────────────────────────

export type AssumptionSource =
  | 'fme-reported'
  | 'accenture-estimate'
  | 'user-input'
  | 'adjusted'
  | 'unknown';

export interface Assumption<T = number> {
  value: T | null;
  source: AssumptionSource;
  baseValue?: T | null;
  originalSource?: AssumptionSource;
}

// ─── Assumption Constructors ─────────────────────────────────────────────────

export function accentureEstimate<T>(value: T): Assumption<T> {
  return { value, source: 'accenture-estimate', baseValue: value, originalSource: 'accenture-estimate' };
}

export function fmeReported<T>(value: T): Assumption<T> {
  return { value, source: 'fme-reported', baseValue: value, originalSource: 'fme-reported' };
}

export function emptyInput(): Assumption<number> {
  return { value: null, source: 'unknown' };
}

export function emptyStringInput(): Assumption<string> {
  return { value: null, source: 'unknown' };
}

// ─── Assumption Mutators ─────────────────────────────────────────────────────

export function adjustAssumption<T>(a: Assumption<T>, newValue: T | null): Assumption<T> {
  if (newValue === null) {
    return { ...a, value: null, source: 'unknown' };
  }
  const isAuthoritative =
    a.source === 'fme-reported' ||
    a.source === 'accenture-estimate' ||
    a.source === 'adjusted';
  const hasBase = a.baseValue !== undefined && a.baseValue !== null;
  const isRestoringBase = hasBase && newValue === a.baseValue;

  if (isRestoringBase) {
    return { ...a, value: newValue, source: a.originalSource ?? a.source };
  }

  return {
    ...a,
    value: newValue,
    source: isAuthoritative ? 'adjusted' : 'user-input',
    baseValue: a.baseValue ?? (isAuthoritative ? a.value : undefined),
    originalSource: a.originalSource ?? (isAuthoritative ? a.source : undefined),
  };
}

export function resetAssumption<T>(a: Assumption<T>): Assumption<T> {
  if (a.baseValue === undefined || a.baseValue === null) return { ...a, value: null, source: 'unknown' };
  return { ...a, value: a.baseValue, source: a.originalSource ?? a.source };
}

// ─── Shared Cost ─────────────────────────────────────────────────────────────

export interface SharedCostCategory {
  id: string;
  label: string;
  costBaseEurM: Assumption<number>;
  sharedPct: Assumption<number>;
}

export function calcSharedBenefit(cat: SharedCostCategory): number | null {
  if (cat.costBaseEurM.value === null) return null;
  return (cat.costBaseEurM.value * (cat.sharedPct.value ?? 0)) / 100;
}

export function calcTotalSharedBenefit(
  sc: SharedCostAssumptions
): { total: number | null; missingCount: number } {
  const cats: SharedCostCategory[] = [
    sc.governance,
    sc.changeManagement,
    sc.trainingRollout,
    sc.dataIntegration,
    sc.programResource,
  ];
  let total = 0;
  let missingCount = 0;
  let anyComputable = false;
  for (const cat of cats) {
    const b = calcSharedBenefit(cat);
    if (b !== null) {
      total += b;
      anyComputable = true;
    } else {
      missingCount++;
    }
  }
  return { total: anyComputable ? total : null, missingCount };
}

// ─── Business Outcome Assumptions ───────────────────────────────────────────

export interface BusinessOutcomeAssumptions {
  patientVolumeUpliftPct: Assumption<number>;
  costPerTreatmentImprovementPct: Assumption<number>;
  clinicProductivityImprovementPct: Assumption<number>;
  supplyWasteReductionPct: Assumption<number>;
  overallValueCapturePct: Assumption<number>;
  noShowRateReductionPct: Assumption<number>;
  cancellationRateReductionPct: Assumption<number>;
  inventoryTurnsImprovementPct: Assumption<number>;
  stockoutReductionPct: Assumption<number>;
  financeProductivityImprovementPct: Assumption<number>;
  dsoReductionPct: Assumption<number>;
}

// ─── Shared Cost Assumptions ──────────────────────────────────────────────

export interface SharedCostAssumptions {
  governance: SharedCostCategory;
  changeManagement: SharedCostCategory;
  trainingRollout: SharedCostCategory;
  dataIntegration: SharedCostCategory;
  programResource: SharedCostCategory;
}

// ─── Timing ───────────────────────────────────────────────────────────────

export type ValueRealizationSpeed = 'slower' | 'expected' | 'faster';

export interface TransformationTimingAssumptions {
  compressionMonths: Assumption<number>;
  valueRealizationSpeed: Assumption<ValueRealizationSpeed>;
  programStartMonths: Record<string, number>;
  rampToFullValueMonths: Assumption<number>;
}

// ─── Financial Baselines ─────────────────────────────────────────────────

export interface FinancialBaselines {
  revenueBaselineEurM: Assumption<number>;
  annualTreatmentVolume: Assumption<number>;
  costPerTreatmentEur: Assumption<number>;
  currentNoShowRatePct: Assumption<number>;
  supplyConsumableCostBaseEurM: Assumption<number>;
  valuePerIncrementalTreatmentEur: Assumption<number>;
}

// ─── Per-Program XLS Value Inputs ────────────────────────────────────────────
// Operational drivers sourced from "Fresenius Initiative KPI mapping_Draft.xlsx".
// Each field maps to a specific XLS value driver formula.
// Only the relevant subset of fields is used per program ID.

export interface ProgramValueInputs {
  // ── EHR Operational Benefits (XLS: EHR Operational Benefits sheet) ──────────
  ehrAnnualOtHours?: Assumption<number>;          // Annual overtime hours baseline
  ehrOtAddressablePct?: Assumption<number>;        // % of OT addressable by EHR
  ehrOtImprovementPct?: Assumption<number>;        // Improvement % (reduction)
  ehrOtNursePct?: Assumption<number>;              // Nurse share of OT hours (%)
  ehrOtNurseRateEur?: Assumption<number>;          // Nurse avg hourly rate (€)
  ehrOtPctRateEur?: Assumption<number>;            // PCT avg hourly rate (€)
  ehrOtPremiumPct?: Assumption<number>;            // OT premium %
  ehrTurnoverCostBaseEurM?: Assumption<number>;    // Annual turnover cost base (€M)
  ehrTurnoverImprovementPct?: Assumption<number>;  // Turnover improvement %
  ehrBackfillHoursBase?: Assumption<number>;       // Annual backfill hours baseline
  ehrBackfillAddressablePct?: Assumption<number>;  // % of backfill addressable by EHR
  ehrBackfillImprovementPct?: Assumption<number>;  // Backfill hours improvement %
  ehrBackfillAvgRateEur?: Assumption<number>;      // Avg incremental backfill rate (€/hr)
  // ── Supply Chain (XLS: Supply Chain sheet) ───────────────────────────────────
  scInventoryCostBaseEurM?: Assumption<number>;    // Inventory carrying cost base (€M)
  scDioImprovementPct?: Assumption<number>;        // DIO reduction %
  scMaverickSpendBaseEurM?: Assumption<number>;    // Maverick spend cost base (€M)
  scMaverickReductionPct?: Assumption<number>;     // Maverick spend reduction %
  // ── ESPHORA Finance (XLS: ESPHORA sheet) ─────────────────────────────────────
  espFinanceFteCostBaseEurM?: Assumption<number>;  // Finance FTE annual cost base (€M)
  espFteImprovementPct?: Assumption<number>;       // FTE productivity improvement %
  espDsoBaselineDays?: Assumption<number>;         // DSO baseline (days)
  espDsoImprovementPct?: Assumption<number>;       // DSO reduction %
  espRevenueBaseEurM?: Assumption<number>;         // Revenue base for DSO calc (€M)
  // ── GEMINI Manufacturing (XLS: CE_Gemini sheet) ──────────────────────────────
  gemManufacturingCostBaseEurM?: Assumption<number>;    // Manufacturing cost base (€M)
  gemProductionCostImprovementPct?: Assumption<number>; // Production cost reduction %
  gemScrapRateBaselinePct?: Assumption<number>;         // Scrap rate baseline %
  gemScrapRateTargetPct?: Assumption<number>;           // Scrap rate target %
}

// ─── Scenario ────────────────────────────────────────────────────────────────

export type ScenarioStatus = 'draft' | 'complete';

export interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: ScenarioStatus;
}

export interface Scenario {
  metadata: ScenarioMetadata;
  isBaseCaseLocked: boolean;
  selectedPrograms: string[];
  businessOutcomes: BusinessOutcomeAssumptions;
  sharedCosts: SharedCostAssumptions;
  timing: TransformationTimingAssumptions;
  financialBaselines: FinancialBaselines;
  programInvestmentsEurM: Record<string, Assumption<number>>;
  programValueInputs: Record<string, ProgramValueInputs>;
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  scenarios: Scenario[];
  activeScenarioId: string;
  programLibrary: ProgramLibraryEntry[];
}

export const BASE_CASE_ID = 'illustrative-base';
