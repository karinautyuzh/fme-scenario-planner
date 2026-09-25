import React, { useMemo, useState } from 'react';
import { useScenario } from '../state/ScenarioContext';
import { useEngineOutput } from '../engine/useEngine';
import { Scenario, ProgramLibraryEntry } from '../types';
import { ScenarioEngineOutput } from '../engine/types';
import { OUTCOMES } from '../data/outcomes';
import ValueCurveChart from '../components/value/ValueCurveChart';

// ─── Scorecard Dimensions ─────────────────────────────────────────────────────

interface ScorecardDimension {
  id: string;
  title: string;
  weight: number;
  score: number | null;
  status: 'calculated' | 'partial' | 'needs_input';
  why: string;
  whatMustBeTrue: string[];
  derivedFrom: string[];
}

function computeScorecard(
  scenario: Scenario,
  library: ProgramLibraryEntry[],
  engine: ScenarioEngineOutput
): ScorecardDimension[] {
  const sp = scenario.selectedPrograms;
  const selectedLib = library.filter((p) => sp.includes(p.id));
  const { sharedCosts, timing } = scenario;
  const compressionMonths = timing.compressionMonths.value ?? 0;
  const changeSharedPct = sharedCosts.changeManagement.sharedPct.value;
  const dataSharedPct = sharedCosts.dataIntegration.sharedPct.value;

  // ── 1. Business Outcome Alignment (25%) ──────────────────────────────────
  let businessOutcomeScore: number | null = null;
  let businessOutcomeStatus: ScorecardDimension['status'] = 'calculated';
  let businessOutcomeWhy = '';
  const boWhatMustBeTrue: string[] = [];
  let boDerivation: string[] = [];

  if (sp.length === 0) {
    businessOutcomeStatus = 'needs_input';
    businessOutcomeWhy = 'No programs selected. Select programs in Build Your Scenario.';
    boWhatMustBeTrue.push('At least one program must be included in the integrated design.');
    boDerivation = ['0 programs in scenario'];
  } else {
    const priorityValues: number[] = [];
    for (const p of selectedLib) {
      for (const oid of (p.outcomes as string[])) {
        const pv = p.outcomePriorities[oid as keyof typeof p.outcomePriorities] ?? 50;
        priorityValues.push(pv);
      }
    }
    const avgPriority = priorityValues.length > 0
      ? priorityValues.reduce((a, b) => a + b, 0) / priorityValues.length
      : 50;
    const outcomesSet = new Set<string>();
    selectedLib.forEach((p) => (p.outcomes as string[]).forEach((o) => outcomesSet.add(o)));
    const coveragePct = outcomesSet.size / 3;
    businessOutcomeScore = Math.round(avgPriority * 0.6 + coveragePct * 100 * 0.4);
    businessOutcomeWhy = `${sp.length} program${sp.length !== 1 ? 's' : ''} cover${sp.length === 1 ? 's' : ''} ${outcomesSet.size}/3 enterprise outcomes. Average outcome priority across active programs is ${Math.round(avgPriority)}/100.`;
    if (outcomesSet.size < 3) boWhatMustBeTrue.push('Ensure all three enterprise outcomes are covered by at least one program.');
    if (avgPriority < 60) boWhatMustBeTrue.push('Review and raise outcome priorities for programs where strategic alignment is higher than currently indicated.');
    boDerivation = [
      `${sp.length} program${sp.length !== 1 ? 's' : ''} in scenario`,
      `${outcomesSet.size}/3 enterprise outcomes covered`,
      `Average outcome priority: ${Math.round(avgPriority)}/100 (set in Program Intake)`,
      `Score = priority_avg (${Math.round(avgPriority)}) × 60% + coverage (${outcomesSet.size}/3) × 40% = ${businessOutcomeScore}`,
    ];
  }

  // ── 2. Shared Data & Integration (20%) ───────────────────────────────────
  let dataScore: number | null = null;
  let dataStatus: ScorecardDimension['status'] = 'calculated';
  let dataWhy = '';
  const dataWhatMustBeTrue: string[] = [];
  let dataDerivation: string[] = [];

  const programsWithSharedDataCount = selectedLib.filter((p) => p.sharedData).length;

  if (dataSharedPct === null) {
    dataStatus = 'needs_input';
    dataWhy = 'Data integration shared % not set. Enter in Pressure-Test → Scenario-Wide.';
    dataWhatMustBeTrue.push('Enter the data & integration shared cost percentage in Pressure-Test.');
    dataDerivation = [
      `Data integration sharing: not yet entered (Pressure-Test → Scenario-Wide)`,
      `${programsWithSharedDataCount}/${sp.length} selected programs have shared data flagged`,
    ];
  } else {
    const sharedDataBonus = sp.length > 0 ? (programsWithSharedDataCount / Math.max(1, sp.length)) * 30 : 0;
    dataScore = Math.round(dataSharedPct * 0.7 + sharedDataBonus);
    dataWhy = `${dataSharedPct}% of data integration cost is shared. ${programsWithSharedDataCount}/${sp.length} selected programs have shared data dependencies flagged.`;
    if (dataSharedPct < 30) dataWhatMustBeTrue.push('Increase data integration sharing by designing a common architecture across all programs from the start.');
    if (programsWithSharedDataCount < sp.length) dataWhatMustBeTrue.push('Review all selected programs for shared data dependencies in Program Intake.');
    dataDerivation = [
      `Data integration sharing: ${dataSharedPct}% (Pressure-Test → Scenario-Wide)`,
      `${programsWithSharedDataCount}/${sp.length} selected programs have shared data flagged (Program Intake)`,
      `Score = ${dataSharedPct}% × 70% + (${programsWithSharedDataCount}/${sp.length}) × 30 = ${dataScore}`,
    ];
  }

  // ── 3. Change & Workforce (20%) ──────────────────────────────────────────
  let changeScore: number | null = null;
  let changeStatus: ScorecardDimension['status'] = 'calculated';
  let changeWhy = '';
  const changeWhatMustBeTrue: string[] = [];
  let changeDerivation: string[] = [];

  const programsWithSharedWorkforceCount = selectedLib.filter((p) => p.sharedWorkforce || p.sharedChangePopulation).length;

  if (changeSharedPct === null) {
    changeStatus = 'needs_input';
    changeWhy = 'Change management shared % not set. Enter in Pressure-Test → Scenario-Wide.';
    changeWhatMustBeTrue.push('Enter the change management shared cost percentage in Pressure-Test.');
    changeDerivation = [
      'Change management sharing: not yet entered (Pressure-Test → Scenario-Wide)',
      `${programsWithSharedWorkforceCount}/${sp.length} programs share workforce or change population`,
    ];
  } else {
    const workforceBonus = sp.length > 0 ? (programsWithSharedWorkforceCount / Math.max(1, sp.length)) * 30 : 0;
    changeScore = Math.round(changeSharedPct * 0.7 + workforceBonus);
    changeWhy = `${changeSharedPct}% of change management cost is shared. ${programsWithSharedWorkforceCount}/${sp.length} selected programs share workforce or change population.`;
    if (changeSharedPct < 30) changeWhatMustBeTrue.push('Coordinate change management across programs to treat the workforce as one population rather than separate change waves.');
    if (programsWithSharedWorkforceCount < sp.length) changeWhatMustBeTrue.push('Flag shared workforce and change population dependencies in Program Intake for all relevant programs.');
    changeDerivation = [
      `Change management sharing: ${changeSharedPct}% (Pressure-Test → Scenario-Wide)`,
      `${programsWithSharedWorkforceCount}/${sp.length} programs share workforce or change population (Program Intake)`,
      `Score = ${changeSharedPct}% × 70% + (${programsWithSharedWorkforceCount}/${sp.length}) × 30 = ${changeScore}`,
    ];
  }

  // ── 4. Sequencing & Dependencies (10%) ───────────────────────────────────
  let seqScore: number | null = null;
  let seqWhy = '';
  const seqWhatMustBeTrue: string[] = [];
  let seqDerivation: string[] = [];

  const programsWithTimingDep = selectedLib.filter((p) => p.timingDependency).length;
  const programsWithDeps = selectedLib.filter((p) => p.dependencies.length > 0).length;

  if (sp.length <= 1) {
    seqScore = 30;
    seqWhy = `Only ${sp.length} program${sp.length === 1 ? '' : 's'} in scenario — sequencing dependency scoring requires multiple programs.`;
    seqWhatMustBeTrue.push('Add more programs to the integrated design to unlock sequencing value.');
    seqDerivation = ['Single-program scenario — sequencing score set to 30 as baseline'];
  } else {
    const timingScore = (programsWithTimingDep / Math.max(1, sp.length - 1)) * 50;
    const depScore = (programsWithDeps / Math.max(1, sp.length)) * 50;
    seqScore = Math.round(timingScore + depScore);
    seqWhy = `${programsWithTimingDep} programs have timing dependencies. ${programsWithDeps} programs have cross-program dependencies mapped.`;
    if (programsWithTimingDep === 0) seqWhatMustBeTrue.push('Review whether any programs have timing dependencies on others — flag them in Program Intake.');
    if (programsWithDeps === 0) seqWhatMustBeTrue.push('Map cross-program dependencies in Program Intake to enable sequencing optimization.');
    seqDerivation = [
      `${programsWithTimingDep}/${sp.length} programs with timing dependencies flagged (Program Intake)`,
      `${programsWithDeps}/${sp.length} programs with cross-program dependencies mapped (Program Intake)`,
      `Score = timing_dep_fraction × 50 + dep_fraction × 50 = ${seqScore}`,
    ];
  }

  // ── 5. Shared Delivery Cost (10%) ────────────────────────────────────────
  const costCats = [
    sharedCosts.governance,
    sharedCosts.changeManagement,
    sharedCosts.trainingRollout,
    sharedCosts.dataIntegration,
    sharedCosts.programResource,
  ];
  const enteredCats = costCats.filter((c) => c.costBaseEurM.value !== null).length;
  const costScore = Math.round((enteredCats / 5) * 100);
  const costStatus: ScorecardDimension['status'] = enteredCats === 0 ? 'needs_input' : enteredCats < 5 ? 'partial' : 'calculated';
  const costWhy = enteredCats === 0
    ? 'No shared cost bases entered yet. Enter cost data in Pressure-Test → Scenario-Wide.'
    : `${enteredCats}/5 cost categories entered. ${5 - enteredCats} cost base${5 - enteredCats !== 1 ? 's' : ''} still needed for a complete picture.`;
  const costWhatMustBeTrue: string[] = [];
  if (enteredCats < 5) costWhatMustBeTrue.push(`Enter the remaining ${5 - enteredCats} cost base${5 - enteredCats !== 1 ? 's' : ''} (${costCats.filter((c) => c.costBaseEurM.value === null).map((c) => c.label).join(', ')}) in Pressure-Test.`);
  const costDerivation = [
    `${enteredCats}/5 shared cost categories have base cost data entered (Pressure-Test → Scenario-Wide)`,
    enteredCats < 5
      ? `Missing: ${costCats.filter((c) => c.costBaseEurM.value === null).map((c) => c.label).join(', ')}`
      : 'All 5 categories entered — full shared cost picture available',
    `Score = ${enteredCats}/5 × 100 = ${costScore}`,
  ];

  // ── 6. Speed to Value (15%) ──────────────────────────────────────────────
  let speedScore: number | null = null;
  let speedStatus: ScorecardDimension['status'] = 'calculated';
  let speedWhy = '';
  const speedWhatMustBeTrue: string[] = [];
  let speedDerivation: string[] = [];

  if (compressionMonths === 0) {
    speedScore = 20;
    speedStatus = 'partial';
    speedWhy = 'No timeline compression set. A compression of 0 months means no speed-to-value advantage from integration.';
    speedWhatMustBeTrue.push('Set a compression value in Pressure-Test → Scenario-Wide to model the acceleration advantage.');
    speedDerivation = [
      'Compression: 0 months — no speed advantage modeled',
      'Score set to 20 (baseline floor for scenarios with no compression)',
    ];
  } else {
    speedScore = Math.min(100, Math.round((compressionMonths / 24) * 100));
    speedWhy = `${compressionMonths} months of timeline compression modeled. Integrated delivery completes ${compressionMonths} months earlier than separate delivery.`;
    if (compressionMonths < 6) speedWhatMustBeTrue.push('Consider whether additional integration decisions could compress the timeline further.');
    if (engine.valueAccelerated2030.status === 'REQUIRES_INPUT') speedWhatMustBeTrue.push('Enter financial baselines in Pressure-Test to calculate the monetary value of acceleration.');
    speedDerivation = [
      `${compressionMonths}-month delivery compression (Pressure-Test → Scenario-Wide)`,
      `Score = ${compressionMonths} months / 24 months × 100 = ${speedScore}`,
      engine.valueAccelerated2030.value !== null
        ? `Monetary acceleration: €${engine.valueAccelerated2030.value.toFixed(1)}M cumulative through 2030`
        : 'Monetary acceleration: enter financial baselines to compute',
    ];
  }

  return [
    {
      id: 'business-outcome',
      title: 'Business Outcome Alignment',
      weight: 25,
      score: businessOutcomeScore,
      status: businessOutcomeStatus,
      why: businessOutcomeWhy,
      whatMustBeTrue: boWhatMustBeTrue,
      derivedFrom: boDerivation,
    },
    {
      id: 'data-integration',
      title: 'Shared Data & Integration',
      weight: 20,
      score: dataScore,
      status: dataStatus,
      why: dataWhy,
      whatMustBeTrue: dataWhatMustBeTrue,
      derivedFrom: dataDerivation,
    },
    {
      id: 'change-workforce',
      title: 'Change & Workforce',
      weight: 20,
      score: changeScore,
      status: changeStatus,
      why: changeWhy,
      whatMustBeTrue: changeWhatMustBeTrue,
      derivedFrom: changeDerivation,
    },
    {
      id: 'speed-to-value',
      title: 'Speed to Value',
      weight: 15,
      score: speedScore,
      status: speedStatus,
      why: speedWhy,
      whatMustBeTrue: speedWhatMustBeTrue,
      derivedFrom: speedDerivation,
    },
    {
      id: 'sequencing',
      title: 'Sequencing & Dependencies',
      weight: 10,
      score: seqScore,
      status: 'calculated',
      why: seqWhy,
      whatMustBeTrue: seqWhatMustBeTrue,
      derivedFrom: seqDerivation,
    },
    {
      id: 'shared-cost',
      title: 'Shared Delivery Cost',
      weight: 10,
      score: costScore,
      status: costStatus,
      why: costWhy,
      whatMustBeTrue: costWhatMustBeTrue,
      derivedFrom: costDerivation,
    },
  ];
}

function computeWeightedScore(dims: ScorecardDimension[]): { score: number; isPartial: boolean } {
  let totalWeight = 0;
  let weightedSum = 0;
  let hasNull = false;

  for (const d of dims) {
    if (d.score !== null) {
      weightedSum += d.score * d.weight;
      totalWeight += d.weight;
    } else {
      hasNull = true;
    }
  }

  if (totalWeight === 0) return { score: 0, isPartial: true };
  return {
    score: Math.round(weightedSum / totalWeight),
    isPartial: hasNull,
  };
}

// ─── Synergy Uplift ───────────────────────────────────────────────────────────

interface SynergyResult {
  pct: number | null;
  type: 'financial' | 'modeled' | 'insufficient';
  label: string;
  explanation: string;
}

const SEPARATE_BASELINES: Record<string, number> = {
  'data-integration': 10,
  'change-workforce': 10,
  'sequencing': 5,
  'shared-cost': 0,
  'speed-to-value': 20,
};

function computeSynergyUplift(
  scenario: Scenario,
  engine: ScenarioEngineOutput,
  dims: ScorecardDimension[]
): SynergyResult {
  const sp = scenario.selectedPrograms;

  if (sp.length < 2) {
    return {
      pct: null,
      type: 'insufficient',
      label: 'Requires multiple programs',
      explanation: 'Synergy uplift requires at least two programs under integrated design.',
    };
  }

  const sharedCostVal = engine.totalSharedCostBenefit.value;
  const annualVal = engine.totalAnnualBusinessValue.value;
  const accelVal = engine.valueAccelerated2030.value;

  if (sharedCostVal !== null && annualVal !== null && annualVal > 0) {
    const annualizedAccel = accelVal !== null ? accelVal / 5 : 0;
    const integrationValue = sharedCostVal + annualizedAccel;
    const pct = Math.max(0, Math.round((integrationValue / annualVal) * 100));
    const accelPart = annualizedAccel > 0
      ? ` + €${annualizedAccel.toFixed(1)}M/yr accelerated value`
      : '';
    return {
      pct,
      type: 'financial',
      label: 'Financial Synergy Uplift',
      explanation: `€${sharedCostVal.toFixed(1)}M shared cost benefit${accelPart} relative to €${annualVal.toFixed(1)}M annual value baseline.`,
    };
  }

  const integrationDims = dims.filter((d) => d.id !== 'business-outcome');
  let integrationGain = 0;
  let maxPossibleGain = 0;

  for (const dim of integrationDims) {
    const baseline = SEPARATE_BASELINES[dim.id] ?? 0;
    const score = dim.score ?? baseline;
    integrationGain += Math.max(0, score - baseline) * dim.weight;
    maxPossibleGain += (100 - baseline) * dim.weight;
  }

  const synergFraction = maxPossibleGain > 0 ? integrationGain / maxPossibleGain : 0;
  const pct = Math.round(synergFraction * 20);

  return {
    pct,
    type: 'modeled',
    label: 'Modeled Synergy Score',
    explanation:
      'Derived from integration dimension scores. Enter shared cost data and financial baselines in Pressure-Test for a precise financial calculation.',
  };
}

// ─── Program Dimension Scoring ────────────────────────────────────────────────

interface ProgramDimension {
  id: string;
  label: string;
  score: number;
  weight: number;
}

interface ProgramScoreResult {
  dimensions: ProgramDimension[];
  overallScore: number;
  whatMustBeTrue: string[];
}

const PROGRAM_DIM_BASE_WEIGHTS: Record<string, number> = {
  'patient-volume': 25,
  'cost-efficiency': 25,
  'digital-enterprise': 20,
  'data-integration': 15,
  'change-workforce': 10,
  'speed-value': 5,
};

function computeProgramDimensions(
  program: ProgramLibraryEntry,
  scenario: Scenario,
  engine: ScenarioEngineOutput,
  selectedLib: ProgramLibraryEntry[]
): ProgramDimension[] {
  const prio = program.outcomePriorities;
  const dataSharedPct = scenario.sharedCosts.dataIntegration.sharedPct.value ?? 50;
  const changeSharedPct = scenario.sharedCosts.changeManagement.sharedPct.value ?? 50;
  const compressionMonths = scenario.timing.compressionMonths.value ?? 0;
  const startMonth = (scenario.timing.programStartMonths as Record<string, number>)[program.id]
    ?? (program.defaultTimeline?.startMonth ?? 0);

  const rawDims: ProgramDimension[] = [];

  if ((program.outcomes as string[]).includes('grow-patient-volume')) {
    const priorityScore = (prio['grow-patient-volume'] ?? 50) / 10;
    rawDims.push({ id: 'patient-volume', label: 'Patient / Volume Impact', score: Math.round(priorityScore * 10) / 10, weight: PROGRAM_DIM_BASE_WEIGHTS['patient-volume'] });
  }

  if ((program.outcomes as string[]).includes('reduce-cost-per-treatment')) {
    const priorityScore = (prio['reduce-cost-per-treatment'] ?? 50) / 10;
    const xlsVal = engine.standaloneValueByProgram[program.id];
    const xlsBonus = xlsVal?.value !== null && xlsVal?.value !== undefined ? Math.min(0.8, xlsVal.value / 25) : 0;
    rawDims.push({ id: 'cost-efficiency', label: 'Cost / Efficiency', score: Math.min(10, Math.round((priorityScore + xlsBonus) * 10) / 10), weight: PROGRAM_DIM_BASE_WEIGHTS['cost-efficiency'] });
  }

  if ((program.outcomes as string[]).includes('scalable-digital-enterprise')) {
    const priorityScore = (prio['scalable-digital-enterprise'] ?? 50) / 10;
    rawDims.push({ id: 'digital-enterprise', label: 'Digital / Enterprise', score: Math.round(priorityScore * 10) / 10, weight: PROGRAM_DIM_BASE_WEIGHTS['digital-enterprise'] });
  }

  if (program.sharedData || program.sharedTechnology) {
    const base = (program.sharedData ? 3 : 0) + (program.sharedTechnology ? 2 : 0);
    const dataBonus = Math.min(5, (dataSharedPct / 100) * 5);
    const peersWithSharedData = selectedLib.filter((p) => p.id !== program.id && (p.sharedData || p.sharedTechnology)).length;
    const peerBonus = Math.min(0, peersWithSharedData * 0); // reserved for future
    const score = Math.min(10, Math.round((base + dataBonus + peerBonus) * 10) / 10);
    rawDims.push({ id: 'data-integration', label: 'Data & Integration', score, weight: PROGRAM_DIM_BASE_WEIGHTS['data-integration'] });
  }

  if (program.sharedWorkforce || program.sharedChangePopulation) {
    const base = (program.sharedWorkforce ? 4 : 0) + (program.sharedChangePopulation ? 2 : 0);
    const changeBonus = Math.min(4, (changeSharedPct / 100) * 4);
    const score = Math.min(10, Math.round((base + changeBonus) * 10) / 10);
    rawDims.push({ id: 'change-workforce', label: 'Change & Workforce', score, weight: PROGRAM_DIM_BASE_WEIGHTS['change-workforce'] });
  }

  // Speed to Value — always shown
  const compressionBonus = Math.min(3, compressionMonths / 8);
  const timingBonus = program.timingDependency ? 0.8 : 0;
  const positionBonus = startMonth <= 2 ? 0.7 : 0;
  const speedScore = Math.min(10, Math.round((5 + compressionBonus + timingBonus + positionBonus) * 10) / 10);
  rawDims.push({ id: 'speed-value', label: 'Speed to Value', score: speedScore, weight: PROGRAM_DIM_BASE_WEIGHTS['speed-value'] });

  // Normalize weights to sum to 100
  const totalWeight = rawDims.reduce((sum, d) => sum + d.weight, 0);
  return rawDims.map((d) => ({ ...d, weight: Math.round((d.weight / totalWeight) * 100) }));
}

function computeProgramWhatMustBeTrue(
  program: ProgramLibraryEntry,
  scenario: Scenario,
  dims: ProgramDimension[]
): string[] {
  const conditions: string[] = [];
  const activeKpis = program.kpis.filter((k) => k.isActive);
  const kpisWithNoBaseline = activeKpis.filter((k) => !k.baseline || k.baseline === '');

  if (program.sharedData) {
    conditions.push('Shared data definitions and integration architecture must be established before either program reaches design-complete.');
  }

  if (program.sharedWorkforce || program.sharedChangePopulation) {
    conditions.push('Change management and training must treat overlapping staff populations as one cohort, not as separate program audiences.');
  }

  if (kpisWithNoBaseline.length > 0) {
    const names = kpisWithNoBaseline.slice(0, 3).map((k) => k.name).join(', ');
    conditions.push(`Baseline measurements must be established for ${kpisWithNoBaseline.length} active KPI${kpisWithNoBaseline.length !== 1 ? 's' : ''} before go-live: ${names}${kpisWithNoBaseline.length > 3 ? '…' : ''}.`);
  }

  if (program.timingDependency && program.dependencies.length > 0) {
    conditions.push(`Timing dependencies on upstream programs must be actively managed — delays in those programs directly affect ${program.shortName || program.name} value realization.`);
  }

  const inv = (scenario.programInvestmentsEurM as Record<string, { value: number | null }>)[program.id];
  if (!inv?.value) {
    conditions.push('Program investment budget must be confirmed to validate the synergy cost savings against total cost of transformation.');
  }

  return conditions.slice(0, 4);
}

function computeProgramScore(
  program: ProgramLibraryEntry,
  scenario: Scenario,
  engine: ScenarioEngineOutput,
  selectedLib: ProgramLibraryEntry[]
): ProgramScoreResult {
  const dims = computeProgramDimensions(program, scenario, engine, selectedLib);
  const overallScore = Math.round(
    dims.reduce((sum, d) => sum + (d.score * d.weight) / 100, 0) * 10
  ) / 10;
  const whatMustBeTrue = computeProgramWhatMustBeTrue(program, scenario, dims);
  return { dimensions: dims, overallScore, whatMustBeTrue };
}

// ─── Scenario-Level What Must Be True ────────────────────────────────────────

function computeScenarioWhatMustBeTrue(
  scenario: Scenario,
  selectedLib: ProgramLibraryEntry[],
  engine: ScenarioEngineOutput
): { number: string; condition: string }[] {
  const conditions: { number: string; condition: string }[] = [];

  const programsWithSharedData = selectedLib.filter((p) => p.sharedData);
  if (programsWithSharedData.length >= 2) {
    const names = programsWithSharedData.map((p) => p.shortName || p.name).join(', ');
    conditions.push({
      number: '01',
      condition: `A common data and integration architecture must be defined across ${names} before any program reaches design-complete. Divergent data models will eliminate the integration advantage.`,
    });
  }

  const programsWithSharedWorkforce = selectedLib.filter((p) => p.sharedWorkforce || p.sharedChangePopulation);
  if (programsWithSharedWorkforce.length >= 2) {
    const names = programsWithSharedWorkforce.map((p) => p.shortName || p.name).join(', ');
    conditions.push({
      number: String(conditions.length + 1).padStart(2, '0'),
      condition: `Change, training, and communications for ${names} must be designed as a single workforce experience — not ${programsWithSharedWorkforce.length} separate programs hitting the same people.`,
    });
  }

  const compressionMonths = scenario.timing.compressionMonths.value ?? 0;
  if (compressionMonths > 0) {
    conditions.push({
      number: String(conditions.length + 1).padStart(2, '0'),
      condition: `An integrated program timeline with explicit cross-program sequencing decisions must be maintained. The ${compressionMonths}-month compression assumed in this scenario requires active governance of inter-program dependencies.`,
    });
  }

  const fb = scenario.financialBaselines;
  const missingBaselines: string[] = [
    !fb.annualTreatmentVolume.value ? 'annual treatment volume' : '',
    !fb.revenueBaselineEurM.value ? 'revenue baseline' : '',
    !fb.costPerTreatmentEur.value ? 'cost per treatment' : '',
  ].filter(Boolean);

  if (missingBaselines.length > 0) {
    conditions.push({
      number: String(conditions.length + 1).padStart(2, '0'),
      condition: `FME-specific operational and financial baselines must be validated (${missingBaselines.join(', ')}) to convert this from an illustrative model to a defensible investment case.`,
    });
  }

  const programsWithDeps = selectedLib.filter((p) => p.dependencies.length > 0 || p.timingDependency);
  if (programsWithDeps.length > 0 && conditions.length < 6) {
    const names = programsWithDeps.map((p) => p.shortName || p.name).join(' and ');
    conditions.push({
      number: String(conditions.length + 1).padStart(2, '0'),
      condition: `Cross-program sequencing must be explicit — ${names} ${programsWithDeps.length === 1 ? 'has' : 'have'} timing or content dependencies on other programs in this scenario.`,
    });
  }

  const programsMissingInvestment = selectedLib.filter((p) => {
    const inv = (scenario.programInvestmentsEurM as Record<string, { value: number | null }>)[p.id];
    return !inv?.value;
  });
  if (programsMissingInvestment.length === selectedLib.length && selectedLib.length > 0 && conditions.length < 6) {
    conditions.push({
      number: String(conditions.length + 1).padStart(2, '0'),
      condition: 'Program investment budgets must be confirmed for all selected programs before synergy cost savings can be validated against the total cost of transformation.',
    });
  }

  return conditions.slice(0, 6);
}

// ─── Score Color Helpers ──────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return '#065F46';
  if (score >= 50) return 'var(--blue)';
  if (score >= 25) return '#92400E';
  return '#991B1B';
}

function scoreBg(score: number): string {
  if (score >= 75) return '#ECFDF5';
  if (score >= 50) return '#EBF4FF';
  if (score >= 25) return '#FFFBEB';
  return '#FEF2F2';
}

function programDimColor(score: number): string {
  if (score >= 7) return '#065F46';
  if (score >= 5) return 'var(--blue)';
  if (score >= 3) return '#D97706';
  return '#991B1B';
}

// ─── ScoreBar Component ───────────────────────────────────────────────────────

function ScoreBar({ score, max = 100, color }: { score: number; max?: number; color: string }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RealizeValue() {
  const { activeScenario, state } = useScenario();
  const engine = useEngineOutput(activeScenario);
  const sp = activeScenario.selectedPrograms;
  const library = state.programLibrary;
  const selectedLib = library.filter((p) => sp.includes(p.id));

  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const scorecard = useMemo(
    () => computeScorecard(activeScenario, library, engine),
    [activeScenario, library, engine]
  );

  const { score: overallScore, isPartial } = useMemo(
    () => computeWeightedScore(scorecard),
    [scorecard]
  );

  const synergy = useMemo(
    () => computeSynergyUplift(activeScenario, engine, scorecard),
    [activeScenario, engine, scorecard]
  );

  const programScores = useMemo(
    () =>
      selectedLib.reduce<Record<string, ProgramScoreResult>>((acc, prog) => {
        acc[prog.id] = computeProgramScore(prog, activeScenario, engine, selectedLib);
        return acc;
      }, {}),
    [selectedLib, activeScenario, engine]
  );

  const scenarioWMBT = useMemo(
    () => computeScenarioWhatMustBeTrue(activeScenario, selectedLib, engine),
    [activeScenario, selectedLib, engine]
  );

  const valueCurves = useMemo(
    () => [{ label: activeScenario.metadata.name, points: engine.valueCurve, colorIndex: 0 as const }],
    [activeScenario.metadata.name, engine.valueCurve]
  );

  const compressionMonths = activeScenario.timing.compressionMonths.value ?? 0;
  const sharedCostVal = engine.totalSharedCostBenefit.value;
  const annualVal = engine.totalAnnualBusinessValue.value;
  const standaloneTotal = engine.totalStandaloneValue;

  const drivingDims = useMemo(() => {
    return scorecard
      .filter((d) => d.id !== 'business-outcome' && d.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 4);
  }, [scorecard]);

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
          06 — Value Realization
        </div>
        <h1 style={{ fontFamily: 'Source Serif 4, serif', fontSize: 30, fontWeight: 600, color: 'var(--navy)', marginBottom: 12, lineHeight: 1.15 }}>
          Value Realization Scorecard
        </h1>
        <div style={{ display: 'inline-flex', background: 'var(--navy)', padding: '10px 18px', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Active Scenario:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{activeScenario.metadata.name}</span>
          {selectedLib.length > 0 && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                {selectedLib.map((p) => p.shortName || p.name).join(' + ')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Hero Synergy Uplift ── */}
      <div
        style={{
          background: synergy.type === 'insufficient' ? 'var(--grey-0)' : 'var(--navy)',
          padding: '36px 44px',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          {synergy.type === 'insufficient' ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 10 }}>
                Synergy Uplift
              </div>
              <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 22, fontWeight: 300, color: 'var(--grey-3)', lineHeight: 1.3 }}>
                Add more programs to model synergy.
              </div>
              <div style={{ fontSize: 12, color: 'var(--grey-2)', marginTop: 8 }}>
                Synergy uplift requires at least two programs under integrated design.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 10 }}>
                {synergy.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 64, fontWeight: 600, color: 'white', lineHeight: 1 }}>
                  +{synergy.pct}%
                </div>
                {synergy.type === 'modeled' && (
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8, alignSelf: 'flex-end' }}>
                    ILLUSTRATIVE — SCENARIO-DERIVED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10, lineHeight: 1.6, maxWidth: 480 }}>
                {synergy.explanation}
              </div>
            </>
          )}
        </div>

        {synergy.type !== 'insufficient' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Integration Score', value: `${overallScore}${isPartial ? '+' : ''}/100` },
              { label: 'Programs Modeled', value: `${sp.length}` },
              ...(standaloneTotal.value !== null ? [{ label: 'Standalone Value (XLS)', value: `€${standaloneTotal.value.toFixed(1)}M${standaloneTotal.status === 'PARTIAL' ? '+' : ''}` }] : []),
              ...(annualVal !== null ? [{ label: 'Scenario Annual Value', value: `€${annualVal.toFixed(1)}M` }] : []),
              ...(sharedCostVal !== null ? [{ label: 'Shared Cost Benefit', value: `€${sharedCostVal.toFixed(1)}M` }] : []),
              ...(compressionMonths > 0 ? [{ label: 'Timeline Compression', value: `${compressionMonths}mo` }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 22, fontWeight: 600, color: 'white', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── What Is Driving This Synergy ── */}
      {drivingDims.length > 0 && (
        <>
          <SectionLabel>What Is Driving This Synergy</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, marginBottom: 40 }}>
            {drivingDims.map((dim) => (
              <div
                key={dim.id}
                style={{
                  background: 'white',
                  borderTop: `3px solid ${dim.score !== null ? scoreColor(dim.score) : 'var(--grey-1)'}`,
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{dim.title}</div>
                  {dim.score !== null && (
                    <div
                      style={{
                        padding: '4px 10px',
                        background: scoreBg(dim.score),
                        color: scoreColor(dim.score),
                        fontSize: 14,
                        fontWeight: 700,
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      {dim.score}
                    </div>
                  )}
                </div>
                {dim.score !== null && (
                  <div style={{ marginBottom: 10 }}>
                    <ScoreBar score={dim.score} color={scoreColor(dim.score)} />
                  </div>
                )}
                <div style={{ fontSize: 9, color: 'var(--grey-2)', marginBottom: 8 }}>
                  Wt. {dim.weight}% · {dim.score !== null ? `+${Math.round(dim.score * dim.weight / 100)} pts` : '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.6, marginBottom: dim.whatMustBeTrue.length > 0 ? 10 : 0 }}>
                  {dim.why}
                </div>
                {dim.whatMustBeTrue.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--grey-1)', paddingTop: 8 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 4 }}>
                      What Must Be True
                    </div>
                    {dim.whatMustBeTrue.slice(0, 2).map((item, i) => (
                      <div key={i} style={{ fontSize: 10, color: 'var(--navy)', lineHeight: 1.55, marginBottom: 2 }}>
                        · {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Value by Dimension — How Each Score Was Calculated ── */}
      <SectionLabel>Value by Dimension — How Each Score Was Calculated</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 40 }}>
        {scorecard.map((dim) => {
          const isExpanded = expandedDim === dim.id;
          const contribution = dim.score !== null
            ? Math.round(dim.score * dim.weight / 100)
            : null;
          return (
            <div
              key={dim.id}
              style={{
                background: 'white',
                borderLeft: `4px solid ${dim.score !== null ? scoreColor(dim.score) : 'var(--grey-1)'}`,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 20, alignItems: 'start', padding: '20px 24px' }}>
                {/* Score tile */}
                <div style={{ textAlign: 'center', padding: '10px 12px', background: dim.score !== null ? scoreBg(dim.score) : 'var(--grey-0)', borderRadius: 6 }}>
                  {dim.score !== null ? (
                    <>
                      <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(dim.score), lineHeight: 1 }}>{dim.score}</div>
                      <div style={{ fontSize: 9, color: scoreColor(dim.score), opacity: 0.7, marginTop: 2 }}>/100</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: 'var(--grey-2)', lineHeight: 3.5 }}>—</div>
                  )}
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--grey-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                    Wt. {dim.weight}%
                  </div>
                  {contribution !== null && (
                    <div style={{ fontSize: 9, color: scoreColor(dim.score!), fontWeight: 700, marginTop: 2 }}>
                      +{contribution} pts
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', flex: 1 }}>{dim.title}</div>
                    {dim.status === 'needs_input' && (
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 2, flexShrink: 0 }}>
                        Needs Input
                      </span>
                    )}
                    {dim.status === 'partial' && (
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#EBF4FF', color: 'var(--blue)', padding: '2px 7px', borderRadius: 2, flexShrink: 0 }}>
                        Partial
                      </span>
                    )}
                  </div>

                  {/* Score bar */}
                  {dim.score !== null && (
                    <div style={{ marginBottom: 12 }}>
                      <ScoreBar score={dim.score} color={scoreColor(dim.score)} />
                    </div>
                  )}

                  {dim.whatMustBeTrue.length > 0 && (
                    <div style={{ padding: '8px 12px', background: '#F8FAFF', borderLeft: '2px solid var(--blue)', borderRadius: '0 4px 4px 0', marginBottom: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 4 }}>
                        What Must Be True
                      </div>
                      {dim.whatMustBeTrue.map((item, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--navy)', lineHeight: 1.55, marginBottom: 2 }}>
                          · {item}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedDim(isExpanded ? null : dim.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 11,
                      color: 'var(--blue)',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{isExpanded ? '−' : '+'}</span>
                    How was this calculated?
                  </button>
                </div>
              </div>

              {/* Expanded calculation detail */}
              {isExpanded && (
                <div style={{ padding: '0 24px 20px 128px', borderTop: '1px solid var(--grey-0)' }}>
                  <div style={{ paddingTop: 14, marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 8 }}>
                      Derived From
                    </div>
                    {dim.derivedFrom.map((item, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.6, display: 'flex', gap: 6 }}>
                        <span style={{ color: 'var(--blue)', flexShrink: 0 }}>·</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--grey-2)', fontWeight: 600 }}>Why this score:</strong> {dim.why}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Program Breakdown ── */}
      {selectedLib.length > 0 && (
        <>
          <SectionLabel>Program Breakdown</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 40 }}>
            {selectedLib.map((program) => {
              const ps = programScores[program.id];
              const activeKpis = program.kpis.filter((k) => k.isActive);
              const outcomeLabels = (program.outcomes as string[])
                .map((oid) => OUTCOMES.find((o) => o.id === oid))
                .filter(Boolean);
              const connections = selectedLib.filter((other) => {
                if (other.id === program.id) return false;
                return (
                  program.dependencies.includes(other.id) ||
                  other.dependencies.includes(program.id) ||
                  ((program.sharedData || program.sharedTechnology) && (other.sharedData || other.sharedTechnology)) ||
                  (program.sharedWorkforce && other.sharedWorkforce) ||
                  (program.sharedChangePopulation && other.sharedChangePopulation)
                );
              });
              const sv = engine.standaloneValueByProgram[program.id];
              const isExpanded = expandedProgram === program.id;

              return (
                <div key={program.id} style={{ background: 'white', borderLeft: '4px solid var(--blue)' }}>
                  {/* Collapsed header — always visible */}
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, padding: '20px 24px', alignItems: 'start', cursor: 'pointer' }}
                    onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{program.name}</div>
                        {program.shortName && program.shortName !== program.name && (
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--grey-2)' }}>
                            {program.shortName}
                          </span>
                        )}
                      </div>
                      {/* Outcomes */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {outcomeLabels.map((o) => o && (
                          <span key={o.id} style={{ fontSize: 10, fontWeight: 600, color: 'var(--teal)', background: '#E6F6F7', padding: '2px 7px', borderRadius: 3 }}>
                            {o.label}
                          </span>
                        ))}
                      </div>

                      {/* Program dimension scores */}
                      {ps && ps.dimensions.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 24px' }}>
                          {ps.dimensions.map((dim) => (
                            <div key={dim.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <div style={{ fontSize: 10, color: 'var(--grey-3)' }}>{dim.label}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: programDimColor(dim.score), marginLeft: 8 }}>{dim.score.toFixed(1)}</div>
                              </div>
                              <ScoreBar score={dim.score} max={10} color={programDimColor(dim.score)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: weighted program score + XLS value */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
                      {ps && (
                        <div style={{ marginBottom: sv?.value !== null ? 12 : 0 }}>
                          <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 28, fontWeight: 600, color: 'var(--navy)', lineHeight: 1 }}>
                            {ps.overallScore.toFixed(1)}
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', marginTop: 2 }}>
                            / 10 score
                          </div>
                        </div>
                      )}
                      {sv && sv.value !== null && (
                        <div style={{ padding: '8px 10px', background: '#E6F6F7', borderLeft: '3px solid var(--teal)' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 1 }}>
                            Standalone (XLS)
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                            €{sv.value.toFixed(1)}M/yr
                            {sv.status === 'PARTIAL' && <span style={{ fontSize: 9, fontWeight: 400, color: 'var(--grey-2)', marginLeft: 3 }}>PARTIAL</span>}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                        <span style={{ fontSize: 13 }}>{isExpanded ? '−' : '+'}</span>
                        {isExpanded ? 'Collapse' : 'Details'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded program detail */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--grey-0)', padding: '20px 24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                        {/* KPIs being measured */}
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 8 }}>
                            KPIs Being Measured ({activeKpis.length})
                          </div>
                          {activeKpis.length === 0 ? (
                            <div style={{ fontSize: 11, color: 'var(--grey-2)', fontStyle: 'italic' }}>No KPIs activated. Enable them in Program Intake.</div>
                          ) : (
                            activeKpis.map((kpi) => (
                              <div key={kpi.id} style={{ fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.5, padding: '3px 0', borderBottom: '1px solid var(--grey-0)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span>{kpi.name}</span>
                                {kpi.target !== null && kpi.unit && (
                                  <span style={{ color: 'var(--blue)', fontWeight: 600, flexShrink: 0 }}>→ {kpi.target}{kpi.unit}</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* What Must Be True + Connections */}
                        <div>
                          {ps && ps.whatMustBeTrue.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
                                What Must Be True
                              </div>
                              {ps.whatMustBeTrue.map((item, i) => (
                                <div key={i} style={{ fontSize: 11, color: 'var(--navy)', lineHeight: 1.6, marginBottom: 6, display: 'flex', gap: 6 }}>
                                  <span style={{ color: 'var(--blue)', flexShrink: 0 }}>·</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {connections.length > 0 && (
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 6 }}>
                                Key Synergy Connections
                              </div>
                              {connections.map((c) => (
                                <div key={c.id} style={{ fontSize: 11, color: 'var(--navy)', lineHeight: 1.55, marginBottom: 2 }}>
                                  ↔ {c.shortName || c.name}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Shared flags */}
                          {(program.sharedData || program.sharedTechnology || program.sharedWorkforce || program.sharedChangePopulation) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                              {program.sharedData && <Tag>Shared Data</Tag>}
                              {program.sharedTechnology && <Tag>Shared Tech</Tag>}
                              {program.sharedWorkforce && <Tag>Shared Workforce</Tag>}
                              {program.sharedChangePopulation && <Tag>Shared Change Pop.</Tag>}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── What Must Be True Across This Scenario ── */}
      {scenarioWMBT.length > 0 && (
        <>
          <SectionLabel>What Must Be True Across This Scenario</SectionLabel>
          <div style={{ background: 'white', padding: '28px 32px', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.6, marginBottom: 20 }}>
              These conditions are not assumptions — they are structural prerequisites for this scenario to deliver its modeled value. Each reflects a real decision or dependency embedded in the scenario design.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {scenarioWMBT.map((item) => (
                <div key={item.number} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 16, alignItems: 'start' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    background: 'var(--navy)',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    fontFamily: 'Source Serif 4, serif',
                    flexShrink: 0,
                  }}>
                    {item.number}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.7, paddingTop: 7 }}>
                    {item.condition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Value Curve ── */}
      {engine.hasEnoughForCurve && (
        <>
          <SectionLabel>Value Realization Curve — Integrated vs. Separate Delivery</SectionLabel>
          <div style={{ background: 'white', padding: '24px 28px', marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
                  Cumulative Value 2026–2035 · Scenario: {activeScenario.metadata.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--grey-3)' }}>
                  Solid = integrated delivery · Dashed = programs running separately
                </div>
              </div>
              {compressionMonths > 0 && engine.valueAccelerated2030.value !== null && (
                <div style={{ background: '#EBF4FF', border: '1px solid #BFDBFE', padding: '8px 14px', fontSize: 11, color: 'var(--navy)', lineHeight: 1.55, maxWidth: 300 }}>
                  Integrated delivery brings modeled value forward by <strong>{compressionMonths} months</strong>
                  {engine.valueAccelerated2030.value !== null && (
                    <>, creating <strong>€{engine.valueAccelerated2030.value.toFixed(1)}M</strong> of cumulative value advantage through 2030.</>
                  )}
                </div>
              )}
            </div>
            <ValueCurveChart curves={valueCurves} showSeparate />
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {sp.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--grey-3)', fontSize: 13, lineHeight: 1.7 }}>
          No programs selected in this scenario. Go to Build Your Scenario to select programs and see the value scorecard.
        </div>
      )}

    </div>
  );
}

// ─── Small Components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--grey-1)', display: 'block' }} />
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--grey-2)',
        background: 'var(--grey-0)',
        padding: '2px 6px',
        borderRadius: 3,
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </span>
  );
}
