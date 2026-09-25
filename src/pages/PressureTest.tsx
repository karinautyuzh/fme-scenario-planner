import React, { useState } from 'react';
import { useScenario } from '../state/ScenarioContext';
import { calcSharedBenefit, calcTotalSharedBenefit, OutcomeId, ProgramValueInputs, Assumption, emptyInput } from '../types';
import AssumptionSlider from '../components/ui/AssumptionSlider';
import AssumptionInput from '../components/ui/AssumptionInput';
import CalcDrawer from '../components/ui/CalcDrawer';
import LivePreview from '../components/scenario/LivePreview';
import TimelineViz from '../components/scenario/TimelineViz';
import { useEngineOutput } from '../engine/useEngine';
import { CalculationResult } from '../engine/types';

const OUTCOMES: { id: OutcomeId; label: string }[] = [
  { id: 'grow-patient-volume',         label: 'Grow Patient Volume / Market Position' },
  { id: 'reduce-cost-per-treatment',   label: 'Reduce Cost per Treatment' },
  { id: 'scalable-digital-enterprise', label: 'Build a Scalable, Digitally Enabled Enterprise' },
];

type TabId = 'scenario-wide' | string;

export default function PressureTest() {
  const { activeScenario, state, dispatch } = useScenario();
  const { businessOutcomes: bo, sharedCosts, timing, financialBaselines, programInvestmentsEurM, selectedPrograms } = activeScenario;

  const [activeTab, setActiveTab] = useState<TabId>('scenario-wide');

  const { total: totalSharedBenefit, missingCount } = calcTotalSharedBenefit(sharedCosts);
  const programValueInputs = activeScenario.programValueInputs ?? {};
  const compressionMonths = timing.compressionMonths.value ?? 0;
  const engine = useEngineOutput(activeScenario);

  const library = state.programLibrary;
  const selectedLibraryEntries = library.filter((p) => selectedPrograms.includes(p.id));

  const SHARED_COST_ORDER = [
    sharedCosts.governance,
    sharedCosts.changeManagement,
    sharedCosts.trainingRollout,
    sharedCosts.dataIntegration,
    sharedCosts.programResource,
  ] as const;

  // Active program (when not scenario-wide)
  const activeProgram = activeTab !== 'scenario-wide'
    ? library.find((p) => p.id === activeTab) ?? null
    : null;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow">04 — Pressure-Test</div>
        <h1 className="section-heading">Stress-test your assumptions</h1>
        <p className="section-sub">
          Edit assumptions at the program level or across the scenario as a whole. All inputs are
          yours to define. Calculated outputs update immediately.
        </p>
      </div>

      {/* ── Program Tab Bar ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '2px solid var(--grey-1)', marginBottom: 32, overflowX: 'auto' }}>
        <TabButton
          active={activeTab === 'scenario-wide'}
          onClick={() => setActiveTab('scenario-wide')}
          label="Scenario-Wide"
          sublabel="Shared costs, timeline, outcomes"
          badge={null}
          color="var(--navy)"
        />
        {selectedLibraryEntries.map((p) => (
          <TabButton
            key={p.id}
            active={activeTab === p.id}
            onClick={() => setActiveTab(p.id)}
            label={p.shortName || p.name}
            sublabel={p.status}
            badge={p.kpis.filter((k) => k.isActive).length || null}
            color="var(--blue)"
          />
        ))}
        {selectedLibraryEntries.length === 0 && (
          <div style={{ padding: '12px 20px', fontSize: 11, color: 'var(--grey-2)', fontStyle: 'italic', alignSelf: 'center' }}>
            Select programs in Build Your Scenario to see program-level tabs
          </div>
        )}
      </div>

      {/* ── Context Banner (when on a program tab) ── */}
      {activeProgram && (
        <div style={{ background: 'var(--navy)', padding: '10px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
              YOU ARE EDITING:{' '}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{activeProgram.name}</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{activeProgram.description}</span>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

        {/* ── LEFT: Controls ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ============================================================ */}
          {/* PROGRAM TAB CONTENT                                           */}
          {/* ============================================================ */}

          {activeProgram && (
            <>
              {/* Program Outcome Priorities */}
              <SectionCard
                number="A"
                title={`${activeProgram.shortName || activeProgram.name} — Outcome Priorities`}
                subtitle="How much does this program contribute to each enterprise outcome? Adjust sliders to reflect your assessment."
              >
                {OUTCOMES.map((o) => {
                  const value = activeProgram.outcomePriorities[o.id] ?? 50;
                  return (
                    <div key={o.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--navy)', fontFamily: 'Inter, sans-serif' }}>{o.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
                          {value < 34 ? 'Low' : value < 67 ? 'Medium' : 'High'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, color: 'var(--grey-2)', width: 30 }}>Low</span>
                        <input
                          type="range" min={0} max={100} step={5} value={value}
                          onChange={(e) => dispatch({ type: 'SET_PROGRAM_OUTCOME_PRIORITY', programId: activeProgram.id, outcomeId: o.id, value: Number(e.target.value) })}
                          style={{ flex: 1, accentColor: 'var(--blue)' }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--grey-2)', width: 30, textAlign: 'right' }}>High</span>
                      </div>
                    </div>
                  );
                })}
              </SectionCard>

              {/* Program Investment */}
              <SectionCard
                number="B"
                title="Program Investment"
                subtitle="What is the total budgeted investment for this program?"
              >
                <AssumptionInput
                  label={`${activeProgram.shortName || activeProgram.name} — Total Investment`}
                  assumption={programInvestmentsEurM[activeProgram.id] ?? { value: activeProgram.investmentEurM.value, source: activeProgram.investmentEurM.source, baseValue: null, originalSource: null }}
                  unit="€M"
                  placeholder="Enter FME budget"
                  onChange={(v) => dispatch({ type: 'SET_PROGRAM_INVESTMENT', programId: activeProgram.id, value: v })}
                />
                {activeProgram.investmentEurM.value !== null && (
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--grey-2)' }}>
                    Library reference: €{activeProgram.investmentEurM.value}M
                  </div>
                )}
              </SectionCard>

              {/* Active KPIs */}
              {activeProgram.kpis.filter((k) => k.isActive).length > 0 && (
                <SectionCard
                  number="C"
                  title="Active KPIs"
                  subtitle="KPIs active for this program. Edit baselines and targets to refine the scenario."
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeProgram.kpis.filter((k) => k.isActive).map((kpi) => (
                      <div key={kpi.id} style={{ padding: '12px 14px', background: 'var(--grey-0)', borderRadius: 6, border: '1px solid var(--grey-1)' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{kpi.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 4 }}>Baseline</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: kpi.baseline ? 'var(--navy)' : 'var(--grey-2)', fontStyle: kpi.baseline ? 'normal' : 'italic' }}>
                              {kpi.baseline || 'Not set'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 4 }}>Target</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: kpi.target ? 'var(--teal)' : 'var(--grey-2)', fontStyle: kpi.target ? 'normal' : 'italic' }}>
                              {kpi.target || 'Not set'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 4 }}>Unit</div>
                            <div style={{ fontSize: 13, color: 'var(--grey-3)' }}>{kpi.unit}</div>
                          </div>
                        </div>
                        {kpi.context && (
                          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--grey-3)', lineHeight: 1.5, fontStyle: 'italic' }}>{kpi.context}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5 }}>
                    To toggle KPIs on/off or add custom KPIs, go to Program Intake.
                  </div>
                </SectionCard>
              )}

              {/* XLS Value Drivers — per-program operational inputs */}
              <XlsValueDriverSection
                programId={activeProgram.id}
                programName={activeProgram.shortName || activeProgram.name}
                inputs={programValueInputs[activeProgram.id] ?? {}}
                standaloneValue={engine.standaloneValueByProgram[activeProgram.id] ?? null}
                onChangeInput={(field, value) =>
                  dispatch({ type: 'SET_PROGRAM_VALUE_INPUT', programId: activeProgram.id, field, value })
                }
              />
            </>
          )}

          {/* ============================================================ */}
          {/* SCENARIO-WIDE TAB CONTENT                                     */}
          {/* ============================================================ */}

          {activeTab === 'scenario-wide' && (
            <>
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
                <div style={{ marginTop: 4, padding: '14px 16px', background: 'var(--grey-0)', borderLeft: '3px solid var(--teal)' }}>
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
                      ↓ Add financial baselines below to enable calculations
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
                    Enter the cost base for each category, then set how much of that cost could be shared when running programs together.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {SHARED_COST_ORDER.map((cat) => {
                    const benefit = calcSharedBenefit(cat);
                    return (
                      <div key={cat.id} style={{ padding: '16px', background: 'var(--grey-0)', borderRadius: 8, border: '1px solid var(--grey-1)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>{cat.label}</div>
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--grey-1)' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Potential Cost Benefit
                          </span>
                          {benefit !== null ? (
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>€{benefit.toFixed(2)}M</span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>Enter FME cost base to calculate</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div style={{ marginTop: 16, padding: '14px 16px', background: totalSharedBenefit !== null ? '#E6F6F7' : 'var(--grey-0)', borderRadius: 8, border: `1px solid ${totalSharedBenefit !== null ? 'var(--teal)' : 'var(--grey-1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>€{totalSharedBenefit.toFixed(1)}M</span>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--grey-2)', fontStyle: 'italic' }}>Requires cost bases</span>
                  )}
                </div>
              </SectionCard>

              {/* ── 03 Speed / Compression ── */}
              <SectionCard
                number="03"
                title="Speed / Transformation Compression"
                subtitle="How much faster could integrated design deliver value compared to running programs separately?"
              >
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
                    <div style={{ marginTop: 8, padding: '10px 14px', background: '#E6F6F7', borderRadius: 6, fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>
                      Integrated delivery completes {compressionMonths} months earlier — accelerating value realization and reducing cost.
                    </div>
                  )}
                </div>

                {/* Timeline visualization */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grey-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                    Delivery Timeline
                  </div>
                  <TimelineViz selectedPrograms={selectedPrograms} compressionMonths={compressionMonths} />
                </div>

                {/* Timing engine outputs */}
                <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--grey-0)', borderLeft: '3px solid var(--blue)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 10 }}>
                    Value Start Dates
                  </div>
                  <TimingRow label="Separate delivery ends" value={engine.separateValueStartLabel} />
                  <TimingRow label="Integrated delivery ends" value={engine.integratedValueStartLabel} />
                  {engine.valueAccelerated2030.status === 'CALCULATED' && engine.valueAccelerated2030.value !== null && engine.valueAccelerated2030.value > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--grey-1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, color: 'var(--grey-3)' }}>Value accelerated by 2030</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>+€{engine.valueAccelerated2030.value.toFixed(1)}M</span>
                      </div>
                      <CalcDrawer result={engine.valueAccelerated2030} label="Value Acceleration (by 2030)" />
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* ── 04 Financial Baselines ── */}
              <SectionCard
                number="04"
                title="Financial Baselines"
                subtitle="Enter FME financial data to enable value engine outputs. All values are stored in your browser only."
              >
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
                  onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'costPerTreatmentEur', value: v })}
                />
                <AssumptionInput
                  label="Current No-Show Rate"
                  assumption={financialBaselines.currentNoShowRatePct}
                  unit="%"
                  placeholder="Enter FME value"
                  onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'currentNoShowRatePct', value: v })}
                />
                <AssumptionInput
                  label="Annual Supply / Consumable Cost Base"
                  assumption={(financialBaselines as any).supplyConsumableCostBaseEurM ?? { value: null, source: 'unknown' }}
                  unit="€M"
                  placeholder="Enter FME value"
                  description="Required for supply waste reduction calculation"
                  onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'supplyConsumableCostBaseEurM', value: v })}
                />
                <AssumptionInput
                  label="Value per Incremental Treatment"
                  assumption={(financialBaselines as any).valuePerIncrementalTreatmentEur ?? { value: null, source: 'unknown' }}
                  unit="€"
                  placeholder="Enter FME value"
                  description="Required for patient volume uplift value calculation"
                  onChange={(v) => dispatch({ type: 'SET_FINANCIAL', field: 'valuePerIncrementalTreatmentEur', value: v })}
                />
                <AssumptionSlider
                  label="Ramp to Full Value"
                  assumption={(timing as any).rampToFullValueMonths ?? { value: 24, source: 'accenture-estimate', baseValue: 24, originalSource: 'accenture-estimate' }}
                  min={6} max={48} step={3}
                  formatValue={(v) => `${v} months`}
                  minLabel="6 months" maxLabel="48 months"
                  onChange={(v) => dispatch({ type: 'SET_RAMP_MONTHS', value: v })}
                />
                <p style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5 }}>
                  Time from go-live to full run-rate value.
                </p>
              </SectionCard>
            </>
          )}

        </div>

        {/* ── RIGHT: Live Preview ───────────────────────────────────────────── */}
        <LivePreview />

      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
  sublabel,
  badge,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sublabel: string | null;
  badge: number | null;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
        padding: '12px 18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        fontFamily: 'Inter, sans-serif',
        marginBottom: -2,
        flexShrink: 0,
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? color : 'var(--grey-3)' }}>{label}</span>
        {badge !== null && badge > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, background: color, color: 'white', padding: '1px 5px', borderRadius: 99 }}>{badge}</span>
        )}
      </div>
      {sublabel && (
        <span style={{ fontSize: 10, color: 'var(--grey-2)', textTransform: 'capitalize' }}>{sublabel}</span>
      )}
    </button>
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
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid var(--grey-1)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--grey-1)', background: 'var(--grey-0)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', fontFamily: 'Inter, sans-serif' }}>{number}</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Inter, sans-serif' }}>{title}</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
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

// ─── XLS Value Driver Section ─────────────────────────────────────────────────

function XlsValueDriverSection({
  programId,
  programName,
  inputs,
  standaloneValue,
  onChangeInput,
}: {
  programId: string;
  programName: string;
  inputs: ProgramValueInputs;
  standaloneValue: CalculationResult | null;
  onChangeInput: (field: keyof ProgramValueInputs, value: number | null) => void;
}) {
  const inp = (field: keyof ProgramValueInputs): Assumption<number> =>
    (inputs[field] as Assumption<number> | undefined) ?? emptyInput();

  if (programId === 'ehr-patient-care') {
    return (
      <SectionCard
        number="D"
        title="Workforce Value Drivers (XLS)"
        subtitle="Bottom-up operational inputs sourced from the FME Initiative KPI mapping workbook. Pre-filled with XLS illustrative values — replace with FME actuals."
      >
        <XlsSourceBadge />

        <SubSection title="Overtime Reduction">
          <AssumptionInput label="Annual Overtime Hours" assumption={inp('ehrAnnualOtHours')} placeholder="5,366,418" onChange={(v) => onChangeInput('ehrAnnualOtHours', v)} />
          <AssumptionInput label="% Addressable by EHR" assumption={inp('ehrOtAddressablePct')} unit="%" placeholder="20" onChange={(v) => onChangeInput('ehrOtAddressablePct', v)} />
          <AssumptionInput label="Improvement %" assumption={inp('ehrOtImprovementPct')} unit="%" placeholder="20" onChange={(v) => onChangeInput('ehrOtImprovementPct', v)} />
          <AssumptionInput label="Nurse Share of OT Hours" assumption={inp('ehrOtNursePct')} unit="%" placeholder="43" onChange={(v) => onChangeInput('ehrOtNursePct', v)} />
          <AssumptionInput label="Nurse Avg Hourly Rate" assumption={inp('ehrOtNurseRateEur')} unit="€/hr" placeholder="44" onChange={(v) => onChangeInput('ehrOtNurseRateEur', v)} />
          <AssumptionInput label="PCT Avg Hourly Rate" assumption={inp('ehrOtPctRateEur')} unit="€/hr" placeholder="28" onChange={(v) => onChangeInput('ehrOtPctRateEur', v)} />
          <AssumptionInput label="OT Premium" assumption={inp('ehrOtPremiumPct')} unit="%" placeholder="50" onChange={(v) => onChangeInput('ehrOtPremiumPct', v)} />
        </SubSection>

        <SubSection title="Turnover — Hiring & Deployment">
          <AssumptionInput label="Annual Turnover Cost Base" assumption={inp('ehrTurnoverCostBaseEurM')} unit="€M" placeholder="90" onChange={(v) => onChangeInput('ehrTurnoverCostBaseEurM', v)} />
          <AssumptionInput label="Turnover Improvement %" assumption={inp('ehrTurnoverImprovementPct')} unit="%" placeholder="10" onChange={(v) => onChangeInput('ehrTurnoverImprovementPct', v)} />
        </SubSection>

        <SubSection title="Backfill Hours">
          <AssumptionInput label="Annual Backfill Hours" assumption={inp('ehrBackfillHoursBase')} placeholder="1,732,667" onChange={(v) => onChangeInput('ehrBackfillHoursBase', v)} />
          <AssumptionInput label="% Addressable by EHR" assumption={inp('ehrBackfillAddressablePct')} unit="%" placeholder="50" onChange={(v) => onChangeInput('ehrBackfillAddressablePct', v)} />
          <AssumptionInput label="Improvement %" assumption={inp('ehrBackfillImprovementPct')} unit="%" placeholder="10" onChange={(v) => onChangeInput('ehrBackfillImprovementPct', v)} />
          <AssumptionInput label="Avg Incremental Backfill Rate" assumption={inp('ehrBackfillAvgRateEur')} unit="€/hr" placeholder="7" onChange={(v) => onChangeInput('ehrBackfillAvgRateEur', v)} />
        </SubSection>

        <StandaloneValueResult result={standaloneValue} programName={programName} />
      </SectionCard>
    );
  }

  if (programId === 'supply-chain') {
    return (
      <SectionCard
        number="D"
        title="Supply Chain Value Drivers (XLS)"
        subtitle="Operational inputs for supply chain standalone value calculation. Enter FME actuals to enable bottom-up value modeling."
      >
        <XlsSourceBadge />
        <SubSection title="Inventory Optimization">
          <AssumptionInput label="Inventory Carrying Cost Base" assumption={inp('scInventoryCostBaseEurM')} unit="€M" placeholder="Enter FME value" onChange={(v) => onChangeInput('scInventoryCostBaseEurM', v)} />
          <AssumptionInput label="DIO Improvement %" assumption={inp('scDioImprovementPct')} unit="%" placeholder="Enter % reduction" onChange={(v) => onChangeInput('scDioImprovementPct', v)} />
        </SubSection>
        <SubSection title="Maverick Spend Reduction">
          <AssumptionInput label="Maverick Spend Cost Base" assumption={inp('scMaverickSpendBaseEurM')} unit="€M" placeholder="Enter FME value" onChange={(v) => onChangeInput('scMaverickSpendBaseEurM', v)} />
          <AssumptionInput label="Maverick Spend Reduction %" assumption={inp('scMaverickReductionPct')} unit="%" placeholder="Enter %" onChange={(v) => onChangeInput('scMaverickReductionPct', v)} />
        </SubSection>
        <StandaloneValueResult result={standaloneValue} programName={programName} />
      </SectionCard>
    );
  }

  if (programId === 'esphora-cd') {
    return (
      <SectionCard
        number="D"
        title="Finance Value Drivers (XLS)"
        subtitle="S/4HANA finance operational inputs for standalone value calculation. Enter FME actuals to enable modeling."
      >
        <XlsSourceBadge />
        <SubSection title="Finance FTE Productivity">
          <AssumptionInput label="Finance FTE Annual Cost Base" assumption={inp('espFinanceFteCostBaseEurM')} unit="€M" placeholder="Enter FME value" onChange={(v) => onChangeInput('espFinanceFteCostBaseEurM', v)} />
          <AssumptionInput label="FTE Productivity Improvement %" assumption={inp('espFteImprovementPct')} unit="%" placeholder="Enter %" onChange={(v) => onChangeInput('espFteImprovementPct', v)} />
        </SubSection>
        <SubSection title="DSO Working Capital Release">
          <AssumptionInput label="Revenue Base" assumption={inp('espRevenueBaseEurM')} unit="€M" placeholder="Enter FME value" onChange={(v) => onChangeInput('espRevenueBaseEurM', v)} />
          <AssumptionInput label="DSO Baseline (Days)" assumption={inp('espDsoBaselineDays')} unit="Days" placeholder="Enter FME value" onChange={(v) => onChangeInput('espDsoBaselineDays', v)} />
          <AssumptionInput label="DSO Improvement %" assumption={inp('espDsoImprovementPct')} unit="%" placeholder="Enter %" onChange={(v) => onChangeInput('espDsoImprovementPct', v)} />
        </SubSection>
        <StandaloneValueResult result={standaloneValue} programName={programName} />
      </SectionCard>
    );
  }

  if (programId === 'gemini') {
    return (
      <SectionCard
        number="D"
        title="Manufacturing Value Drivers (XLS)"
        subtitle="CE ERP + MES operational inputs for standalone value calculation. Enter FME actuals to enable modeling."
      >
        <XlsSourceBadge />
        <SubSection title="Production Cost Improvement">
          <AssumptionInput label="Manufacturing Cost Base" assumption={inp('gemManufacturingCostBaseEurM')} unit="€M" placeholder="Enter FME value" onChange={(v) => onChangeInput('gemManufacturingCostBaseEurM', v)} />
          <AssumptionInput label="Production Cost Improvement %" assumption={inp('gemProductionCostImprovementPct')} unit="%" placeholder="Enter %" onChange={(v) => onChangeInput('gemProductionCostImprovementPct', v)} />
        </SubSection>
        <SubSection title="Scrap Reduction">
          <AssumptionInput label="Scrap Rate Baseline" assumption={inp('gemScrapRateBaselinePct')} unit="%" placeholder="Enter %" onChange={(v) => onChangeInput('gemScrapRateBaselinePct', v)} />
          <AssumptionInput label="Scrap Rate Target" assumption={inp('gemScrapRateTargetPct')} unit="%" placeholder="Enter %" onChange={(v) => onChangeInput('gemScrapRateTargetPct', v)} />
        </SubSection>
        <StandaloneValueResult result={standaloneValue} programName={programName} />
      </SectionCard>
    );
  }

  return null;
}

function XlsSourceBadge() {
  return (
    <div style={{ marginBottom: 16, padding: '8px 12px', background: '#EBF4FF', borderLeft: '3px solid var(--blue)', fontSize: 11, color: 'var(--navy)', lineHeight: 1.5 }}>
      <strong>Source: FME Initiative KPI mapping workbook.</strong> Values pre-filled with XLS illustrative starting points. Replace with FME actuals for a validated model.
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--grey-1)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StandaloneValueResult({ result, programName }: { result: CalculationResult | null; programName: string }) {
  if (!result) return null;
  const isCalc = result.status === 'CALCULATED' || result.status === 'PARTIAL';
  return (
    <div style={{ marginTop: 4, padding: '14px 16px', background: isCalc ? '#E6F6F7' : 'var(--grey-0)', borderLeft: `3px solid ${isCalc ? 'var(--teal)' : 'var(--grey-1)'}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isCalc ? 'var(--teal)' : 'var(--grey-2)', marginBottom: 6 }}>
        {programName} — Standalone Value (XLS Model)
      </div>
      {isCalc && result.value !== null ? (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>
            €{result.value.toFixed(1)}M/yr
            {result.status === 'PARTIAL' && (
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--grey-2)', marginLeft: 8 }}>PARTIAL</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--grey-3)', marginTop: 4 }}>{result.calculationDescription}</div>
          {result.inputs && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {Object.entries(result.inputs).map(([k, v]) =>
                v !== null ? (
                  <div key={k} style={{ fontSize: 10, color: 'var(--grey-3)' }}>
                    {k}: <strong style={{ color: 'var(--navy)' }}>€{(v as number).toFixed(1)}M</strong>
                  </div>
                ) : null
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>
          {result.requiredInputs.length > 0
            ? `Missing: ${result.requiredInputs.slice(0, 3).join(', ')}`
            : 'Enter value drivers above to calculate'}
        </div>
      )}
      <CalcDrawer result={result} label={`${programName} Standalone Value`} />
    </div>
  );
}
