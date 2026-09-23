import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenario } from '../../state/ScenarioContext';
import { useEngineOutput } from '../../engine/useEngine';
import { PROGRAMS } from '../../data/programs';
import { Scenario } from '../../types';
import { ScenarioEngineOutput, CalculationResult } from '../../engine/types';
import ValueCurveChart from '../value/ValueCurveChart';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── What Must Be True Generator ──────────────────────────────────────────────

function generateWhatMustBeTrue(scenario: Scenario): string[] {
  const sp = scenario.selectedPrograms;
  const hasEHR = sp.includes('ehr-patient-care');
  const hasSupply = sp.includes('supply-chain');
  const hasGEMINI = sp.includes('gemini');
  const compression = scenario.timing.compressionMonths.value ?? 0;
  const volumeUplift = scenario.businessOutcomes.patientVolumeUpliftPct.value ?? 0;
  const changeSharedPct = scenario.sharedCosts.changeManagement.sharedPct.value ?? 0;
  const dataSharedPct = scenario.sharedCosts.dataIntegration.sharedPct.value ?? 0;

  const conditions: string[] = [];

  if (compression >= 6) {
    conditions.push(
      'Cross-program design decisions, dependencies, and testing must be managed through one integrated sequencing process — not separately within each stream.'
    );
  }
  if (changeSharedPct >= 35) {
    conditions.push(
      'Change activities across selected programs must be coordinated around common employee populations to realize the shared change cost benefit.'
    );
  }
  if (volumeUplift >= 4 && (hasEHR || sp.includes('esphora-cd'))) {
    conditions.push(
      'Workflow adoption must translate technology capability into measurable patient-access and retention improvement.'
    );
  }
  if (hasEHR && hasSupply) {
    conditions.push(
      'Patient-demand and scheduling signals must connect into supply planning and clinic operations — requiring shared data architecture from the start.'
    );
  }
  if (hasGEMINI && sp.length > 1) {
    conditions.push(
      'GEMINI must be integrated from the start as the shared intelligence layer — not retrofitted after program-level reporting has already been built.'
    );
  }
  if (dataSharedPct >= 30 && sp.length > 1) {
    conditions.push(
      'Data and integration architecture must be designed once across all selected programs rather than built separately within each stream.'
    );
  }
  if (conditions.length === 0) {
    conditions.push(
      'Program design must maintain clear visibility across all integration points to capture the full benefit of shared cost and delivery.'
    );
  }

  return conditions.slice(0, 5);
}

// ─── Missing Input Context ────────────────────────────────────────────────────

const MISSING_INPUT_CONTEXT: Record<string, string> = {
  'Annual treatment volume':
    'Converts the volume uplift percentage into an absolute number of incremental treatments — the foundation of both the volume value and cost benefit calculations.',
  'Value per incremental treatment (€)':
    'Monetizes each additional treatment gained from the volume uplift assumption.',
  'Cost per treatment (€)':
    'Enables the cost reduction calculation — essential to quantify the benefit of clinical workflow improvements.',
  'Supply consumable cost base (€M)':
    'Quantifies the financial benefit of supply waste reduction — unlocks the supply chain value component.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtValue(result: CalculationResult<number>, suffix = '/yr'): string {
  if (result.status === 'NOT_APPLICABLE' || result.value === null) return '—';
  return `€${result.value.toFixed(1)}M${result.status === 'PARTIAL' ? '+' : ''}${suffix}`;
}

function sourceLabel(source: string): string {
  if (source === 'fme-reported') return 'FME REPORTED';
  if (source === 'adjusted') return 'FME ADJUSTED';
  if (source === 'user-input') return 'FME INPUT';
  return 'ACCENTURE ESTIMATE';
}

function sourceDot(source: string): string {
  if (source === 'fme-reported' || source === 'adjusted' || source === 'user-input') return '#047857';
  return '#1D4ED8';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScenarioSummaryPanel({ open, onClose }: Props) {
  const { activeScenario } = useScenario();
  const engine = useEngineOutput(activeScenario);
  const navigate = useNavigate();
  const { businessOutcomes: bo, sharedCosts, timing, selectedPrograms } = activeScenario;

  const selectedProgramData = useMemo(
    () => PROGRAMS.filter((p) => selectedPrograms.includes(p.id)),
    [selectedPrograms]
  );
  const separatePrograms = useMemo(
    () => PROGRAMS.filter((p) => !selectedPrograms.includes(p.id)),
    [selectedPrograms]
  );

  const whatMustBeTrue = useMemo(
    () => generateWhatMustBeTrue(activeScenario),
    [activeScenario]
  );

  // Hero output: combine annual business value + shared cost if both not partial
  const annualBizOk =
    engine.totalAnnualBusinessValue.status === 'CALCULATED' &&
    engine.totalAnnualBusinessValue.value !== null;
  const sharedOk =
    engine.totalSharedCostBenefit.status === 'CALCULATED' &&
    engine.totalSharedCostBenefit.value !== null;
  const canCombineAnnual = annualBizOk && sharedOk;
  const combinedAnnualEurM = canCombineAnnual
    ? Math.round(
        ((engine.totalAnnualBusinessValue.value ?? 0) + (engine.totalSharedCostBenefit.value ?? 0)) * 10
      ) / 10
    : null;

  const hasAccel2030 =
    engine.valueAccelerated2030.status === 'CALCULATED' &&
    engine.valueAccelerated2030.value !== null;

  // Value curve for compact chart
  const valueCurveCurves = useMemo(
    () => [
      {
        label: activeScenario.metadata.name,
        points: engine.valueCurve,
        colorIndex: 0 as const,
      },
    ],
    [activeScenario.metadata.name, engine.valueCurve]
  );

  // Shared cost rows
  const sharedCostRows = [
    { label: 'Governance / Management', cat: sharedCosts.governance },
    { label: 'Change Management', cat: sharedCosts.changeManagement },
    { label: 'Training & Rollout', cat: sharedCosts.trainingRollout },
    { label: 'Data / Integration', cat: sharedCosts.dataIntegration },
    { label: 'Program Resources', cat: sharedCosts.programResource },
  ];

  function handleGoToInputs() {
    onClose();
    navigate('/pressure-test');
  }

  if (!open) return null;

  const compressionMonths = timing.compressionMonths.value ?? 0;
  const valueCaptureLabel =
    bo.overallValueCapturePct.value !== null ? `${bo.overallValueCapturePct.value}%` : 'Not set';

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #scenario-summary-print { display: flex !important; position: static !important; overflow: visible !important; }
          #scenario-summary-print-header .no-print { display: none !important; }
          #scenario-summary-print-content { overflow: visible !important; max-height: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 590, background: 'rgba(26,39,64,0.4)' }}
      />

      {/* Overlay */}
      <div
        id="scenario-summary-print"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 600,
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          id="scenario-summary-print-header"
          style={{
            background: 'var(--navy)',
            padding: '20px 48px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              FME Transformation Scenario
            </div>
            <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 22, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
              {activeScenario.metadata.name}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
              Based on your current assumptions
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
                fontWeight: 500,
                padding: '7px 16px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PrintIcon />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px', borderRadius: 3 }}
              aria-label="Close summary"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div
          id="scenario-summary-print-content"
          style={{ flex: 1, overflowY: 'auto', background: '#F4F6F9' }}
        >
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 40px 64px' }}>

            {/* ── Programs + Key Assumptions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 28 }}>
              {/* Programs under integrated design */}
              <div style={{ background: 'white', borderTop: '3px solid var(--blue)', padding: '18px 20px', gridColumn: '1 / 2' }}>
                <SummaryLabel>Programs Under Integrated Design</SummaryLabel>
                {selectedProgramData.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>No programs selected</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {selectedProgramData.map((p, i) => (
                      <React.Fragment key={p.id}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{p.shortName}</div>
                        {i < selectedProgramData.length - 1 && (
                          <div style={{ fontSize: 11, color: 'var(--grey-2)', paddingLeft: 4 }}>+</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                {separatePrograms.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--grey-1)' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 6 }}>
                      Remaining Separate
                    </div>
                    {separatePrograms.map((p) => (
                      <div key={p.id} style={{ fontSize: 11, color: 'var(--grey-2)', marginBottom: 3 }}>{p.shortName}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline Compression */}
              <div style={{ background: 'white', borderTop: '3px solid var(--teal)', padding: '18px 20px' }}>
                <SummaryLabel>Timeline Compression</SummaryLabel>
                {compressionMonths > 0 ? (
                  <>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)', fontFamily: 'Source Serif 4, serif', marginTop: 8 }}>
                      {compressionMonths}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--grey-3)' }}>months sooner</div>
                    <div style={{ fontSize: 11, color: 'var(--grey-2)', marginTop: 8 }}>
                      <SourcePill source={timing.compressionMonths.source} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--grey-3)', marginTop: 8 }}>
                      Value start: <strong>{engine.integratedValueStartLabel}</strong>
                      <br />
                      vs. separate: {engine.separateValueStartLabel}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic', marginTop: 8 }}>Not set</div>
                )}
              </div>

              {/* Value Capture */}
              <div style={{ background: 'white', borderTop: '3px solid #7C3AED', padding: '18px 20px' }}>
                <SummaryLabel>Value Capture</SummaryLabel>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#7C3AED', fontFamily: 'Source Serif 4, serif', marginTop: 8 }}>
                  {valueCaptureLabel}
                </div>
                <div style={{ fontSize: 12, color: 'var(--grey-3)', marginTop: 2 }}>
                  of modeled opportunity
                </div>
                {bo.overallValueCapturePct.value !== null && (
                  <div style={{ marginTop: 8 }}>
                    <SourcePill source={bo.overallValueCapturePct.source} />
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--grey-3)', marginTop: 8, lineHeight: 1.5 }}>
                  Accounts for adoption, ramp-up, and execution risk.
                </div>
              </div>
            </div>

            {/* ── Three Value Lenses ── */}
            <SectionDivider>Three Value Lenses</SectionDivider>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 28 }}>

              {/* A. Business Outcome Value */}
              <div style={{ background: 'white', padding: '20px 22px', borderTop: '3px solid var(--blue)' }}>
                <SummaryLabel color="var(--blue)">Business Outcome Value</SummaryLabel>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <KpiRow label="Patient Volume Uplift" value={bo.patientVolumeUpliftPct.value} format={(v) => `+${v}%`} source={bo.patientVolumeUpliftPct.source} />
                  <KpiRow label="Cost per Treatment" value={bo.costPerTreatmentImprovementPct.value} format={(v) => `-${v}%`} source={bo.costPerTreatmentImprovementPct.source} />
                  <KpiRow label="Supply Waste Reduction" value={bo.supplyWasteReductionPct.value} format={(v) => `-${v}%`} source={bo.supplyWasteReductionPct.source} />
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--grey-1)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 6 }}>
                    Modeled Business Outcome Value
                  </div>
                  {engine.totalAnnualBusinessValue.value !== null ? (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--blue)' }}>
                        {fmtValue(engine.totalAnnualBusinessValue)}
                      </div>
                      {engine.totalAnnualBusinessValue.status === 'PARTIAL' && (
                        <div style={{ fontSize: 10, color: '#D97706', marginTop: 4 }}>
                          Partial — additional FME inputs would expand this view
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>Requires FME financial inputs</div>
                  )}
                </div>
              </div>

              {/* B. Shared Transformation Cost */}
              <div style={{ background: 'white', padding: '20px 22px', borderTop: '3px solid var(--teal)' }}>
                <SummaryLabel color="var(--teal)">Shared Transformation Cost</SummaryLabel>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {sharedCostRows.map(({ label, cat }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--grey-3)', flexShrink: 0, maxWidth: 120 }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: cat.sharedPct.value !== null ? 'var(--navy)' : 'var(--grey-2)' }}>
                        {cat.sharedPct.value !== null ? `${cat.sharedPct.value}% shared` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--grey-1)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 6 }}>
                    Potential Shared Delivery Cost Benefit
                  </div>
                  {engine.totalSharedCostBenefit.value !== null ? (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>
                        {fmtValue(engine.totalSharedCostBenefit, '')}
                      </div>
                      {engine.sharedCostCoverage.calculated < engine.sharedCostCoverage.total && (
                        <div style={{ fontSize: 10, color: '#D97706', marginTop: 4 }}>
                          {engine.sharedCostCoverage.calculated} of {engine.sharedCostCoverage.total} cost categories calculated
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>Enter cost bases to calculate</div>
                  )}
                </div>
              </div>

              {/* C. Value Acceleration */}
              <div style={{ background: 'white', padding: '20px 22px', borderTop: '3px solid #7C3AED' }}>
                <SummaryLabel color="#7C3AED">Value Acceleration</SummaryLabel>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <KpiRow label="Delivery Compression" value={compressionMonths || null} format={(v) => `${v} months`} source={timing.compressionMonths.source} />
                  <KpiRow
                    label="Realization Speed"
                    value={timing.valueRealizationSpeed.value !== null ? 1 : null}
                    format={() => timing.valueRealizationSpeed.value ?? '—'}
                    source={timing.valueRealizationSpeed.source}
                  />
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--grey-1)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 6 }}>
                    Value Accelerated Through 2030
                  </div>
                  {hasAccel2030 ? (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED' }}>
                        €{engine.valueAccelerated2030.value!.toFixed(1)}M
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--grey-2)', marginTop: 4, lineHeight: 1.5 }}>
                        Cumulative advantage from realizing value sooner — not additional steady-state value.
                      </div>
                    </>
                  ) : compressionMonths === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>Set timeline compression to model acceleration</div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>Requires financial inputs to calculate</div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Hero Output ── */}
            <SectionDivider>Integrated Transformation Advantage</SectionDivider>
            <div style={{ background: 'white', padding: '24px 28px', marginBottom: 28, borderTop: '3px solid var(--navy)' }}>
              {canCombineAnnual ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 8 }}>
                      Combined Annual Integrated Value
                    </div>
                    <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 40, fontWeight: 600, color: 'var(--navy)' }}>
                      €{combinedAnnualEurM!.toFixed(1)}M
                      <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--grey-2)', marginLeft: 4 }}>/yr</span>
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <HeroComponent label="Business Outcome Value" value={fmtValue(engine.totalAnnualBusinessValue)} color="var(--blue)" />
                      <HeroComponent label="Shared Delivery Cost Benefit" value={fmtValue(engine.totalSharedCostBenefit, '')} color="var(--teal)" />
                      {hasAccel2030 && (
                        <HeroComponent label="Value Accelerated (2030)" value={`€${engine.valueAccelerated2030.value!.toFixed(1)}M total`} color="#7C3AED" />
                      )}
                    </div>
                  </div>
                  {hasAccel2030 && (
                    <div style={{ borderLeft: '1px solid var(--grey-1)', paddingLeft: 24, textAlign: 'right' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 6 }}>
                        Value Accelerated (2030)
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#7C3AED' }}>
                        €{engine.valueAccelerated2030.value!.toFixed(1)}M
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--grey-2)', marginTop: 3 }}>cumulative advantage</div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic', marginBottom: 16 }}>
                    Combined value requires complete financial inputs — components shown separately below.
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <PartialHeroCard label="Business Outcome Value" result={engine.totalAnnualBusinessValue} color="var(--blue)" suffix="/yr" />
                    <PartialHeroCard label="Shared Delivery Cost Benefit" result={engine.totalSharedCostBenefit} color="var(--teal)" suffix="" />
                    {engine.valueAccelerated2030.status !== 'NOT_APPLICABLE' && (
                      <PartialHeroCard label="Value Accelerated (through 2030)" result={engine.valueAccelerated2030} color="#7C3AED" suffix="" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Value Journey ── */}
            {engine.hasEnoughForCurve && (
              <>
                <SectionDivider>Value Realization Journey</SectionDivider>
                <div style={{ background: 'white', padding: '24px 28px', marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
                        2026–2035 Cumulative Value Realization
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.5 }}>
                        Solid line = integrated delivery · Dashed = programs running separately
                      </div>
                    </div>
                    {hasAccel2030 && (
                      <div style={{ background: '#F3F0FF', border: '1px solid #DDD6FE', padding: '8px 14px', fontSize: 12, color: '#7C3AED', lineHeight: 1.55, maxWidth: 280, textAlign: 'right' }}>
                        <strong>€{engine.valueAccelerated2030.value!.toFixed(1)}M</strong> of cumulative value advantage through 2030 — from realizing the modeled opportunity {compressionMonths} months sooner.
                      </div>
                    )}
                  </div>
                  <ValueCurveChart curves={valueCurveCurves} showSeparate />
                </div>
              </>
            )}

            {/* ── What Must Be True ── */}
            <SectionDivider>What Must Be True</SectionDivider>
            <div style={{ background: 'white', padding: '24px 28px', marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: 'var(--grey-3)', marginBottom: 16, lineHeight: 1.6 }}>
                The execution conditions implied by Martin's current scenario assumptions.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {whatMustBeTrue.map((condition, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        background: 'var(--navy)',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        borderRadius: 2,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.65 }}>{condition}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── What We Still Need to Know ── */}
            {(engine.missingFinancialInputs.length > 0 || engine.sharedCostCoverage.calculated < engine.sharedCostCoverage.total) && (
              <>
                <SectionDivider>What We Still Need to Know</SectionDivider>
                <div style={{ background: 'white', padding: '24px 28px', marginBottom: 28 }}>
                  <div style={{ fontSize: 12, color: 'var(--grey-3)', marginBottom: 16, lineHeight: 1.6 }}>
                    These inputs would most materially improve the financial model.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {engine.missingFinancialInputs.map((item) => {
                      const ctx = MISSING_INPUT_CONTEXT[item];
                      return (
                        <div key={item} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 16px', background: '#FFFBEB', borderLeft: '3px solid #D97706' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>{item}</div>
                            {ctx && (
                              <div style={{ fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.55 }}>
                                <strong>Why it matters:</strong> {ctx}
                              </div>
                            )}
                          </div>
                          <button
                            className="no-print"
                            onClick={handleGoToInputs}
                            style={{
                              background: 'var(--navy)',
                              border: 'none',
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              borderRadius: 3,
                              flexShrink: 0,
                            }}
                          >
                            Add Input →
                          </button>
                        </div>
                      );
                    })}
                    {engine.sharedCostCoverage.calculated < engine.sharedCostCoverage.total && (
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 16px', background: '#FFFBEB', borderLeft: '3px solid #D97706' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>
                            Shared Cost Bases ({engine.sharedCostCoverage.total - engine.sharedCostCoverage.calculated} not entered)
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.55 }}>
                            <strong>Why it matters:</strong> Each cost base entered unlocks its shared cost calculation — enter governance, change, training, data, and program resource costs to quantify the full integration advantage.
                          </div>
                        </div>
                        <button
                          className="no-print"
                          onClick={handleGoToInputs}
                          style={{
                            background: 'var(--navy)',
                            border: 'none',
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            borderRadius: 3,
                            flexShrink: 0,
                          }}
                        >
                          Add Input →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryLabel({ children, color = 'var(--grey-2)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>
      {children}
    </div>
  );
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--blue)',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--grey-1)', display: 'block' }} />
    </div>
  );
}

function SourcePill({ source }: { source: string }) {
  const label = sourceLabel(source);
  const color = sourceDot(source);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function KpiRow({
  label,
  value,
  format,
  source,
}: {
  label: string;
  value: number | string | null;
  format: (v: number | string) => string;
  source: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--grey-3)', flex: 1 }}>{label}</span>
      {value !== null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>{format(value as number)}</span>
          <SourcePill source={source} />
        </div>
      ) : (
        <span style={{ fontSize: 10, color: 'var(--grey-2)', fontStyle: 'italic' }}>not set</span>
      )}
    </div>
  );
}

function HeroComponent({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function PartialHeroCard({ label, result, color, suffix }: { label: string; result: CalculationResult<number>; color: string; suffix: string }) {
  return (
    <div style={{ background: 'var(--grey-0)', border: '1px solid var(--grey-1)', borderTop: `3px solid ${color}`, padding: '14px 18px', minWidth: 200, flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 8 }}>{label}</div>
      {result.value !== null ? (
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{fmtValue(result, suffix)}</div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>
          {result.requiredInputs.length > 0 ? 'Requires FME inputs' : '—'}
        </div>
      )}
    </div>
  );
}

function PrintIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M4 5V2h8v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4" y="9" width="8" height="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
