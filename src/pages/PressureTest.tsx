import React, { useState } from 'react';
import { useScenario } from '../state/ScenarioContext';
import { calcSharedBenefit, calcTotalSharedBenefit } from '../types';
import { getActiveKpis } from '../data/kpiMapping';
import { PROGRAMS } from '../data/programs';
import AssumptionSlider from '../components/ui/AssumptionSlider';
import AssumptionInput from '../components/ui/AssumptionInput';
import SegmentedControl from '../components/ui/SegmentedControl';
import CalcDrawer from '../components/ui/CalcDrawer';
import LivePreview from '../components/scenario/LivePreview';
import TimelineViz from '../components/scenario/TimelineViz';
import { useEngineOutput } from '../engine/useEngine';
import { CalculationResult } from '../engine/types';

export default function PressureTest() {
  const { activeScenario, dispatch } = useScenario();
  const { businessOutcomes: bo, sharedCosts, timing, financialBaselines, programInvestmentsEurM, selectedPrograms } = activeScenario;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const programKpis = getActiveKpis(selectedPrograms);
  const { total: totalSharedBenefit, missingCount } = calcTotalSharedBenefit(sharedCosts);
  const compressionMonths = timing.compressionMonths.value ?? 0;
  const engine = useEngineOutput(activeScenario);

  const SHARED_COST_ORDER = [
    sharedCosts.governance,
    sharedCosts.changeManagement,
    sharedCosts.trainingRollout,
    sharedCosts.dataIntegration,
    sharedCosts.programResource,
  ] as const;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow">03 — Pressure-Test</div>
        <h1 className="section-heading">Stress-test your assumptions</h1>
        <p className="section-sub">
          Adjust levers to explore how different assumptions affect the transformation value equation.
          All inputs are editable. Calculated outputs update immediately.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

        {/* ── LEFT: Controls ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 01 Business Outcomes ── */}
          <SectionCard
            number="01"
            title="Business Outcomes"
            subtitle="How much could integrated delivery shift FME's key performance metrics?"
          >
            <AssumptionSlider
              label="Patient Volume Uplift"
              assumption={bo.patientVolumeUpliftPct}
              min={0} max={10} step={0.5}
              formatValue={(v) => `+${v}%`}
              minLabel="No change" maxLabel="+10%"
              onChange={(v) => dispatch({ type: 'SET_BUSINESS_OUTCOME', field: 'patientVolumeUpliftPct', value: v })}
            />
            <AssumptionSlider
              label="Cost per Treatment Improvement"
              assumption={bo.costPerTreatmentImprovementPct}
              min={0} max={15} step={0.5}
              formatValue={(v) => `-${v}%`}
              minLabel="No change" maxLabel="-15%"
              onChange={(v) => dispatch({ type: 'SET_BUSINESS_OUTCOME', field: 'costPerTreatmentImprovementPct', value: v })}
            />
            <AssumptionSlider
              label="Clinic Productivity Improvement"
              assumption={bo.clinicProductivityImprovementPct}
              min={0} max={20} step={1}
              formatValue={(v) => `+${v}%`}
              minLabel="No change" maxLabel="+20%"
              onChange={(v) => dispatch({ type: 'SET_BUSINESS_OUTCOME', field: 'clinicProductivityImprovementPct', value: v })}
            />
            <AssumptionSlider
              label="Supply / Consumable Waste Reduction"
              assumption={bo.supplyWasteReductionPct}
              min={0} max={30} step={1}
              formatValue={(v) => `-${v}%`}
              minLabel="No change" maxLabel="-30%"
              onChange={(v) => dispatch({ type: 'SET_BUSINESS_OUTCOME', field: 'supplyWasteReductionPct', value: v })}
            />

            {/* Program-specific KPIs */}
            {programKpis.length > 0 && (
              <>
                <div style={{ margin: '8px 0', padding: '6px 0', borderTop: '1px solid var(--grey-1)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)' }}>
                    Program-Specific KPIs
                  </span>
                </div>
                {programKpis.map((kpi) => {
                  const field = kpi.field as keyof typeof bo;
                  const assumption = bo[field] as ReturnType<typeof import('../types').emptyInput>;
                  return (
                    <AssumptionSlider
                      key={kpi.field}
                      label={kpi.label}
                      assumption={assumption}
                      min={kpi.min} max={kpi.max} step={kpi.step}
                      formatValue={kpi.formatValue}
                      onChange={(v) => dispatch({ type: 'SET_BUSINESS_OUTCOME', field: kpi.field, value: v })}
                    />
                  );
                })}
              </>
            )}

            <div style={{ borderTop: '1px solid var(--grey-1)', paddingTop: 16, marginTop: 4 }}>
              <AssumptionSlider
                label="Overall Value Capture"
                assumption={bo.overallValueCapturePct}
                min={0} max={100} step={5}
                formatValue={(v) => `${v}%`}
                minLabel="0%" maxLabel="100%"
                onChange={(v) => dispatch({ type: 'SET_BUSINESS_OUTCOME', field: 'overallValueCapturePct', value: v })}
              />
              <p style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5 }}>
                The percentage of the theoretical improvement that FME realistically captures — accounting for ramp-up, adoption, and execution risk.
              </p>
            </div>

            {/* ── Calculated Outputs ── */}
            <div
              style={{
                marginTop: 4,
                padding: '14px 16px',
                background: 'var(--grey-0)',
                borderLeft: '3px solid var(--teal)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 10 }}>
                Calculated Outputs
              </div>
              <CalcOutputRow label="Incremental Treatment Volume" result={engine.incrementalTreatmentVolume} format={(v) => `+${v.toLocaleString()} treatments/yr`} />
              <CalcOutputRow label="Potential Annual Volume Value" result={engine.potentialAnnualVolumeValue} format={(v) => `€${v.toFixed(1)}M/yr`} />
              <CalcOutputRow label="Potential Annual Cost Benefit" result={engine.potentialAnnualCostBenefit} format={(v) => `€${v.toFixed(1)}M/yr`} />
              <CalcOutputRow label="Potential Annual Waste Benefit" result={engine.potentialAnnualWasteBenefit} format={(v) => `€${v.toFixed(1)}M/yr`} />
              {(engine.totalAnnualBusinessValue.status === 'CALCULATED' || engine.totalAnnualBusinessValue.status === 'PARTIAL') && (
                <div style={{ borderTop: '1px solid var(--grey-1)', marginTop: 8, paddingTop: 8 }}>
                  <CalcOutputRow label="Total Modeled Annual Value" result={engine.totalAnnualBusinessValue} format={(v) => `€${v.toFixed(1)}M/yr`} bold />
                  <CalcDrawer result={engine.totalAnnualBusinessValue} label="Total Annual Business Value" />
                </div>
              )}
              {engine.totalAnnualBusinessValue.status === 'REQUIRES_INPUT' && engine.totalAnnualBusinessValue.requiredInputs.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--grey-2)', fontStyle: 'italic' }}>
                  ↓ Add financial baselines in Advanced Assumptions to enable calculations
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── 02 Shared Transformation Cost ── */}
          <SectionCard
            number="02"
            title="Shared Transformation Cost"
            subtitle="How much of each cost category can be shared across programs under integrated design?"
          >
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.6 }}>
                Enter the cost base for each category, then set how much of that cost could be shared
                when running programs together. Calculated benefits appear as you enter values.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {SHARED_COST_ORDER.map((cat) => {
                const benefit = calcSharedBenefit(cat);
                return (
                  <div
                    key={cat.id}
                    style={{
                      padding: '16px',
                      background: 'var(--grey-0)',
                      borderRadius: 8,
                      border: '1px solid var(--grey-1)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
                      {cat.label}
                    </div>

                    <AssumptionInput
                      label="Cost Base"
                      assumption={cat.costBaseEurM}
                      unit="€M"
                      placeholder="Enter FME value"
                      onChange={(v) => dispatch({ type: 'SET_SHARED_COST_BASE', categoryId: cat.id, value: v })}
                    />

                    <AssumptionSlider
                      label="% Shared Under Integrated Design"
                      assumption={cat.sharedPct}
                      min={0} max={100} step={5}
                      formatValue={(v) => `${v}%`}
                      onChange={(v) => dispatch({ type: 'SET_SHARED_COST_PCT', categoryId: cat.id, value: v })}
                    />

                    {/* Calculated benefit */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--grey-1)' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Potential Cost Benefit
                      </span>
                      {benefit !== null ? (
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
                          €{benefit.toFixed(2)}M
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>
                          Enter FME cost base to calculate
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                background: totalSharedBenefit !== null ? '#E6F6F7' : 'var(--grey-0)',
                borderRadius: 8,
                border: `1px solid ${totalSharedBenefit !== null ? 'var(--teal)' : 'var(--grey-1)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Total Potential Shared Cost Benefit
                </div>
                {missingCount > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--grey-2)', marginTop: 2 }}>
                    {missingCount} cost base{missingCount > 1 ? 's' : ''} not yet entered
                  </div>
                )}
              </div>
              {totalSharedBenefit !== null ? (
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>
                  €{totalSharedBenefit.toFixed(1)}M
                </span>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--grey-2)', fontStyle: 'italic' }}>
                  Requires cost bases
                </span>
              )}
            </div>
          </SectionCard>

          {/* ── 03 Speed / Compression ── */}
          <SectionCard
            number="03"
            title="Speed / Transformation Compression"
            subtitle="How much faster could integrated design deliver value compared to running programs separately?"
          >
            {/* Compression slider */}
            <div style={{ marginBottom: 24 }}>
              <AssumptionSlider
                label="Timeline Compression"
                assumption={timing.compressionMonths}
                min={0} max={36} step={1}
                formatValue={(v) => v === 0 ? 'No compression' : `${v} months sooner`}
                minLabel="No compression" maxLabel="36 months"
                onChange={(v) => dispatch({ type: 'SET_COMPRESSION_MONTHS', value: v })}
              />
              {compressionMonths > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '10px 14px',
                    background: '#E6F6F7',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--teal)',
                  }}
                >
                  Integrated delivery completes {compressionMonths} months earlier — accelerating
                  value realization and reducing cost.
                </div>
              )}
            </div>

            {/* Value realization speed */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
                Value Realization Speed
              </div>
              <SegmentedControl
                value={timing.valueRealizationSpeed.value ?? 'expected'}
                options={[
                  { value: 'slower', label: 'Slower' },
                  { value: 'expected', label: 'Expected' },
                  { value: 'faster', label: 'Faster' },
                ]}
                onChange={(v) => dispatch({ type: 'SET_VALUE_REALIZATION_SPEED', value: v })}
              />
              <p style={{ marginTop: 8, fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5 }}>
                How quickly benefits ramp after go-live — depends on user adoption, change management quality, and system stability.
              </p>
            </div>

            {/* Timeline visualization */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grey-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                Delivery Timeline
              </div>
              <TimelineViz
                selectedPrograms={selectedPrograms}
                compressionMonths={compressionMonths}
              />
            </div>

            {/* Timing engine outputs */}
            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                background: 'var(--grey-0)',
                borderLeft: '3px solid var(--blue)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 10 }}>
                Value Start Dates
              </div>
              <TimingRow label="Separate delivery ends" value={engine.separateValueStartLabel} />
              <TimingRow label="Integrated delivery ends" value={engine.integratedValueStartLabel} />
              {engine.valueAccelerated2030.status === 'CALCULATED' && engine.valueAccelerated2030.value !== null && engine.valueAccelerated2030.value > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--grey-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: 'var(--grey-3)' }}>Value accelerated by 2030</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>
                      +€{engine.valueAccelerated2030.value.toFixed(1)}M
                    </span>
                  </div>
                  <CalcDrawer result={engine.valueAccelerated2030} label="Value Acceleration (by 2030)" />
                </div>
              )}
              {engine.valueAccelerated2030.status === 'REQUIRES_INPUT' && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--grey-2)', fontStyle: 'italic' }}>
                  Add financial baselines to calculate the value acceleration advantage
                </div>
              )}
            </div>
          </SectionCard>

        </div>

        {/* ── RIGHT: Live Preview ───────────────────────────────────────────── */}
        <LivePreview />

      </div>

      {/* ── Advanced Assumptions ──────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => setAdvancedOpen((o) => !o)}
          style={{
            width: '100%',
            background: 'white',
            border: '1px solid var(--grey-1)',
            borderRadius: 8,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
              Advanced Assumptions
            </span>
            <span style={{ fontSize: 11, color: 'var(--grey-2)' }}>
              Financial baselines, program investments, operational baselines
            </span>
          </div>
          <span style={{ fontSize: 16, color: 'var(--grey-2)', transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▾
          </span>
        </button>

        {advancedOpen && (
          <div
            style={{
              background: 'white',
              border: '1px solid var(--grey-1)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '24px 24px 32px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

              {/* Financial Baselines */}
              <div>
                <AdvancedSection title="Financial Baselines">
                  <p style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5, marginBottom: 16 }}>
                    Enter FME financial data to enable value engine outputs. All values are used only within this scenario and stored in your browser.
                  </p>
                  <AssumptionInput
                    label="Annual Revenue Baseline"
                    assumption={financialBaselines.revenueBaselineEurM}
                    unit="€M"
                    placeholder="Enter FME value"
                    onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'revenueBaselineEurM', value: v })}
                  />
                  <AssumptionInput
                    label="Annual Treatment Volume"
                    assumption={financialBaselines.annualTreatmentVolume}
                    placeholder="Enter FME value"
                    description="Number of dialysis sessions / treatment episodes per year"
                    onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'annualTreatmentVolume', value: v })}
                  />
                  <AssumptionInput
                    label="Current Cost per Treatment"
                    assumption={financialBaselines.costPerTreatmentEur}
                    unit="€"
                    placeholder="Enter FME value"
                    description="FME Reported — verify against current FY data before using in calculations"
                    onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'costPerTreatmentEur', value: v })}
                  />
                  <AssumptionInput
                    label="Current No-Show Rate"
                    assumption={financialBaselines.currentNoShowRatePct}
                    unit="%"
                    placeholder="Enter FME value"
                    description="FME Reported — baseline for EHR-driven no-show rate improvement calculation"
                    onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'currentNoShowRatePct', value: v })}
                  />
                  <AssumptionInput
                    label="Annual Supply / Consumable Cost Base"
                    assumption={(financialBaselines as any).supplyConsumableCostBaseEurM ?? { value: null, source: 'unknown' }}
                    unit="€M"
                    placeholder="Enter FME value"
                    description="Annual supply and consumable cost — required for supply waste reduction calculation"
                    onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'supplyConsumableCostBaseEurM', value: v })}
                  />
                  <AssumptionInput
                    label="Value per Incremental Treatment"
                    assumption={(financialBaselines as any).valuePerIncrementalTreatmentEur ?? { value: null, source: 'unknown' }}
                    unit="€"
                    placeholder="Enter FME value"
                    description="Revenue or contribution per additional dialysis treatment — required for patient volume uplift value calculation"
                    onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'valuePerIncrementalTreatmentEur', value: v })}
                  />
                </AdvancedSection>
              </div>

              {/* Value Realization Settings */}
              <div>
                <AdvancedSection title="Value Realization Settings">
                  <p style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5, marginBottom: 16 }}>
                    Controls the shape of the value realization curve used in the Compare Value chart.
                  </p>
                  <AssumptionSlider
                    label="Ramp to Full Value"
                    assumption={(timing as any).rampToFullValueMonths ?? { value: 24, source: 'accenture-estimate', baseValue: 24, originalSource: 'accenture-estimate' }}
                    min={6} max={48} step={3}
                    formatValue={(v) => `${v} months`}
                    minLabel="6 months" maxLabel="48 months"
                    onChange={(v) => dispatch({ type: 'SET_RAMP_MONTHS', value: v })}
                  />
                  <p style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5 }}>
                    Time from go-live to full run-rate value. Longer ramp = slower benefit realization, steeper curve.
                  </p>
                </AdvancedSection>
              </div>

              {/* Program Investments */}
              <div>
                <AdvancedSection title="Program Investments">
                  <p style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5, marginBottom: 16 }}>
                    Enter the budgeted investment for each program. Used to calculate the net value equation.
                  </p>
                  {PROGRAMS.map((prog) => (
                    <AssumptionInput
                      key={prog.id}
                      label={prog.shortName}
                      assumption={programInvestmentsEurM[prog.id]}
                      unit="€M"
                      placeholder="Enter FME budget"
                      onChange={(v) => dispatch({ type: 'SET_PROGRAM_INVESTMENT', programId: prog.id, value: v })}
                    />
                  ))}
                </AdvancedSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 10,
        border: '1px solid var(--grey-1)',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--grey-1)',
          background: 'var(--grey-0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--blue)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {number}
          </span>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--navy)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {title}
          </h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.5, margin: 0 }}>
          {subtitle}
        </p>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function AdvancedSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--grey-2)',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '1px solid var(--grey-1)',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function CalcOutputRow({
  label,
  result,
  format,
  bold = false,
}: {
  label: string;
  result: CalculationResult;
  format: (v: number) => string;
  bold?: boolean;
}) {
  const isCalc = result.status === 'CALCULATED' || result.status === 'PARTIAL';
  const isNA = result.status === 'NOT_APPLICABLE';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--grey-3)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      {isNA ? null : isCalc && result.value !== null ? (
        <span style={{ fontSize: bold ? 15 : 13, fontWeight: 700, color: bold ? 'var(--navy)' : 'var(--teal)' }}>
          {format(result.value)}{result.status === 'PARTIAL' ? '+' : ''}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--grey-2)', fontStyle: 'italic' }}>
          {result.requiredInputs.length > 0 ? 'Needs inputs' : '—'}
        </span>
      )}
    </div>
  );
}

function TimingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 12, color: 'var(--grey-3)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{value}</span>
    </div>
  );
}
