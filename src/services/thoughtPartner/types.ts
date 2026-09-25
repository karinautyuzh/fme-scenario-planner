export type ThoughtPartnerIntent =
  | 'MISSING_INPUTS'
  | 'VALUE_DRIVERS'
  | 'ADD_PROGRAM'
  | 'SCENARIO_DIFF'
  | 'INDUSTRY_INSIGHT'
  | 'TIMELINE'
  | 'CALCULATION'
  | 'SENSITIVITY'
  | 'GENERAL';

export interface ThoughtPartnerContext {
  scenarioName: string;
  isBaseCaseLocked: boolean;
  selectedPrograms: string[];
  selectedProgramIds: string[];
  selectedProgramCount: number;
  compressionMonths: number | null;
  valueRealizationSpeed: string | null;
  totalAnnualValueEurM: number | null;
  totalAnnualValueStatus: string;
  valueAccelerated2030EurM: number | null;
  separateValueStartLabel: string;
  integratedValueStartLabel: string;
  missingFinancialInputs: string[];
  hasEnoughForCurve: boolean;
  allScenarioNames: string[];
  scenarioCount: number;
  patientVolumeUpliftPct: number | null;
  costPerTreatmentImprovementPct: number | null;
  supplyWasteReductionPct: number | null;
  overallValueCapturePct: number | null;
  totalSharedCostBenefitEurM?: number | null;
  activeKpisByProgram: Record<string, string[]>;
  standaloneValueByProgram: Record<string, number | null>;
}

export interface IndustryInsight {
  id: string;
  topic: string;
  claim: string;
  sourceLabel: string;
  detail: string;
  relevantPrograms: string[];
  isDemoData: boolean;
}

export interface ThoughtPartnerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: ThoughtPartnerIntent;
  insights?: IndustryInsight[];
  suggestedFollowUps?: string[];
}

export interface ThoughtPartnerResponse {
  content: string;
  intent: ThoughtPartnerIntent;
  insights?: IndustryInsight[];
  suggestedFollowUps?: string[];
}

export interface SuggestedPrompt {
  text: string;
  intent: ThoughtPartnerIntent;
  conditionMet: boolean;
}
