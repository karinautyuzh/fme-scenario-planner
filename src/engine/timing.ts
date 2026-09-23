import { Scenario, emptyInput, accentureEstimate } from '../types';
import { PROGRAMS } from '../data/programs';
import { CalculationResult, ValueCurvePoint } from './types';

// ─── Month helpers ────────────────────────────────────────────────────────────

export function monthToLabel(month: number): string {
  const year = 2026 + Math.floor(month / 12);
  const m = month % 12;
  return m < 6 ? `H1 ${year}` : `H2 ${year}`;
}

// Speed factor for ramp: slower = 1.5×, expected = 1.0×, faster = 0.65×
function speedFactor(speed: string | null): number {
  if (speed === 'faster') return 0.65;
  if (speed === 'slower') return 1.5;
  return 1.0;
}

// ─── Value start timing ───────────────────────────────────────────────────────

export function calcSeparateValueStartMonth(scenario: Scenario): number {
  const selected = scenario.selectedPrograms;
  if (selected.length === 0) return 24; // fallback

  let maxEnd = 0;
  for (const pid of selected) {
    const prog = PROGRAMS.find((p) => p.id === pid);
    if (!prog) continue;
    const startMonth = scenario.timing.programStartMonths?.[pid] ?? prog.defaultTimeline.startMonth;
    const end = startMonth + prog.defaultTimeline.durationMonths;
    if (end > maxEnd) maxEnd = end;
  }
  return maxEnd;
}

export function calcIntegratedValueStartMonth(scenario: Scenario): number {
  const sep = calcSeparateValueStartMonth(scenario);
  const compression = scenario.timing.compressionMonths.value ?? 0;
  return Math.max(0, sep - compression);
}

// ─── Value curve ──────────────────────────────────────────────────────────────

function cumulativeValueEurM(
  totalMonthsElapsed: number,
  valueStartMonth: number,
  rampMonths: number,
  annualRunRateEurM: number
): number {
  const relMonths = totalMonthsElapsed - valueStartMonth;
  if (relMonths <= 0) return 0;

  const monthly = annualRunRateEurM / 12;

  if (relMonths <= rampMonths) {
    // Triangle area under the ramp
    const fraction = relMonths / rampMonths;
    return 0.5 * fraction * relMonths * monthly;
  } else {
    // Full ramp triangle + subsequent full-value period
    const rampCum = 0.5 * rampMonths * monthly;
    const fullCum = (relMonths - rampMonths) * monthly;
    return rampCum + fullCum;
  }
}

export function buildValueCurve(
  annualRunRateEurM: number,
  separateStartMonth: number,
  integratedStartMonth: number,
  rampMonths: number
): ValueCurvePoint[] {
  const points: ValueCurvePoint[] = [];
  for (let year = 2026; year <= 2035; year++) {
    const totalMonths = (year - 2026) * 12;
    points.push({
      year,
      separateCumulative: Math.round(cumulativeValueEurM(totalMonths, separateStartMonth, rampMonths, annualRunRateEurM) * 10) / 10,
      integratedCumulative: Math.round(cumulativeValueEurM(totalMonths, integratedStartMonth, rampMonths, annualRunRateEurM) * 10) / 10,
    });
  }
  return points;
}

// ─── Value Acceleration ───────────────────────────────────────────────────────

export function calcValueAcceleration(
  annualRunRateEurM: number | null,
  valueCurve: ValueCurvePoint[],
  targetYear: number
): CalculationResult {
  if (annualRunRateEurM === null) {
    return {
      value: null,
      status: 'REQUIRES_INPUT',
      requiredInputs: ['Annual run-rate business value (needs financial baselines)'],
      calculationDescription: 'Value acceleration = cumulative integrated value − cumulative separate value by target year',
    };
  }

  const point = valueCurve.find((p) => p.year === targetYear);
  if (!point || point.integratedCumulative === null || point.separateCumulative === null) {
    return { value: null, status: 'REQUIRES_INPUT', requiredInputs: [], calculationDescription: '' };
  }

  const advantage = Math.round((point.integratedCumulative - point.separateCumulative) * 10) / 10;

  if (advantage <= 0) {
    return {
      value: 0,
      status: 'NOT_APPLICABLE',
      requiredInputs: [],
      calculationDescription: 'No timeline compression — integrated and separate delivery curves are identical',
    };
  }

  return {
    value: advantage,
    status: 'CALCULATED',
    requiredInputs: [],
    calculationDescription: `Integrated delivery receives €${point.integratedCumulative}M by ${targetYear} vs. €${point.separateCumulative}M under separate delivery — a €${advantage}M acceleration advantage`,
    inputs: {
      [`Separate cumulative by ${targetYear}`]: `€${point.separateCumulative}M`,
      [`Integrated cumulative by ${targetYear}`]: `€${point.integratedCumulative}M`,
      'Advantage': `€${advantage}M`,
    },
    isRecurring: false,
  };
}

export function getRampMonths(scenario: Scenario): number {
  const ramp = (scenario.timing as any).rampToFullValueMonths ?? accentureEstimate(24);
  const speed = scenario.timing.valueRealizationSpeed.value;
  return Math.round((ramp.value ?? 24) * speedFactor(speed));
}
