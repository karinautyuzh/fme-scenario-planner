// ─── Calculation Engine Types ─────────────────────────────────────────────────

export type CalculationStatus =
  | 'CALCULATED'     // All required inputs present; value is reliable
  | 'PARTIAL'        // Some components calculable; total is indicative
  | 'REQUIRES_INPUT' // Cannot calculate — specify what is missing
  | 'NOT_APPLICABLE'; // Correct answer is zero or N/A for this scenario

export interface CalculationResult<T = number> {
  value: T | null;
  status: CalculationStatus;
  requiredInputs: string[];
  calculationDescription: string;
  inputs?: Record<string, string | number | null>;
  isRecurring?: boolean;
  warning?: string;
}

export interface ValueCurvePoint {
  year: number;                    // 2026–2035
  separateCumulative: number | null;
  integratedCumulative: number | null;
}

export interface ScenarioEngineOutput {
  // Business outcomes (annual run-rate, after value capture %)
  incrementalTreatmentVolume: CalculationResult<number>;
  potentialAnnualVolumeValue: CalculationResult<number>;
  potentialAnnualCostBenefit: CalculationResult<number>;
  potentialAnnualWasteBenefit: CalculationResult<number>;
  totalAnnualBusinessValue: CalculationResult<number>;

  // Shared cost benefit (from integration savings)
  totalSharedCostBenefit: CalculationResult<number>;
  sharedCostCoverage: { calculated: number; total: number };

  // Timing
  separateValueStartMonth: number;      // months from Jan 2026
  integratedValueStartMonth: number;
  separateValueStartLabel: string;      // e.g. "H1 2029"
  integratedValueStartLabel: string;

  // Value realization curve (2026–2035)
  valueCurve: ValueCurvePoint[];

  // Value acceleration (the hero metric)
  valueAccelerated2030: CalculationResult<number>;
  valueAccelerated2035: CalculationResult<number>;

  // Meta
  hasEnoughForCurve: boolean;
  missingFinancialInputs: string[];
}
