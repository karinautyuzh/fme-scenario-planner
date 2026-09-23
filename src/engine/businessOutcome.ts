import { Scenario, emptyInput, accentureEstimate } from '../types';
import { CalculationResult } from './types';

function requires(label: string, description = ''): CalculationResult {
  return { value: null, status: 'REQUIRES_INPUT', requiredInputs: [label], calculationDescription: description };
}

function calculated(
  value: number,
  description: string,
  inputs: Record<string, string | number | null>,
  recurring = true
): CalculationResult {
  return { value, status: 'CALCULATED', requiredInputs: [], calculationDescription: description, inputs, isRecurring: recurring };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── B1: Incremental Treatment Volume ────────────────────────────────────────

export function calcIncrementalVolume(scenario: Scenario): CalculationResult {
  const vol = scenario.financialBaselines.annualTreatmentVolume;
  const uplift = scenario.businessOutcomes.patientVolumeUpliftPct;

  if (vol.value === null) return requires('Annual Treatment Volume (treatments/yr)');
  if ((uplift.value ?? 0) === 0) {
    return { value: 0, status: 'NOT_APPLICABLE', requiredInputs: [], calculationDescription: 'Volume uplift is set to zero' };
  }

  const inc = Math.round(vol.value * ((uplift.value ?? 0) / 100));
  return calculated(
    inc,
    `${vol.value.toLocaleString()} treatments/yr × ${uplift.value}% volume uplift`,
    { 'Annual Treatment Volume': `${vol.value.toLocaleString()} treatments/yr`, 'Volume Uplift Assumption': `${uplift.value}%`, 'Incremental Volume': `+${inc.toLocaleString()} treatments/yr` }
  );
}

// ─── B1: Volume Financial Value ───────────────────────────────────────────────

export function calcVolumeValue(scenario: Scenario): CalculationResult {
  const incVol = calcIncrementalVolume(scenario);
  if (incVol.status === 'REQUIRES_INPUT') {
    return { ...incVol, requiredInputs: [...incVol.requiredInputs, 'Value per Incremental Treatment (€)'] };
  }
  if (incVol.status === 'NOT_APPLICABLE' || incVol.value === 0) {
    return { value: 0, status: 'NOT_APPLICABLE', requiredInputs: [], calculationDescription: 'Volume uplift is zero — no incremental volume value' };
  }

  const valuePerTreatment = (scenario.financialBaselines as any).valuePerIncrementalTreatmentEur ?? emptyInput();
  const capture = scenario.businessOutcomes.overallValueCapturePct;

  if (valuePerTreatment.value === null) {
    return {
      value: null,
      status: 'REQUIRES_INPUT',
      requiredInputs: ['Value per Incremental Treatment (€)'],
      calculationDescription: `Incremental volume: +${incVol.value?.toLocaleString()} treatments/yr — needs value per treatment to monetize`,
    };
  }

  const capturePct = (capture.value ?? 100) / 100;
  const gross = (incVol.value! * valuePerTreatment.value) / 1_000_000;
  const net = round1(gross * capturePct);

  return calculated(
    net,
    `+${incVol.value?.toLocaleString()} treatments × €${valuePerTreatment.value.toLocaleString()} × ${capture.value ?? 100}% value capture ÷ 1,000,000`,
    {
      'Incremental Volume': `+${incVol.value?.toLocaleString()} treatments/yr`,
      'Value per Treatment': `€${valuePerTreatment.value.toLocaleString()}`,
      'Value Capture': `${capture.value ?? 100}%`,
      'Gross Annual Value': `€${round1(gross)}M/yr`,
      'Net (after value capture)': `€${net}M/yr`,
    }
  );
}

// ─── B2: Cost per Treatment Improvement ───────────────────────────────────────

export function calcCostBenefit(scenario: Scenario): CalculationResult {
  const vol = scenario.financialBaselines.annualTreatmentVolume;
  const cost = scenario.financialBaselines.costPerTreatmentEur;
  const improvement = scenario.businessOutcomes.costPerTreatmentImprovementPct;
  const capture = scenario.businessOutcomes.overallValueCapturePct;

  const missing: string[] = [];
  if (vol.value === null) missing.push('Annual Treatment Volume (treatments/yr)');
  if (cost.value === null) missing.push('Cost per Treatment (€)');
  if (missing.length > 0) return { value: null, status: 'REQUIRES_INPUT', requiredInputs: missing, calculationDescription: '' };

  if ((improvement.value ?? 0) === 0) {
    return { value: 0, status: 'NOT_APPLICABLE', requiredInputs: [], calculationDescription: 'Cost improvement is set to zero' };
  }

  const annualCostBase = (vol.value! * cost.value!) / 1_000_000;
  const capturePct = (capture.value ?? 100) / 100;
  const benefit = round1(annualCostBase * ((improvement.value ?? 0) / 100) * capturePct);

  return calculated(
    benefit,
    `€${round1(annualCostBase)}M cost base × ${improvement.value}% improvement × ${capture.value ?? 100}% value capture`,
    {
      'Annual Treatment Volume': `${vol.value!.toLocaleString()} treatments/yr`,
      'Cost per Treatment': `€${cost.value!.toLocaleString()}`,
      'Annual Cost Base': `€${round1(annualCostBase)}M/yr`,
      'Cost Improvement': `${improvement.value}%`,
      'Value Capture': `${capture.value ?? 100}%`,
    }
  );
}

// ─── B4: Supply Waste Reduction ───────────────────────────────────────────────

export function calcWasteBenefit(scenario: Scenario): CalculationResult {
  const supplyBase = (scenario.financialBaselines as any).supplyConsumableCostBaseEurM ?? emptyInput();
  const waste = scenario.businessOutcomes.supplyWasteReductionPct;
  const capture = scenario.businessOutcomes.overallValueCapturePct;

  if (supplyBase.value === null) {
    return requires('Annual Supply / Consumable Cost Base (€M)', 'Enter the annual supply and consumable cost base to calculate waste reduction benefit');
  }
  if ((waste.value ?? 0) === 0) {
    return { value: 0, status: 'NOT_APPLICABLE', requiredInputs: [], calculationDescription: 'Waste reduction is set to zero' };
  }

  const capturePct = (capture.value ?? 100) / 100;
  const benefit = round1(supplyBase.value * ((waste.value ?? 0) / 100) * capturePct);

  return calculated(
    benefit,
    `€${supplyBase.value}M supply base × ${waste.value}% waste reduction × ${capture.value ?? 100}% value capture`,
    {
      'Supply / Consumable Cost Base': `€${supplyBase.value}M/yr`,
      'Waste Reduction Assumption': `${waste.value}%`,
      'Value Capture': `${capture.value ?? 100}%`,
    }
  );
}

// ─── Total Annual Business Value ──────────────────────────────────────────────

export function calcTotalAnnualValue(scenario: Scenario): CalculationResult {
  const volumeVal = calcVolumeValue(scenario);
  const costBen = calcCostBenefit(scenario);
  const wasteBen = calcWasteBenefit(scenario);

  const components = [volumeVal, costBen, wasteBen];
  const calculated = components.filter((c) => c.status === 'CALCULATED' || c.status === 'NOT_APPLICABLE');
  const requiring = components.filter((c) => c.status === 'REQUIRES_INPUT');

  if (calculated.length === 0) {
    const allMissing = [...new Set(requiring.flatMap((c) => c.requiredInputs))];
    return { value: null, status: 'REQUIRES_INPUT', requiredInputs: allMissing, calculationDescription: 'No business outcome value components are calculable yet' };
  }

  const total = round1(
    components.reduce((sum, c) => sum + (c.status === 'CALCULATED' || c.status === 'NOT_APPLICABLE' ? (c.value ?? 0) : 0), 0)
  );
  const missingInputs = [...new Set(requiring.flatMap((c) => c.requiredInputs))];
  const status = requiring.length > 0 ? 'PARTIAL' : 'CALCULATED';

  return {
    value: total,
    status,
    requiredInputs: missingInputs,
    calculationDescription:
      requiring.length > 0
        ? `Partial total — ${calculated.length} of ${components.length} value components calculable. Add missing inputs to complete.`
        : 'Sum of volume value + cost benefit + supply waste benefit, each after value capture.',
    inputs: {
      'Volume Value': volumeVal.status === 'CALCULATED' ? `€${volumeVal.value}M/yr` : 'Not calculable',
      'Cost Benefit': costBen.status === 'CALCULATED' ? `€${costBen.value}M/yr` : 'Not calculable',
      'Waste Benefit': wasteBen.status === 'CALCULATED' ? `€${wasteBen.value}M/yr` : 'Not calculable',
    },
    isRecurring: true,
    warning: requiring.length > 0 ? `${requiring.length} component(s) not calculable — requires FME financial baseline inputs` : undefined,
  };
}
