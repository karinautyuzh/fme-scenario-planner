import React from 'react';
import { useScenario } from '../../state/ScenarioContext';
import { PROGRAMS } from '../../data/programs';
import { useEngineOutput } from '../../engine/useEngine';
import { CalculationResult } from '../../engine/types';

export default function LivePreview() {
  const { activeScenario } = useScenario();
  const { businessOutcomes: bo, timing, selectedPrograms, metadata } = activeScenario;
  const engine = useEngineOutput(activeScenario);

  const selectedProgramNames = PROGRAMS.filter((p) => selectedPrograms.includes(p.id));
  const compressionMonths = timing.compressionMonths.value ?? 0;

  return (
    <div
      style={{
        position: 'sticky',
        top: 160,
        background: 'var(--navy)',
        borderRadius: 12,
        padding: '20px 20px 24px',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
          Live Scenario Preview
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
          {metadata.name}
        </div>
        {activeScenario.isBaseCaseLocked && (
          <div style={{ fontSize: 11, color: '#0099A8', marginTop: 2 }}>
            Any change creates a new scenario
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Programs */}
        <PreviewSection title="Programs">
          {selectedProgramNames.length === 0 ? (
            <MissingNote>No programs selected</MissingNote>
          ) : selectedProgramNames.length === PROGRAMS.length ? (
            <PreviewValue>All 4 programs — full integration</PreviewValue>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {selectedProgramNames.map((p) => (
                <PreviewValue key={p.id}>{p.shortName}</PreviewValue>
              ))}
            </div>
          )}
        </PreviewSection>

        {/* Business Outcomes Assumptions */}
        <PreviewSection title="Business Outcome Levers">
          <PreviewRow label="Volume Uplift" value={bo.patientVolumeUpliftPct.value} format={(v) => `+${v}%`} />
          <PreviewRow label="Cost Reduction" value={bo.costPerTreatmentImprovementPct.value} format={(v) => `-${v}%`} />
          <PreviewRow label="Waste Reduction" value={bo.supplyWasteReductionPct.value} format={(v) => `-${v}%`} />
          <PreviewRow label="Value Capture" value={bo.overallValueCapturePct.value} format={(v) => `${v}%`} />
        </PreviewSection>

        {/* Calculated Annual Value */}
        <PreviewSection title="Modeled Annual Value">
          <EngineValueRow result={engine.totalAnnualBusinessValue} label="Total Annual Business Value" />
          <EngineValueRow result={engine.potentialAnnualCostBenefit} label="Cost Benefit" small />
          <EngineValueRow result={engine.potentialAnnualWasteBenefit} label="Supply Waste Benefit" small />
        </PreviewSection>

        {/* Shared Cost */}
        <PreviewSection title="Shared Cost Benefit">
          <EngineValueRow result={engine.totalSharedCostBenefit} label="Shared Cost Savings" />
          {engine.sharedCostCoverage.calculated < engine.sharedCostCoverage.total && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {engine.sharedCostCoverage.calculated}/{engine.sharedCostCoverage.total} cost bases entered
            </div>
          )}
        </PreviewSection>

        {/* Timeline */}
        <PreviewSection title="Timeline">
          {compressionMonths > 0 ? (
            <>
              <PreviewValue>{compressionMonths} months compression</PreviewValue>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                Integrated ends: {engine.integratedValueStartLabel} · Separate: {engine.separateValueStartLabel}
              </div>
            </>
          ) : (
            <MissingNote>No compression set</MissingNote>
          )}
        </PreviewSection>

        {/* Value Acceleration */}
        {engine.valueAccelerated2030.status !== 'NOT_APPLICABLE' && (
          <PreviewSection title="Value Accelerated (by 2030)">
            <EngineValueRow result={engine.valueAccelerated2030} label="Acceleration advantage" accent />
          </PreviewSection>
        )}

      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PreviewRow({
  label,
  value,
  format,
}: {
  label: string;
  value: number | null;
  format: (v: number) => string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      {value !== null ? (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{format(value)}</span>
      ) : (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>not set</span>
      )}
    </div>
  );
}

function EngineValueRow({
  result,
  label,
  small = false,
  accent = false,
}: {
  result: CalculationResult;
  label: string;
  small?: boolean;
  accent?: boolean;
}) {
  if (result.status === 'NOT_APPLICABLE') return null;

  const isCalc = result.status === 'CALCULATED' || result.status === 'PARTIAL';
  const valueColor = accent ? '#4FFFCB' : 'white';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: small ? 3 : 5 }}>
      <span style={{ fontSize: small ? 11 : 12, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
      {isCalc && result.value !== null ? (
        <span style={{ fontSize: small ? 12 : 16, fontWeight: 700, color: valueColor }}>
          €{result.value.toFixed(1)}M{result.status === 'PARTIAL' ? '+' : ''}
          {!small && <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}>/yr</span>}
        </span>
      ) : (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
          {result.requiredInputs.length > 0 ? 'Needs inputs' : '—'}
        </span>
      )}
    </div>
  );
}

function PreviewValue({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: 'white', ...style }}>
      {children}
    </div>
  );
}

function MissingNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
      {children}
    </div>
  );
}
