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
    name: 'Illustrative Starting Point',
    description:
      'Starting hypothesis based on comparable healthcare transformations. All four programs under integrated design. Values are illustrative — requires FME validation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
  },
  isBaseCaseLocked: true,

  selectedPrograms: ['esphora-cd', 'ehr-patient-care', 'supply-chain', 'gemini'],

  businessOutcomes: {
    patientVolumeUpliftPct: accentureEstimate(3),
    costPerTreatmentImprovementPct: accentureEstimate(8),
    clinicProductivityImprovementPct: accentureEstimate(10),
    supplyWasteReductionPct: accentureEstimate(15),
    overallValueCapturePct: accentureEstimate(65),
    noShowRateReductionPct: emptyInput(),
    cancellationRateReductionPct: emptyInput(),
    inventoryTurnsImprovementPct: emptyInput(),
    stockoutReductionPct: emptyInput(),
    financeProductivityImprovementPct: accentureEstimate(12),
    dsoReductionPct: emptyInput(),
  },

  sharedCosts: {
    governance: {
      id: 'governance',
      label: 'Governance / Management',
      costBaseEurM: emptyInput(),
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

  financialBaselines: {
    revenueBaselineEurM: emptyInput(),
    annualTreatmentVolume: emptyInput(),
    costPerTreatmentEur: fmeReported(8500),
    currentNoShowRatePct: fmeReported(8),
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
