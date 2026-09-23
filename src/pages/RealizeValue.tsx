import React, { useMemo } from 'react';
import { useScenario } from '../state/ScenarioContext';
import { useEngineOutput } from '../engine/useEngine';
import { PROGRAMS } from '../data/programs';
import { Scenario } from '../types';
import { ScenarioEngineOutput } from '../engine/types';
import ValueCurveChart from '../components/value/ValueCurveChart';

// ─── BEO Capability Relevance ─────────────────────────────────────────────────

interface BeoCapability {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  criticalReason: string | null;
}

function buildBeoCapabilities(
  scenario: Scenario,
  engine: ScenarioEngineOutput
): BeoCapability[] {
  const sp = scenario.selectedPrograms;
  const compression = scenario.timing.compressionMonths.value ?? 0;
  const changeSharedPct = scenario.sharedCosts.changeManagement.sharedPct.value ?? 0;
  const dataSharedPct = scenario.sharedCosts.dataIntegration.sharedPct.value ?? 0;
  const volumeUplift = scenario.businessOutcomes.patientVolumeUpliftPct.value ?? 0;
  const hasEHR = sp.includes('ehr-patient-care');
  const hasSupply = sp.includes('supply-chain');
  const hasGEMINI = sp.includes('gemini');

  return [
    {
      id: 'enterprise-case',
      title: 'One Enterprise Business Case',
      description:
        "Value managed across all selected programs against enterprise outcomes rather than isolated per-program business cases. Each program's contribution is tracked to the same set of enterprise KPIs.",
      critical: true,
      criticalReason:
        `Martin's scenario targets enterprise-level outcomes across ${sp.length} program${sp.length !== 1 ? 's' : ''} — a single enterprise business case prevents each program team from optimizing locally at the expense of the combined result.`,
    },
    {
      id: 'sequencing',
      title: 'One Sequencing Engine',
      description:
        'Dependencies, design decisions, and delivery timing managed across the integrated transformation. Enables cross-program trade-offs to be resolved without disrupting individual program delivery.',
      critical: compression >= 6,
      criticalReason:
        compression >= 6
          ? `Martin assumes ${compression} months of delivery compression — this level of acceleration requires integrated sequencing to coordinate cross-program dependencies and avoid rework.`
          : null,
    },
    {
      id: 'change',
      title: 'One Change Agenda',
      description:
        'The same workforce experiences coordinated transformation rather than overlapping, program-by-program change waves. Avoids change fatigue and enables shared communication, training, and adoption resources.',
      critical: changeSharedPct >= 35,
      criticalReason:
        changeSharedPct >= 35
          ? `Martin assumes ${changeSharedPct}% of change management cost is shared — this requires a coordinated change agenda that treats the workforce as one population across programs.`
          : null,
    },
    {
      id: 'data',
      title: 'One Data & Integration Architecture',
      description:
        'Shared data, integration, and technology decisions made once with visibility across all programs. Eliminates duplicate integration work and creates a reusable foundation for future digital capability.',
      critical: (hasEHR && hasSupply) || dataSharedPct >= 30,
      criticalReason:
        hasEHR && hasSupply
          ? 'EHR and Supply Chain integration requires patient-demand signals to connect into supply planning — a shared data architecture enables this in real time.'
          : dataSharedPct >= 30
            ? `Martin assumes ${dataSharedPct}% of data integration cost is shared — this only holds if integration architecture is designed once across programs.`
            : null,
    },
    {
      id: 'value-cadence',
      title: 'One Value-Realization Cadence',
      description:
        "Business KPI uplift, shared-cost benefit, and value acceleration tracked against Martin's scenario assumptions on a common cadence. Connects operational metrics to the financial model.",
      critical: volumeUplift >= 3 || engine.totalAnnualBusinessValue.value !== null,
      criticalReason:
        volumeUplift >= 3
          ? `Martin assumes +${volumeUplift}% patient volume — the Value-Realization Cadence tracks whether workflow adoption is actually creating the expected patient-access improvement.`
          : engine.totalAnnualBusinessValue.value !== null
            ? 'With a modeled annual value in place, a structured realization cadence is needed to confirm assumptions are translating into actual outcomes.'
            : null,
    },
  ];
}

// ─── Cross-Program Dependencies ───────────────────────────────────────────────

function buildCrossProgramDependencies(scenario: Scenario): string[] {
  const sp = scenario.selectedPrograms;
  const deps: string[] = [];

  if (sp.includes('ehr-patient-care') && sp.includes('supply-chain')) {
    deps.push('EHR → Supply Chain: Clinical scheduling and treatment demand signals connect directly into supply procurement and inventory positioning.');
  }
  if (sp.includes('ehr-patient-care') && sp.includes('esphora-cd')) {
    deps.push('EHR → ESPHORA / CD: A shared patient data layer eliminates duplicate clinical data architecture and accelerates both programs.');
  }
  if (sp.includes('gemini') && sp.length > 1) {
    deps.push('GEMINI → All Programs: Integrated from the start, GEMINI becomes the shared intelligence layer — eliminating program-level shadow reporting built and then discarded by each stream.');
  }
  if (sp.includes('supply-chain') && sp.includes('esphora-cd')) {
    deps.push('Supply Chain → ESPHORA / CD: Clinical trial supply requirements connect into the broader supply chain, reducing separate procurement infrastructure.');
  }
  if (sp.length === 4) {
    deps.push('Full Integration: All four programs share a common data foundation, change management program, and governance structure — maximizing the integration advantage across every dimension.');
  }

  return deps;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RealizeValue() {
  const { activeScenario } = useScenario();
  const engine = useEngineOutput(activeScenario);
  const sp = activeScenario.selectedPrograms;

  const selectedProgramNames = useMemo(
    () => PROGRAMS.filter((p) => sp.includes(p.id)).map((p) => p.shortName),
    [sp]
  );

  const beoCapabilities = useMemo(
    () => buildBeoCapabilities(activeScenario, engine),
    [activeScenario, engine]
  );

  const crossProgramDeps = useMemo(
    () => buildCrossProgramDependencies(activeScenario),
    [activeScenario]
  );

  const valueCurves = useMemo(
    () => [
      {
        label: activeScenario.metadata.name,
        points: engine.valueCurve,
        colorIndex: 0 as const,
      },
    ],
    [activeScenario.metadata.name, engine.valueCurve]
  );

  const compressionMonths = activeScenario.timing.compressionMonths.value ?? 0;

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
          05 — Realize the Value
        </div>
        <h1 style={{ fontFamily: 'Source Serif 4, serif', fontSize: 30, fontWeight: 600, color: 'var(--navy)', marginBottom: 12, lineHeight: 1.15 }}>
          What FME must orchestrate to capture it
        </h1>
        <div
          style={{
            background: 'var(--navy)',
            display: 'inline-flex',
            padding: '10px 18px',
            gap: 8,
            alignItems: 'center',
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            Active Scenario:
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
            {activeScenario.metadata.name}
          </span>
          {selectedProgramNames.length > 0 && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                Integrating: {selectedProgramNames.join(' + ')}
              </span>
            </>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--grey-3)', lineHeight: 1.65, maxWidth: 640, marginTop: 12 }}>
          Integrated design creates the economic opportunity. Capturing it requires a coordinated
          execution model. This view connects Martin's scenario assumptions to the organizational
          capabilities needed to make them real.
        </p>
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

      {/* ── Cross-Program Dependencies ── */}
      {crossProgramDeps.length > 0 && (
        <>
          <SectionLabel>Cross-Program Integration Dependencies</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 2, marginBottom: 32 }}>
            {crossProgramDeps.map((dep, i) => {
              const [heading, ...rest] = dep.split(': ');
              return (
                <div key={i} style={{ background: 'white', padding: '18px 22px', borderLeft: '3px solid var(--blue)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{heading}</div>
                  <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.6 }}>{rest.join(': ')}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Business Execution Office ── */}
      <SectionLabel>The Business Execution Office</SectionLabel>
      <div
        style={{
          background: 'var(--navy)',
          padding: '28px 32px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontFamily: 'Source Serif 4, serif', fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 10 }}>
          The execution mechanism behind Martin's scenario
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 680 }}>
          The Business Execution Office is not a PMO, a reporting layer, or another governance
          overhead. It is the connective model that makes integrated delivery possible — and
          ensures that the economic advantage Martin has modeled actually flows to the enterprise.
        </p>
      </div>

      {/* BEO Capabilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 40 }}>
        {beoCapabilities.map((cap) => (
          <div
            key={cap.id}
            style={{
              background: 'white',
              display: 'grid',
              gridTemplateColumns: cap.critical ? '3px 1fr auto' : '3px 1fr',
              borderLeft: `3px solid ${cap.critical ? 'var(--teal)' : 'var(--grey-1)'}`,
              padding: '20px 24px',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: cap.critical && cap.criticalReason ? '1fr auto' : '1fr', gap: 20, alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{cap.title}</div>
                  {cap.critical && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        background: 'rgba(0,153,168,0.12)',
                        color: 'var(--teal)',
                        padding: '2px 7px',
                        borderRadius: 2,
                      }}
                    >
                      Critical for this scenario
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.65, maxWidth: 520 }}>{cap.description}</div>
              </div>
              {cap.critical && cap.criticalReason && (
                <div
                  style={{
                    background: '#F0FDFA',
                    border: '1px solid #99F6E4',
                    borderLeft: '3px solid var(--teal)',
                    padding: '12px 16px',
                    fontSize: 12,
                    color: 'var(--navy)',
                    lineHeight: 1.6,
                    maxWidth: 340,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 5 }}>
                    Why it matters here
                  </div>
                  {cap.criticalReason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Closing Statement ── */}
      <div
        style={{
          background: 'var(--navy)',
          padding: '36px 48px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Source Serif 4, serif',
            fontSize: 'clamp(18px, 2.5vw, 26px)',
            fontWeight: 300,
            color: 'white',
            lineHeight: 1.45,
            letterSpacing: '0.01em',
          }}
        >
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
