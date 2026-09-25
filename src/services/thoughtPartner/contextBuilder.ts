import { Scenario, ProgramLibraryEntry } from '../../types';
import { ScenarioEngineOutput } from '../../engine/types';
import { ThoughtPartnerContext, SuggestedPrompt, ThoughtPartnerIntent } from './types';

export function buildThoughtPartnerContext(
  scenario: Scenario,
  engine: ScenarioEngineOutput,
  allScenarios: Scenario[],
  programLibrary: ProgramLibraryEntry[] = []
): ThoughtPartnerContext {
  const selectedProgramNames = scenario.selectedPrograms.map(
    (id) => programLibrary.find((p) => p.id === id)?.shortName ?? id
  );

  const accel2030 =
    engine.valueAccelerated2030.status === 'CALCULATED' && engine.valueAccelerated2030.value !== null
      ? engine.valueAccelerated2030.value
      : null;

  const totalSharedCostBenefitEurM = engine.totalSharedCostBenefit.value;

  const activeKpisByProgram: Record<string, string[]> = {};
  const standaloneValueByProgram: Record<string, number | null> = {};
  for (const pid of scenario.selectedPrograms) {
    const prog = programLibrary.find((p) => p.id === pid);
    if (prog) {
      const label = prog.shortName || prog.name;
      activeKpisByProgram[label] = prog.kpis.filter((k) => k.isActive).map((k) => k.name);
      standaloneValueByProgram[label] = engine.standaloneValueByProgram[pid]?.value ?? null;
    }
  }

  return {
    scenarioName: scenario.metadata.name,
    isBaseCaseLocked: scenario.isBaseCaseLocked,
    selectedPrograms: selectedProgramNames,
    selectedProgramIds: [...scenario.selectedPrograms],
    selectedProgramCount: scenario.selectedPrograms.length,
    compressionMonths: scenario.timing.compressionMonths.value,
    valueRealizationSpeed: scenario.timing.valueRealizationSpeed.value,
    totalAnnualValueEurM: engine.totalAnnualBusinessValue.value,
    totalAnnualValueStatus: engine.totalAnnualBusinessValue.status,
    valueAccelerated2030EurM: accel2030,
    separateValueStartLabel: engine.separateValueStartLabel,
    integratedValueStartLabel: engine.integratedValueStartLabel,
    missingFinancialInputs: engine.missingFinancialInputs,
    hasEnoughForCurve: engine.hasEnoughForCurve,
    allScenarioNames: allScenarios.map((s) => s.metadata.name),
    scenarioCount: allScenarios.length,
    patientVolumeUpliftPct: scenario.businessOutcomes.patientVolumeUpliftPct.value,
    costPerTreatmentImprovementPct: scenario.businessOutcomes.costPerTreatmentImprovementPct.value,
    supplyWasteReductionPct: scenario.businessOutcomes.supplyWasteReductionPct.value,
    overallValueCapturePct: scenario.businessOutcomes.overallValueCapturePct.value,
    totalSharedCostBenefitEurM,
    activeKpisByProgram,
    standaloneValueByProgram,
  };
}

interface PromptSpec {
  text: string;
  intent: ThoughtPartnerIntent;
  show: (ctx: ThoughtPartnerContext) => boolean;
}

const PROMPT_SPECS: PromptSpec[] = [
  {
    text: 'What inputs do I still need to unlock the full value calculation?',
    intent: 'MISSING_INPUTS',
    show: (ctx) => ctx.missingFinancialInputs.length > 0,
  },
  {
    text: 'Which assumptions drive the most total value?',
    intent: 'VALUE_DRIVERS',
    show: (ctx) => ctx.selectedProgramCount > 0,
  },
  {
    text: 'What is driving the synergy uplift in this scenario?',
    intent: 'VALUE_DRIVERS',
    show: (ctx) => ctx.selectedProgramCount >= 2,
  },
  {
    text: 'Which dimension is limiting the integration score?',
    intent: 'VALUE_DRIVERS',
    show: (ctx) => ctx.selectedProgramCount >= 2,
  },
  {
    text: 'How does running programs together accelerate value versus separately?',
    intent: 'TIMELINE',
    show: (ctx) => ctx.compressionMonths !== null && ctx.compressionMonths > 0,
  },
  {
    text: 'What would change if I removed one of these programs?',
    intent: 'SENSITIVITY',
    show: (ctx) => ctx.selectedProgramCount > 1,
  },
  {
    text: 'Walk me through how the annual value is calculated.',
    intent: 'CALCULATION',
    show: () => true,
  },
  {
    text: 'What industry benchmarks exist for EHR-led patient volume uplift?',
    intent: 'INDUSTRY_INSIGHT',
    show: (ctx) => ctx.patientVolumeUpliftPct !== null,
  },
  {
    text: 'What industry benchmarks exist for supply chain waste reduction?',
    intent: 'INDUSTRY_INSIGHT',
    show: (ctx) =>
      ctx.supplyWasteReductionPct !== null && ctx.patientVolumeUpliftPct === null,
  },
  {
    text: 'How does this scenario compare to the others I have built?',
    intent: 'SCENARIO_DIFF',
    show: (ctx) => ctx.scenarioCount > 1 && !ctx.isBaseCaseLocked,
  },
  {
    text: 'How sensitive is total value to the value capture rate?',
    intent: 'SENSITIVITY',
    show: (ctx) => ctx.totalAnnualValueEurM !== null,
  },
  {
    text: 'What would change if I compressed delivery by 6 months?',
    intent: 'SENSITIVITY',
    show: (ctx) => ctx.totalAnnualValueEurM !== null && (ctx.compressionMonths ?? 0) < 6,
  },
  {
    text: 'What would improve Speed to Value in this scenario?',
    intent: 'VALUE_DRIVERS',
    show: (ctx) => ctx.selectedProgramCount >= 1 && (ctx.compressionMonths ?? 0) < 12,
  },
  {
    text: 'What KPIs are we measuring for EHR and what do they track?',
    intent: 'VALUE_DRIVERS',
    show: (ctx) => ctx.selectedProgramIds.includes('ehr-patient-care'),
  },
  {
    text: 'What is the standalone value of EHR and how was it calculated?',
    intent: 'CALCULATION',
    show: (ctx) =>
      ctx.selectedProgramIds.includes('ehr-patient-care') &&
      (ctx.standaloneValueByProgram?.['EHR'] ?? null) !== null,
  },
];

export function buildSuggestedPrompts(ctx: ThoughtPartnerContext): SuggestedPrompt[] {
  return PROMPT_SPECS.map((spec) => ({
    text: spec.text,
    intent: spec.intent,
    conditionMet: spec.show(ctx),
  }));
}
