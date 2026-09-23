import { Scenario } from '../types';
import { calcTotalSharedBenefit } from '../types';
import { ScenarioEngineOutput } from './types';
import {
  calcIncrementalVolume,
  calcVolumeValue,
  calcCostBenefit,
  calcWasteBenefit,
  calcTotalAnnualValue,
} from './businessOutcome';
import {
  calcSeparateValueStartMonth,
  calcIntegratedValueStartMonth,
  buildValueCurve,
  calcValueAcceleration,
  getRampMonths,
  monthToLabel,
} from './timing';

export function computeScenarioOutput(scenario: Scenario): ScenarioEngineOutput {
  // Business outcomes
  const incrementalTreatmentVolume = calcIncrementalVolume(scenario);
  const potentialAnnualVolumeValue = calcVolumeValue(scenario);
  const potentialAnnualCostBenefit = calcCostBenefit(scenario);
  const potentialAnnualWasteBenefit = calcWasteBenefit(scenario);
  const totalAnnualBusinessValue = calcTotalAnnualValue(scenario);

  // Shared cost
  const { total: sharedTotal, missingCount } = calcTotalSharedBenefit(scenario.sharedCosts);
  const sharedCostCoverage = { calculated: 5 - missingCount, total: 5 };
  const totalSharedCostBenefit = sharedTotal !== null
    ? {
        value: Math.round(sharedTotal * 10) / 10,
        status: (missingCount > 0 ? 'PARTIAL' : 'CALCULATED') as import('./types').CalculationStatus,
        requiredInputs: missingCount > 0 ? [`${missingCount} cost base(s) not entered`] : [],
        calculationDescription: `Sum of shared savings across ${5 - missingCount} of 5 categories where cost base is known`,
        isRecurring: false,
      }
    : {
        value: null,
        status: 'REQUIRES_INPUT' as import('./types').CalculationStatus,
        requiredInputs: ['At least one Shared Cost category base (€M)'],
        calculationDescription: 'Enter cost bases in the Shared Transformation Cost section to calculate savings from integration',
      };

  // Timing
  const separateValueStartMonth = calcSeparateValueStartMonth(scenario);
  const integratedValueStartMonth = calcIntegratedValueStartMonth(scenario);
  const rampMonths = getRampMonths(scenario);

  // Value curve (requires an annual run-rate value)
  const annualRunRate = totalAnnualBusinessValue.value;
  const hasEnoughForCurve = annualRunRate !== null && annualRunRate > 0;

  const valueCurve = hasEnoughForCurve
    ? buildValueCurve(annualRunRate!, separateValueStartMonth, integratedValueStartMonth, rampMonths)
    : Array.from({ length: 10 }, (_, i) => ({
        year: 2026 + i,
        separateCumulative: null,
        integratedCumulative: null,
      }));

  // Value acceleration
  const valueAccelerated2030 = calcValueAcceleration(annualRunRate, valueCurve, 2030);
  const valueAccelerated2035 = calcValueAcceleration(annualRunRate, valueCurve, 2035);

  // Missing financial inputs summary
  const missingFinancialInputs = [
    ...new Set([
      ...potentialAnnualVolumeValue.requiredInputs,
      ...potentialAnnualCostBenefit.requiredInputs,
      ...potentialAnnualWasteBenefit.requiredInputs,
    ]),
  ];

  return {
    incrementalTreatmentVolume,
    potentialAnnualVolumeValue,
    potentialAnnualCostBenefit,
    potentialAnnualWasteBenefit,
    totalAnnualBusinessValue,
    totalSharedCostBenefit,
    sharedCostCoverage,
    separateValueStartMonth,
    integratedValueStartMonth,
    separateValueStartLabel: monthToLabel(separateValueStartMonth),
    integratedValueStartLabel: monthToLabel(integratedValueStartMonth),
    valueCurve,
    valueAccelerated2030,
    valueAccelerated2035,
    hasEnoughForCurve,
    missingFinancialInputs,
  };
}
