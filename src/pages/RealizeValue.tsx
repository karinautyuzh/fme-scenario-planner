import React, { useMemo } from 'react';
import { useScenario } from '../state/ScenarioContext';
import { useEngineOutput } from '../engine/useEngine';
import { Scenario, ProgramLibraryEntry } from '../types';
import { ScenarioEngineOutput } from '../engine/types';
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
}

function computeScorecard(
  scenario: Scenario,
  library: ProgramLibraryEntry[],
  engine: ScenarioEngineOutput
): ScorecardDimension[] {
  const sp = scenario.selectedPrograms;
  const selectedLib = library.filter((p) => sp.includes(p.id));
  const { sharedCosts, timing, businessOutcomes } = scenario;
  const compressionMonths = timing.compressionMonths.value;
  const changeSharedPct = sharedCosts.changeManagement.sharedPct.value;
  const dataSharedPct = sharedCosts.dataIntegration.sharedPct.value;

  // ── 1. Business Outcome Alignment (25%) ──────────────────────────────────
  let businessOutcomeScore: number | null = null;
  let businessOutcomeStatus: ScorecardDimension['status'] = 'calculated';
  let businessOutcomeWhy = '';
  const boWhatMustBeTrue: string[] = [];

  if (sp.length === 0) {
    businessOutcomeStatus = 'needs_input';
    businessOutcomeWhy = 'No programs selected. Select programs in Build Your Scenario.';
    boWhatMustBeTrue.push('At least one program must be included in the integrated design.');
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

    // Coverage bonus: more outcomes covered → higher score
    const outcomesSet = new Set<string>();
    selectedLib.forEach((p) => (p.outcomes as string[]).forEach((o) => outcomesSet.add(o)));
    const coveragePct = outcomesSet.size / 3;

    businessOutcomeScore = Math.round((avgPriority * 0.6 + coveragePct * 100 * 0.4));
    businessOutcomeWhy = `Your ${sp.length} program${sp.length !== 1 ? 's' : ''} cover${sp.length === 1 ? 's' : ''} ${outcomesSet.size}/3 enterprise outcomes. Average outcome priority across active programs is ${Math.round(avgPriority)}/100.`;
    if (outcomesSet.size < 3) boWhatMustBeTrue.push('Ensure all three enterprise outcomes are covered by at least one program.');
    if (avgPriority < 60) boWhatMustBeTrue.push('Review and raise outcome priorities for programs where strategic alignment is higher than currently indicated.');
  }

  // ── 2. Shared Data & Integration (20%) ───────────────────────────────────
  let dataScore: number | null = null;
  let dataStatus: ScorecardDimension['status'] = 'calculated';
  let dataWhy = '';
  const dataWhatMustBeTrue: string[] = [];

  if (dataSharedPct === null) {
    dataStatus = 'needs_input';
    dataWhy = 'Data integration shared % not set. Enter in Pressure-Test → Scenario-Wide.';
    dataWhatMustBeTrue.push('Enter the data & integration shared cost percentage in Pressure-Test.');
  } else {
    const programsWithSharedData = selectedLib.filter((p) => p.sharedData).length;
    const sharedDataBonus = sp.length > 0 ? (programsWithSharedData / Math.max(1, sp.length)) * 30 : 0;
    dataScore = Math.round(dataSharedPct * 0.7 + sharedDataBonus);
    dataWhy = `${dataSharedPct}% of data integration cost is shared. ${programsWithSharedData}/${sp.length} selected programs have shared data dependencies flagged.`;
    if (dataSharedPct < 30) dataWhatMustBeTrue.push('Increase data integration sharing by designing a common architecture across all programs from the start.');
    if (programsWithSharedData < sp.length) dataWhatMustBeTrue.push('Review all selected programs for shared data dependencies in Program Intake.');
  }

  // ── 3. Change & Workforce (20%) ──────────────────────────────────────────
  let changeScore: number | null = null;
  let changeStatus: ScorecardDimension['status'] = 'calculated';
  let changeWhy = '';
  const changeWhatMustBeTrue: string[] = [];

  if (changeSharedPct === null) {
    changeStatus = 'needs_input';
    changeWhy = 'Change management shared % not set. Enter in Pressure-Test → Scenario-Wide.';
    changeWhatMustBeTrue.push('Enter the change management shared cost percentage in Pressure-Test.');
  } else {
    const programsWithSharedWorkforce = selectedLib.filter((p) => p.sharedWorkforce || p.sharedChangePopulation).length;
    const workforceBonus = sp.length > 0 ? (programsWithSharedWorkforce / Math.max(1, sp.length)) * 30 : 0;
    changeScore = Math.round(changeSharedPct * 0.7 + workforceBonus);
    changeWhy = `${changeSharedPct}% of change management cost is shared. ${programsWithSharedWorkforce}/${sp.length} selected programs share workforce or change population.`;
    if (changeSharedPct < 30) changeWhatMustBeTrue.push('Coordinate change management across programs to treat the workforce as one population rather than separate change waves.');
    if (programsWithSharedWorkforce < sp.length) changeWhatMustBeTrue.push('Flag shared workforce and change population dependencies in Program Intake for all relevant programs.');
  }

  // ── 4. Sequencing & Dependencies (10%) ───────────────────────────────────
  let seqScore: number | null = null;
  let seqWhy = '';
  const seqWhatMustBeTrue: string[] = [];

  if (sp.length <= 1) {
    seqScore = 30;
    seqWhy = `Only ${sp.length} program${sp.length === 1 ? '' : 's'} in scenario — sequencing dependency scoring requires multiple programs.`;
    seqWhatMustBeTrue.push('Add more programs to the integrated design to unlock sequencing value.');
  } else {
    const programsWithTimingDep = selectedLib.filter((p) => p.timingDependency).length;
    const programsWithDeps = selectedLib.filter((p) => p.dependencies.length > 0).length;
    const timingScore = (programsWithTimingDep / Math.max(1, sp.length - 1)) * 50;
    const depScore = (programsWithDeps / Math.max(1, sp.length)) * 50;
    seqScore = Math.round(timingScore + depScore);
    seqWhy = `${programsWithTimingDep} programs have timing dependencies. ${programsWithDeps} programs have cross-program dependencies mapped.`;
    if (programsWithTimingDep === 0) seqWhatMustBeTrue.push('Review whether any programs have timing dependencies on others — flag them in Program Intake.');
    if (programsWithDeps === 0) seqWhatMustBeTrue.push('Map cross-program dependencies in Program Intake to enable sequencing optimization.');
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

  // ── 6. Speed to Value (15%) ──────────────────────────────────────────────
  let speedScore: number | null = null;
  let speedStatus: ScorecardDimension['status'] = 'calculated';
  let speedWhy = '';
  const speedWhatMustBeTrue: string[] = [];

  if (compressionMonths === null || compressionMonths === 0) {
    speedScore = 20;
    speedStatus = 'partial';
    speedWhy = 'No timeline compression set. A compression of 0 months means no speed-to-value advantage from integration.';
    speedWhatMustBeTrue.push('Set a compression value in Pressure-Test → Scenario-Wide to model the acceleration advantage.');
  } else {
    speedScore = Math.min(100, Math.round((compressionMonths / 24) * 100));
    speedWhy = `${compressionMonths} months of timeline compression modeled. Integrated delivery completes ${compressionMonths} months earlier than separate delivery.`;
    if (compressionMonths < 6) speedWhatMustBeTrue.push('Consider whether additional integration decisions could compress the timeline further.');
    if (engine.valueAccelerated2030.status === 'REQUIRES_INPUT') speedWhatMustBeTrue.push('Enter financial baselines in Pressure-Test to calculate the monetary value of acceleration.');
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
    },
    {
      id: 'data-integration',
      title: 'Shared Data & Integration',
      weight: 20,
      score: dataScore,
      status: dataStatus,
      why: dataWhy,
      whatMustBeTrue: dataWhatMustBeTrue,
    },
    {
      id: 'change-workforce',
      title: 'Change & Workforce',
      weight: 20,
      score: changeScore,
      status: changeStatus,
      why: changeWhy,
      whatMustBeTrue: changeWhatMustBeTrue,
    },
    {
      id: 'speed-to-value',
      title: 'Speed to Value',
      weight: 15,
      score: speedScore,
      status: speedStatus,
      why: speedWhy,
      whatMustBeTrue: speedWhatMustBeTrue,
    },
    {
      id: 'sequencing',
      title: 'Sequencing & Dependencies',
      weight: 10,
      score: seqScore,
      status: 'calculated',
      why: seqWhy,
      whatMustBeTrue: seqWhatMustBeTrue,
    },
    {
      id: 'shared-cost',
      title: 'Shared Delivery Cost',
      weight: 10,
      score: costScore,
      status: costStatus,
      why: costWhy,
      whatMustBeTrue: costWhatMustBeTrue,
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

// ─── BEO Capabilities ─────────────────────────────────────────────────────────

interface BeoCapability {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  criticalReason: string | null;
}

function buildBeoCapabilities(scenario: Scenario, engine: ScenarioEngineOutput): BeoCapability[] {
  const sp = scenario.selectedPrograms;
  const compression = scenario.timing.compressionMonths.value ?? 0;
  const changeSharedPct = scenario.sharedCosts.changeManagement.sharedPct.value ?? 0;
  const dataSharedPct = scenario.sharedCosts.dataIntegration.sharedPct.value ?? 0;
  const volumeUplift = scenario.businessOutcomes.patientVolumeUpliftPct.value ?? 0;

  return [
    {
      id: 'enterprise-case',
      title: 'One Enterprise Business Case',
      description: "Value managed across all selected programs against enterprise outcomes rather than isolated per-program business cases. Each program's contribution is tracked to the same set of enterprise KPIs.",
      critical: true,
      criticalReason: `Your scenario targets enterprise-level outcomes across ${sp.length} program${sp.length !== 1 ? 's' : ''} — a single enterprise business case prevents each program team from optimizing locally at the expense of the combined result.`,
    },
    {
      id: 'sequencing',
      title: 'One Sequencing Engine',
      description: 'Dependencies, design decisions, and delivery timing managed across the integrated transformation. Enables cross-program trade-offs to be resolved without disrupting individual program delivery.',
      critical: compression >= 6,
      criticalReason: compression >= 6 ? `Your scenario assumes ${compression} months of delivery compression — this level of acceleration requires integrated sequencing to coordinate cross-program dependencies and avoid rework.` : null,
    },
    {
      id: 'change',
      title: 'One Change Agenda',
      description: 'The same workforce experiences coordinated transformation rather than overlapping, program-by-program change waves. Avoids change fatigue and enables shared communication, training, and adoption resources.',
      critical: changeSharedPct >= 35,
      criticalReason: changeSharedPct >= 35 ? `Your scenario assumes ${changeSharedPct}% of change management cost is shared — this requires a coordinated change agenda that treats the workforce as one population across programs.` : null,
    },
    {
      id: 'data',
      title: 'One Data & Integration Architecture',
      description: 'Shared data, integration, and technology decisions made once with visibility across all programs. Eliminates duplicate integration work and creates a reusable foundation for future digital capability.',
      critical: dataSharedPct >= 30,
      criticalReason: dataSharedPct >= 30 ? `Your scenario assumes ${dataSharedPct}% of data integration cost is shared — this only holds if integration architecture is designed once across programs.` : null,
    },
    {
      id: 'value-cadence',
      title: 'One Value-Realization Cadence',
      description: "Business KPI uplift, shared-cost benefit, and value acceleration tracked against your scenario assumptions on a common cadence. Connects operational metrics to the financial model.",
      critical: volumeUplift >= 3 || engine.totalAnnualBusinessValue.value !== null,
      criticalReason: volumeUplift >= 3 ? `Your scenario assumes +${volumeUplift}% patient volume — the Value-Realization Cadence tracks whether workflow adoption is actually creating the expected patient-access improvement.` : engine.totalAnnualBusinessValue.value !== null ? 'With a modeled annual value in place, a structured realization cadence is needed to confirm assumptions are translating into actual outcomes.' : null,
    },
  ];
}

// ─── Score Color ──────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function RealizeValue() {
  const { activeScenario, state } = useScenario();
  const engine = useEngineOutput(activeScenario);
  const sp = activeScenario.selectedPrograms;
  const library = state.programLibrary;

  const selectedProgramNames = useMemo(
    () => library.filter((p) => sp.includes(p.id)).map((p) => p.shortName || p.name),
    [sp, library]
  );

  const scorecard = useMemo(
    () => computeScorecard(activeScenario, library, engine),
    [activeScenario, library, engine]
  );

  const { score: overallScore, isPartial } = useMemo(
    () => computeWeightedScore(scorecard),
    [scorecard]
  );

  const beoCapabilities = useMemo(
    () => buildBeoCapabilities(activeScenario, engine),
    [activeScenario, engine]
  );

  const valueCurves = useMemo(
    () => [{ label: activeScenario.metadata.name, points: engine.valueCurve, colorIndex: 0 as const }],
    [activeScenario.metadata.name, engine.valueCurve]
  );

  const compressionMonths = activeScenario.timing.compressionMonths.value ?? 0;

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
          06 — Value Realization
        </div>
        <h1 style={{ fontFamily: 'Source Serif 4, serif', fontSize: 30, fontWeight: 600, color: 'var(--navy)', marginBottom: 12, lineHeight: 1.15 }}>
          Value Realization Scorecard
        </h1>
        <div style={{ background: 'var(--navy)', display: 'inline-flex', padding: '10px 18px', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Active Scenario:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{activeScenario.metadata.name}</span>
          {selectedProgramNames.length > 0 && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Integrating: {selectedProgramNames.join(' + ')}</span>
            </>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--grey-3)', lineHeight: 1.65, maxWidth: 640, marginTop: 12 }}>
          How well does your scenario configuration position FME to capture the modeled value? Scores derive from your actual inputs — not estimates. Add more inputs to improve score accuracy.
        </p>
      </div>

      {/* ── Overall Score ── */}
      <div style={{ background: 'var(--navy)', padding: '28px 36px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
            Overall Readiness Score {isPartial ? '· PARTIAL' : ''}
          </div>
          <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 52, fontWeight: 600, color: 'white', lineHeight: 1 }}>
            {overallScore}
            <span style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,0.55)', marginLeft: 4 }}>/100</span>
          </div>
          {isPartial && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.5 }}>
              Some dimensions need more inputs. Complete them in Pressure-Test for a full score.
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {scorecard.map((d) => (
            <div key={d.id} style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: d.score !== null ? 'white' : 'rgba(255,255,255,0.3)' }}>
                {d.score !== null ? d.score : '—'}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4 }}>
                {d.title.split(' ').slice(0, 2).join('\n')}
              </div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{d.weight}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dimension Cards ── */}
      <SectionLabel>Six Dimensions of Value Readiness</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 40 }}>
        {scorecard.map((dim) => (
          <div
            key={dim.id}
            style={{
              background: 'white',
              borderLeft: `4px solid ${dim.score !== null ? scoreColor(dim.score) : 'var(--grey-1)'}`,
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 20, alignItems: 'start' }}>
              {/* Score */}
              <div style={{ textAlign: 'center', padding: '10px 12px', background: dim.score !== null ? scoreBg(dim.score) : 'var(--grey-0)', borderRadius: 6 }}>
                {dim.score !== null ? (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(dim.score), lineHeight: 1 }}>{dim.score}</div>
                    <div style={{ fontSize: 9, color: scoreColor(dim.score), opacity: 0.7, marginTop: 2 }}>/100</div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--grey-2)' }}>—</div>
                )}
                <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--grey-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                  Wt. {dim.weight}%
                </div>
              </div>

              {/* Content */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{dim.title}</div>
                  {dim.status === 'needs_input' && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 2 }}>
                      Needs Input
                    </span>
                  )}
                  {dim.status === 'partial' && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#EBF4FF', color: 'var(--blue)', padding: '2px 7px', borderRadius: 2 }}>
                      Partial
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.6, marginBottom: 10 }}>
                  <strong style={{ color: 'var(--grey-2)', fontWeight: 600 }}>Why this score:</strong> {dim.why}
                </div>
                {dim.whatMustBeTrue.length > 0 && (
                  <div style={{ padding: '10px 14px', background: '#F8FAFF', borderLeft: '2px solid var(--blue)', borderRadius: '0 4px 4px 0' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 6 }}>
                      What Must Be True
                    </div>
                    {dim.whatMustBeTrue.map((item, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'var(--navy)', lineHeight: 1.6, marginBottom: 3 }}>
                        · {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weight bar */}
              <div style={{ width: 6, alignSelf: 'stretch', background: 'var(--grey-0)', borderRadius: 99, position: 'relative' }}>
                {dim.score !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${dim.score}%`,
                      background: scoreColor(dim.score),
                      borderRadius: 99,
                      transition: 'height 0.5s ease',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Value Curve ── */}
      {engine.hasEnoughForCurve && (
        <>
          <SectionLabel>Value Realization Curve — Integrated vs. Separate Delivery</SectionLabel>
          <div style={{ background: 'white', padding: '24px 28px', marginBottom: 32 }}>
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

      {/* ── Business Execution Office ── */}
      <SectionLabel>The Business Execution Office</SectionLabel>
      <div style={{ background: 'var(--navy)', padding: '28px 32px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 10 }}>
          The execution mechanism behind your scenario
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 680 }}>
          The Business Execution Office is not a PMO, a reporting layer, or another governance overhead. It is the connective model that makes integrated delivery possible — and ensures that the economic advantage you have modeled actually flows to the enterprise.
        </p>
      </div>

      {/* BEO Capabilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 40 }}>
        {beoCapabilities.map((cap) => (
          <div
            key={cap.id}
            style={{
              background: 'white',
              borderLeft: `3px solid ${cap.critical ? 'var(--teal)' : 'var(--grey-1)'}`,
              padding: '20px 24px',
              display: 'grid',
              gridTemplateColumns: cap.critical && cap.criticalReason ? '1fr auto' : '1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{cap.title}</div>
                {cap.critical && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,153,168,0.12)', color: 'var(--teal)', padding: '2px 7px', borderRadius: 2 }}>
                    Critical for this scenario
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.65, maxWidth: 520 }}>{cap.description}</div>
            </div>
            {cap.critical && cap.criticalReason && (
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderLeft: '3px solid var(--teal)', padding: '12px 16px', fontSize: 12, color: 'var(--navy)', lineHeight: 1.6, maxWidth: 340, flexShrink: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 5 }}>
                  Why it matters here
                </div>
                {cap.criticalReason}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Closing Statement ── */}
      <div style={{ background: 'var(--navy)', padding: '36px 48px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 300, color: 'white', lineHeight: 1.45, letterSpacing: '0.01em' }}>
          One transformation.{' '}
          <strong style={{ fontWeight: 600 }}>Multiple programs.</strong>
          <br />
          One accountable path to value.
        </div>
      </div>

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--grey-1)', display: 'block' }} />
    </div>
  );
}
