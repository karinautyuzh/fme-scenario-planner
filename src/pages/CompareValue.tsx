import React, { useState, useMemo } from 'react';
import { useScenario } from '../state/ScenarioContext';
import { Scenario } from '../types';
import { computeScenarioOutput } from '../engine/scenario';
import { ScenarioEngineOutput, CalculationResult } from '../engine/types';
import ValueCurveChart from '../components/value/ValueCurveChart';
import CalcDrawer from '../components/ui/CalcDrawer';

const SCENARIO_COLORS = ['#0066B3', '#0099A8', '#7C3AED'];

// ─── Scenario Selector ────────────────────────────────────────────────────────

function ScenarioPicker({
  scenarios,
  selected,
  onToggle,
}: {
  scenarios: Scenario[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
      {scenarios.map((s) => {
        const isSelected = selected.includes(s.metadata.id);
        const idx = selected.indexOf(s.metadata.id);
        const color = isSelected ? SCENARIO_COLORS[idx] : undefined;
        const canAdd = !isSelected && selected.length < 3;
        return (
          <button
            key={s.metadata.id}
            onClick={() => (isSelected || canAdd) ? onToggle(s.metadata.id) : undefined}
            style={{
              border: `2px solid ${isSelected ? color : 'var(--grey-1)'}`,
              background: isSelected ? `${color}14` : 'white',
              padding: '8px 14px',
              cursor: isSelected || canAdd ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'Inter, sans-serif',
              opacity: !isSelected && !canAdd ? 0.45 : 1,
              transition: 'all 0.15s',
            }}
          >
            {isSelected && (
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            {s.isBaseCaseLocked && (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ opacity: 0.6 }}>
                <rect x="1" y="5" width="8" height="7" rx="1" fill={isSelected ? color : 'var(--grey-2)'} />
                <path d="M3 5V3.5C3 2.12 3.9 1 5 1C6.1 1 7 2.12 7 3.5V5" stroke={isSelected ? color : 'var(--grey-2)'} strokeWidth="1.5" fill="none" />
              </svg>
            )}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: isSelected ? color : 'var(--grey-3)' }}>
              {s.metadata.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--grey-2)' }}>
              {s.selectedPrograms.length}p
            </span>
          </button>
        );
      })}
      {scenarios.length < 3 && (
        <div style={{ fontSize: 11, color: 'var(--grey-2)', alignSelf: 'center', fontStyle: 'italic' }}>
          Add scenarios in the Pressure-Test page
        </div>
      )}
    </div>
  );
}

// ─── Per-Scenario Summary Card ────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  engine,
  color,
  index,
}: {
  scenario: Scenario;
  engine: ScenarioEngineOutput;
  color: string;
  index: number;
}) {
  return (
    <div
      style={{
        background: 'white',
        borderTop: `3px solid ${color}`,
        padding: '20px 22px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: 4 }}>
        Scenario {index + 1}
        {scenario.isBaseCaseLocked && ' · Base Case'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 2 }}>
        {scenario.metadata.name}
      </div>
      <div style={{ fontSize: 11, color: 'var(--grey-2)', marginBottom: 14 }}>
        {scenario.selectedPrograms.length} program{scenario.selectedPrograms.length !== 1 ? 's' : ''} · {scenario.metadata.status}
      </div>

      <CardMetric
        label="Annual Business Value"
        result={engine.totalAnnualBusinessValue}
        color={color}
        format={(v) => `€${v.toFixed(1)}M/yr`}
      />
      <CardMetric
        label="Shared Cost Benefit"
        result={engine.totalSharedCostBenefit}
        color={color}
        format={(v) => `€${v.toFixed(1)}M`}
      />
      <CardMetric
        label="Value Accelerated (2030)"
        result={engine.valueAccelerated2030}
        color={color}
        format={(v) => v > 0 ? `+€${v.toFixed(1)}M` : '—'}
        accent
      />

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--grey-1)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <InfoRow label="Integrated ends" value={engine.integratedValueStartLabel} />
        <InfoRow label="Separate ends" value={engine.separateValueStartLabel} />
        {(scenario.timing.compressionMonths.value ?? 0) > 0 && (
          <InfoRow label="Compression" value={`${scenario.timing.compressionMonths.value} months`} />
        )}
      </div>
    </div>
  );
}

function CardMetric({
  label,
  result,
  color,
  format,
  accent = false,
}: {
  label: string;
  result: CalculationResult;
  color: string;
  format: (v: number) => string;
  accent?: boolean;
}) {
  const isCalc = result.status === 'CALCULATED' || result.status === 'PARTIAL';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--grey-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      {isCalc && result.value !== null ? (
        <div style={{ fontSize: 22, fontWeight: 700, color: accent ? color : 'var(--navy)', lineHeight: 1.1 }}>
          {format(result.value)}
          {result.status === 'PARTIAL' && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--grey-2)', marginLeft: 4 }}>partial</span>}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>
          {result.requiredInputs.length > 0 ? 'Needs FME inputs' : '—'}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--grey-2)' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey-3)' }}>{value}</span>
    </div>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

interface CompRow {
  label: string;
  group?: string;
  getValue: (sc: Scenario, eng: ScenarioEngineOutput) => { display: string; isCalc: boolean };
  calcResult?: (sc: Scenario, eng: ScenarioEngineOutput) => CalculationResult;
}

const COMPARISON_ROWS: CompRow[] = [
  // Business outcomes
  { label: 'Patient Volume Uplift', group: 'Business Outcomes',
    getValue: (sc) => ({ display: sc.businessOutcomes.patientVolumeUpliftPct.value !== null ? `+${sc.businessOutcomes.patientVolumeUpliftPct.value}%` : '—', isCalc: false }) },
  { label: 'Cost per Treatment Improvement', group: 'Business Outcomes',
    getValue: (sc) => ({ display: sc.businessOutcomes.costPerTreatmentImprovementPct.value !== null ? `-${sc.businessOutcomes.costPerTreatmentImprovementPct.value}%` : '—', isCalc: false }) },
  { label: 'Supply Waste Reduction', group: 'Business Outcomes',
    getValue: (sc) => ({ display: sc.businessOutcomes.supplyWasteReductionPct.value !== null ? `-${sc.businessOutcomes.supplyWasteReductionPct.value}%` : '—', isCalc: false }) },
  { label: 'Overall Value Capture', group: 'Business Outcomes',
    getValue: (sc) => ({ display: sc.businessOutcomes.overallValueCapturePct.value !== null ? `${sc.businessOutcomes.overallValueCapturePct.value}%` : '—', isCalc: false }) },
  // Calculated financial
  { label: 'Annual Cost Benefit', group: 'Calculated Value',
    getValue: (_, eng) => ({ display: eng.potentialAnnualCostBenefit.value !== null && eng.potentialAnnualCostBenefit.status !== 'REQUIRES_INPUT' ? `€${eng.potentialAnnualCostBenefit.value.toFixed(1)}M/yr` : 'Needs inputs', isCalc: eng.potentialAnnualCostBenefit.status === 'CALCULATED' }),
    calcResult: (_, eng) => eng.potentialAnnualCostBenefit },
  { label: 'Annual Waste Benefit', group: 'Calculated Value',
    getValue: (_, eng) => ({ display: eng.potentialAnnualWasteBenefit.value !== null && eng.potentialAnnualWasteBenefit.status !== 'REQUIRES_INPUT' ? `€${eng.potentialAnnualWasteBenefit.value.toFixed(1)}M/yr` : 'Needs inputs', isCalc: eng.potentialAnnualWasteBenefit.status === 'CALCULATED' }),
    calcResult: (_, eng) => eng.potentialAnnualWasteBenefit },
  { label: 'Total Annual Business Value', group: 'Calculated Value',
    getValue: (_, eng) => ({ display: eng.totalAnnualBusinessValue.value !== null && eng.totalAnnualBusinessValue.status !== 'REQUIRES_INPUT' ? `€${eng.totalAnnualBusinessValue.value.toFixed(1)}M/yr${eng.totalAnnualBusinessValue.status === 'PARTIAL' ? '+' : ''}` : 'Needs inputs', isCalc: eng.totalAnnualBusinessValue.status !== 'REQUIRES_INPUT' && eng.totalAnnualBusinessValue.value !== null }),
    calcResult: (_, eng) => eng.totalAnnualBusinessValue },
  // Shared cost
  { label: 'Shared Cost Benefit', group: 'Shared Transformation Cost',
    getValue: (_, eng) => ({ display: eng.totalSharedCostBenefit.value !== null ? `€${eng.totalSharedCostBenefit.value.toFixed(1)}M${eng.totalSharedCostBenefit.status === 'PARTIAL' ? '+' : ''}` : 'Needs cost bases', isCalc: eng.totalSharedCostBenefit.status !== 'REQUIRES_INPUT' }),
    calcResult: (_, eng) => eng.totalSharedCostBenefit },
  { label: 'Cost Bases Entered', group: 'Shared Transformation Cost',
    getValue: (_, eng) => ({ display: `${eng.sharedCostCoverage.calculated} / ${eng.sharedCostCoverage.total}`, isCalc: false }) },
  // Speed
  { label: 'Timeline Compression', group: 'Speed / Timing',
    getValue: (sc) => ({ display: (sc.timing.compressionMonths.value ?? 0) > 0 ? `${sc.timing.compressionMonths.value} months` : 'None', isCalc: false }) },
  { label: 'Value Realization Speed', group: 'Speed / Timing',
    getValue: (sc) => ({ display: sc.timing.valueRealizationSpeed.value ?? 'expected', isCalc: false }) },
  { label: 'Integrated Value Starts', group: 'Speed / Timing',
    getValue: (_, eng) => ({ display: eng.integratedValueStartLabel, isCalc: false }) },
  { label: 'Separate Value Starts', group: 'Speed / Timing',
    getValue: (_, eng) => ({ display: eng.separateValueStartLabel, isCalc: false }) },
  // Acceleration
  { label: 'Value Accelerated by 2030', group: 'Value Acceleration',
    getValue: (_, eng) => ({ display: eng.valueAccelerated2030.value !== null && eng.valueAccelerated2030.status !== 'REQUIRES_INPUT' && eng.valueAccelerated2030.value > 0 ? `+€${eng.valueAccelerated2030.value.toFixed(1)}M` : eng.valueAccelerated2030.status === 'REQUIRES_INPUT' ? 'Needs inputs' : '—', isCalc: eng.valueAccelerated2030.status === 'CALCULATED' }),
    calcResult: (_, eng) => eng.valueAccelerated2030 },
  { label: 'Value Accelerated by 2035', group: 'Value Acceleration',
    getValue: (_, eng) => ({ display: eng.valueAccelerated2035.value !== null && eng.valueAccelerated2035.status !== 'REQUIRES_INPUT' && eng.valueAccelerated2035.value > 0 ? `+€${eng.valueAccelerated2035.value.toFixed(1)}M` : eng.valueAccelerated2035.status === 'REQUIRES_INPUT' ? 'Needs inputs' : '—', isCalc: eng.valueAccelerated2035.status === 'CALCULATED' }),
    calcResult: (_, eng) => eng.valueAccelerated2035 },
];

function ComparisonTable({
  pairs,
}: {
  pairs: { scenario: Scenario; engine: ScenarioEngineOutput; color: string }[];
}) {
  const [openDrawers, setOpenDrawers] = useState<Record<string, number>>({});
  let lastGroup = '';

  return (
    <div style={{ background: 'white', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `220px repeat(${pairs.length}, 1fr)`,
          background: 'var(--grey-0)',
          borderBottom: '2px solid var(--grey-1)',
        }}
      >
        <div style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)' }}>
          Metric
        </div>
        {pairs.map(({ scenario, color }, i) => (
          <div
            key={scenario.metadata.id}
            style={{ padding: '10px 14px', borderLeft: '1px solid var(--grey-1)', borderTop: `3px solid ${color}` }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color }}>{scenario.metadata.name}</div>
          </div>
        ))}
      </div>

      {/* Rows */}
      {COMPARISON_ROWS.map((row, ri) => {
        const isNewGroup = row.group !== lastGroup;
        lastGroup = row.group ?? '';
        const drawerKey = `row-${ri}`;
        const openIdx = openDrawers[drawerKey];

        return (
          <React.Fragment key={row.label}>
            {isNewGroup && row.group && (
              <div
                style={{
                  padding: '7px 14px',
                  background: 'var(--grey-0)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--blue)',
                  borderBottom: '1px solid var(--grey-1)',
                }}
              >
                {row.group}
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `220px repeat(${pairs.length}, 1fr)`,
                borderBottom: '1px solid var(--grey-1)',
              }}
            >
              <div style={{ padding: '11px 14px' }}>
                <div style={{ fontSize: 12, color: 'var(--grey-3)' }}>{row.label}</div>
              </div>
              {pairs.map(({ scenario, engine, color }, ci) => {
                const { display, isCalc } = row.getValue(scenario, engine);
                const calcResult = row.calcResult?.(scenario, engine);
                const isOpen = openIdx === ci;
                return (
                  <div
                    key={scenario.metadata.id}
                    style={{ padding: '11px 14px', borderLeft: '1px solid var(--grey-1)' }}
                  >
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: isCalc ? 700 : 500,
                        color: isCalc ? 'var(--navy)' : 'var(--grey-2)',
                      }}
                    >
                      {display}
                    </div>
                    {calcResult && isCalc && (
                      <button
                        onClick={() =>
                          setOpenDrawers((prev) => ({
                            ...prev,
                            [drawerKey]: prev[drawerKey] === ci ? -1 : ci,
                          }))
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 10,
                          color: color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          marginTop: 2,
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="4.5" stroke="currentColor" />
                          <text x="5" y="8" textAnchor="middle" fontSize="7" fill="currentColor" fontWeight="700">?</text>
                        </svg>
                        {isOpen ? 'Hide' : 'How?'}
                      </button>
                    )}
                    {calcResult && isOpen && (
                      <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--grey-0)', borderLeft: `3px solid ${color}`, fontSize: 11 }}>
                        <div style={{ color: 'var(--grey-3)', lineHeight: 1.5, marginBottom: 4 }}>
                          {calcResult.calculationDescription}
                        </div>
                        {calcResult.inputs && Object.entries(calcResult.inputs).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ color: 'var(--grey-2)' }}>{k}</span>
                            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{v ?? '—'}</span>
                          </div>
                        ))}
                        {calcResult.requiredInputs.length > 0 && (
                          <div style={{ marginTop: 4, color: '#B45309', fontStyle: 'italic' }}>
                            Missing: {calcResult.requiredInputs.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CompareValue() {
  const { state } = useScenario();
  const allScenarios = state.scenarios;

  // Default: select base case + first user scenario (if any)
  const defaultSelected = useMemo(() => {
    const base = allScenarios.find((s) => s.isBaseCaseLocked);
    const first = allScenarios.find((s) => !s.isBaseCaseLocked);
    return [base?.metadata.id, first?.metadata.id].filter(Boolean) as string[];
  }, []);

  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelected);

  function handleToggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  const selectedScenarios = selectedIds
    .map((id) => allScenarios.find((s) => s.metadata.id === id))
    .filter(Boolean) as Scenario[];

  const engineOutputs = useMemo(
    () => selectedScenarios.map((s) => computeScenarioOutput(s)),
    [selectedScenarios]
  );

  const pairs = selectedScenarios.map((sc, i) => ({
    scenario: sc,
    engine: engineOutputs[i],
    color: SCENARIO_COLORS[i],
  }));

  // Build chart curves
  const chartCurves = pairs.map((p, i) => ({
    label: p.scenario.metadata.name,
    points: p.engine.valueCurve,
    colorIndex: i,
  }));

  const hasAnyCurveData = pairs.some((p) => p.engine.hasEnoughForCurve);

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1240, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="eyebrow">05 — Compare Value</div>
        <h1 className="section-heading">Side-by-side scenario comparison</h1>
        <p className="section-sub">
          Compare up to 3 scenarios. Select scenarios below to see their assumptions, calculated
          outputs, and value curves side-by-side.
        </p>
      </div>

      {/* Scenario Picker */}
      <SectionLabel>Select Scenarios (up to 3)</SectionLabel>
      <ScenarioPicker scenarios={allScenarios} selected={selectedIds} onToggle={handleToggle} />

      {selectedScenarios.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--grey-2)', fontStyle: 'italic', fontSize: 13 }}>
          Select at least one scenario above to begin comparison.
        </div>
      )}

      {/* Summary Cards */}
      {selectedScenarios.length > 0 && (
        <>
          <SectionLabel>Scenario Summaries</SectionLabel>
          <div style={{ display: 'flex', gap: 2, marginBottom: 32 }}>
            {pairs.map(({ scenario, engine, color }, i) => (
              <ScenarioCard key={scenario.metadata.id} scenario={scenario} engine={engine} color={color} index={i} />
            ))}
          </div>

          {/* What Changed? */}
          {selectedScenarios.length >= 2 && (
            <>
              <SectionLabel>What Changed?</SectionLabel>
              <WhatChanged pairs={pairs} />
            </>
          )}

          {/* Comparison Table */}
          {selectedScenarios.length >= 2 && (
            <>
              <SectionLabel>Detailed Comparison</SectionLabel>
              <div style={{ marginBottom: 32 }}>
                <ComparisonTable pairs={pairs} />
              </div>
            </>
          )}

          {/* Value Curve Chart */}
          <SectionLabel>
            Cumulative Value Realization — 2026 to 2035
          </SectionLabel>
          <div style={{ background: 'white', padding: '24px', marginBottom: 40 }}>
            <div style={{ fontSize: 12, color: 'var(--grey-2)', marginBottom: 16, lineHeight: 1.55 }}>
              Solid lines show the integrated delivery path (value starts earlier). Dashed lines show separate delivery.
              {!hasAnyCurveData && (
                <span style={{ color: '#B45309' }}> Add financial baseline inputs to generate value curves.</span>
              )}
              {hasAnyCurveData && (
                <span> All values are modeled estimates — accuracy depends on financial baseline inputs.</span>
              )}
            </div>
            <ValueCurveChart curves={chartCurves} showSeparate />
          </div>

          {/* Missing Inputs Note */}
          {pairs.some((p) => p.engine.missingFinancialInputs.length > 0) && (
            <>
              <SectionLabel>Missing Inputs</SectionLabel>
              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '16px 20px', marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400E', marginBottom: 8 }}>
                  Add these inputs in Pressure-Test → Advanced Assumptions to unlock full value calculations
                </div>
                {[...new Set(pairs.flatMap((p) => p.engine.missingFinancialInputs))].map((inp) => (
                  <div key={inp} style={{ fontSize: 12, color: '#92400E', marginBottom: 3 }}>
                    • {inp}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── What Changed? ────────────────────────────────────────────────────────────

function WhatChanged({ pairs }: { pairs: { scenario: Scenario; engine: ScenarioEngineOutput; color: string }[] }) {
  const [a, b] = pairs;
  if (!a || !b) return null;

  const changes: { label: string; from: string; to: string; type: 'added' | 'removed' | 'changed' }[] = [];

  // Programs added/removed
  const aProgs = new Set(a.scenario.selectedPrograms);
  const bProgs = new Set(b.scenario.selectedPrograms);
  for (const id of bProgs) {
    if (!aProgs.has(id)) changes.push({ label: 'Program added', from: '—', to: id, type: 'added' });
  }
  for (const id of aProgs) {
    if (!bProgs.has(id)) changes.push({ label: 'Program removed', from: id, to: '—', type: 'removed' });
  }

  // Timeline compression
  const aComp = a.scenario.timing.compressionMonths.value;
  const bComp = b.scenario.timing.compressionMonths.value;
  if (aComp !== bComp) {
    changes.push({ label: 'Timeline compression', from: aComp !== null ? `${aComp} months` : 'Not set', to: bComp !== null ? `${bComp} months` : 'Not set', type: 'changed' });
  }

  // Business outcome assumptions
  const outp = [
    { field: 'patientVolumeUpliftPct' as const, label: 'Patient Volume Uplift' },
    { field: 'costPerTreatmentImprovementPct' as const, label: 'Cost per Treatment Improvement' },
    { field: 'supplyWasteReductionPct' as const, label: 'Supply Waste Reduction' },
    { field: 'overallValueCapturePct' as const, label: 'Overall Value Capture' },
  ];
  for (const { field, label } of outp) {
    const av = a.scenario.businessOutcomes[field].value;
    const bv = b.scenario.businessOutcomes[field].value;
    if (av !== bv) {
      changes.push({ label, from: av !== null ? `${av}` : 'Not set', to: bv !== null ? `${bv}` : 'Not set', type: 'changed' });
    }
  }

  // Modeled value difference
  const aVal = a.engine.totalAnnualBusinessValue.value;
  const bVal = b.engine.totalAnnualBusinessValue.value;
  if (aVal !== null && bVal !== null && Math.abs(aVal - bVal) > 0.05) {
    const diff = bVal - aVal;
    changes.push({ label: 'Modeled annual value difference', from: `€${aVal.toFixed(1)}M/yr`, to: `€${bVal.toFixed(1)}M/yr (${diff > 0 ? '+' : ''}€${diff.toFixed(1)}M)`, type: 'changed' });
  }

  const colorA = pairs[0].color;
  const colorB = pairs[1].color;

  return (
    <div style={{ background: 'white', marginBottom: 32, padding: '20px 24px' }}>
      {changes.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>
          No differences detected between these two scenarios.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {changes.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto 1fr', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: i < changes.length - 1 ? '1px solid var(--grey-0)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--grey-3)', fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: colorA, background: `${colorA}14`, padding: '3px 10px', borderRadius: 4 }}>
                {c.from}
              </div>
              <div style={{ fontSize: 10, color: 'var(--grey-2)' }}>→</div>
              <div style={{ fontSize: 12, color: colorB, background: `${colorB}14`, padding: '3px 10px', borderRadius: 4 }}>
                {c.to}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--grey-2)', fontStyle: 'italic' }}>
        Showing differences between <strong style={{ color: colorA }}>{a.scenario.metadata.name}</strong> and <strong style={{ color: colorB }}>{b.scenario.metadata.name}</strong>.
        {pairs.length > 2 && ' Expand to see all three pairwise comparisons.'}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--blue)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--grey-1)', display: 'block' }} />
    </div>
  );
}
