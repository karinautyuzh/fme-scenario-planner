import {
  Scenario,
  BASE_CASE_ID,
  accentureEstimate,
  fmeReported,
  emptyInput,
} from '../types';

export const ACCENTURE_BASE_CASE: Scenario = {
  metadata: {
    id: BASE_CASE_ID,
    name: 'Accenture Base Case – Estimates',
    description:
      'Accenture starting hypothesis based on FME source materials. All four programs under integrated design. Assumptions are editable starting points — clone this scenario to build your own.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
  },
  isBaseCaseLocked: true,

  // Full integration hypothesis: all four programs
  selectedPrograms: ['esphora-cd', 'ehr-patient-care', 'supply-chain', 'gemini'],

  businessOutcomes: {
    // Core transformation levers — Accenture Estimates based on comparable healthcare transformations
    patientVolumeUpliftPct: accentureEstimate(3),
    costPerTreatmentImprovementPct: accentureEstimate(8),
    clinicProductivityImprovementPct: accentureEstimate(10),
    supplyWasteReductionPct: accentureEstimate(15),
    overallValueCapturePct: accentureEstimate(65),

    // Program-specific KPIs — FME operational baseline where known, otherwise empty
    // EHR / Patient Care
    noShowRateReductionPct: emptyInput(), // FME to confirm current rate
    cancellationRateReductionPct: emptyInput(),

    // Supply Chain
    inventoryTurnsImprovementPct: emptyInput(),
    stockoutReductionPct: emptyInput(),

    // GEMINI / Enterprise reporting
    financeProductivityImprovementPct: accentureEstimate(12),
    dsoReductionPct: emptyInput(),
  },

  sharedCosts: {
    governance: {
      id: 'governance',
      label: 'Governance / Management',
      costBaseEurM: emptyInput(), // FME must enter
      sharedPct: accentureEstimate(40),
    },
    changeManagement: {
      id: 'changeManagement',
      label: 'Change Management',
      costBaseEurM: emptyInput(),
      sharedPct: accentureEstimate(50),
    },
    trainingRollout: {
      id: 'trainingRollout',
      label: 'Training / Rollout',
      costBaseEurM: emptyInput(),
      sharedPct: accentureEstimate(60),
    },
    dataIntegration: {
      id: 'dataIntegration',
      label: 'Data / Integration Build',
      costBaseEurM: emptyInput(),
      sharedPct: accentureEstimate(70),
    },
    programResource: {
      id: 'programResource',
      label: 'Program Resource',
      costBaseEurM: emptyInput(),
      sharedPct: accentureEstimate(20),
    },
  },

  timing: {
    compressionMonths: accentureEstimate(6),
    valueRealizationSpeed: accentureEstimate<import('../types').ValueRealizationSpeed>('expected'),
    rampToFullValueMonths: accentureEstimate(24),
    programStartMonths: {
      'esphora-cd': 0,
      'ehr-patient-care': 2,
      'supply-chain': 3,
      'gemini': 1,
    },
  },

  // Financial baselines — FME must confirm from their own reporting
  financialBaselines: {
    revenueBaselineEurM: emptyInput(),
    annualTreatmentVolume: emptyInput(),
    // Cost per treatment is a known FME operational metric — labeled as FME Reported
    // Value below is an indicative baseline; Martin should confirm against current FY data
    costPerTreatmentEur: fmeReported(8500),
    // No-show rate from FME operational materials — confirm and adjust as needed
    currentNoShowRatePct: fmeReported(8),
    // Supply / consumable cost base and treatment value — FME must provide from financials
    supplyConsumableCostBaseEurM: emptyInput(),
    valuePerIncrementalTreatmentEur: emptyInput(),
  },

  programInvestmentsEurM: {
    'esphora-cd': emptyInput(),
    'ehr-patient-care': emptyInput(),
    'supply-chain': emptyInput(),
    'gemini': emptyInput(),
  },
};
