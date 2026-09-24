import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OUTCOMES } from '../data/outcomes';
import { useScenario } from '../state/ScenarioContext';

const OUTCOME_COLORS: Record<string, string> = {
  'grow-patient-volume':         'var(--blue)',
  'reduce-cost-per-treatment':   'var(--teal)',
  'scalable-digital-enterprise': 'var(--navy)',
};

export function ExecutiveOverview() {
  const { activeScenario, state } = useScenario();
  const navigate = useNavigate();
  const library = state.programLibrary;
  const selectedPrograms = activeScenario.selectedPrograms;

  return (
    <div style={{ padding: '40px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div
        style={{
          background: 'var(--navy)',
          padding: '44px 52px',
          marginBottom: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,102,179,0.25))',
            pointerEvents: 'none',
          }}
        />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 14 }}>
          01 — Executive Overview
        </div>
        <h1
          style={{
            fontFamily: 'Source Serif 4, serif',
            fontSize: 'clamp(26px, 3.2vw, 44px)',
            fontWeight: 300,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          FME's transformation portfolio.{' '}
          <strong style={{ fontWeight: 600 }}>Modeled as one.</strong>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 560, marginBottom: 32 }}>
          Multiple programs. Three enterprise outcomes. One design question: what changes when you build them together rather than in parallel?
        </p>

        {/* Value hypothesis callout */}
        <div
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderLeft: '4px solid var(--teal)',
            padding: '18px 22px',
            maxWidth: 680,
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8 }}>
            The Value Hypothesis
          </div>
          <p style={{ fontFamily: 'Source Serif 4, serif', fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 1.65, fontWeight: 300, fontStyle: 'italic' }}>
            "Integrated design improves business outcomes{' '}
            <strong style={{ fontWeight: 600, fontStyle: 'normal' }}>and</strong>{' '}
            compresses the transformation — so FME starts realizing those outcomes sooner."
          </p>
        </div>
      </div>

      {/* ── Flow: 4 panels showing the logic ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 32 }}>
        <FlowPanel number="01" color="var(--blue)" title="Three Enterprise Outcomes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OUTCOMES.map((o) => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: OUTCOME_COLORS[o.id], flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.4 }}>
                  {o.label} {o.sublabel && <span style={{ color: 'var(--grey-3)' }}>— {o.sublabel}</span>}
                </span>
              </div>
            ))}
          </div>
        </FlowPanel>

        <FlowPanel number="02" color="var(--teal)" title="Transformation Programs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {library.map((p) => {
              const isActive = selectedPrograms.includes(p.id);
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 1, background: isActive ? 'var(--teal)' : 'var(--grey-1)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: isActive ? 'var(--navy)' : 'var(--grey-2)', fontWeight: isActive ? 600 : 400 }}>
                    {p.shortName || p.name}
                  </span>
                </div>
              );
            })}
          </div>
          {selectedPrograms.length === 0 && (
            <div style={{ fontSize: 10, color: 'var(--grey-2)', fontStyle: 'italic', marginTop: 8 }}>
              No programs selected in current scenario
            </div>
          )}
          <button
            onClick={() => navigate('/intake')}
            style={{ marginTop: 12, background: 'none', border: '1px dashed var(--teal)', color: 'var(--teal)', fontSize: 10, fontWeight: 600, padding: '5px 10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: 3, width: '100%' }}
          >
            + Add Program
          </button>
        </FlowPanel>

        <FlowPanel number="03" color="var(--navy)" title="Shared Dependencies">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Same organization',
              'Same workforce',
              'Shared data & integration',
              'Overlapping delivery windows',
            ].map((dep) => (
              <div key={dep} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1', flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 12, color: 'var(--grey-3)' }}>{dep}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--grey-1)', fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5 }}>
            These overlaps create both the risk of collision and the opportunity for integration.
          </div>
        </FlowPanel>

        <FlowPanel number="04" color="var(--blue)" title="The Integration Advantage">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Better business outcomes', color: 'var(--blue)' },
              { label: 'Lower / shared transformation cost', color: 'var(--teal)' },
              { label: 'Value realized sooner', color: '#7C3AED' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 28, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 500, lineHeight: 1.35 }}>{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/build')}
            style={{
              marginTop: 16,
              background: 'var(--blue)',
              border: 'none',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em',
              borderRadius: 3,
              width: '100%',
            }}
          >
            Build Your Scenario →
          </button>
        </FlowPanel>
      </div>

      {/* ── Program × Outcome Matrix ── */}
      <SectionLabel>Transformation Portfolio — Program × Outcome Coverage</SectionLabel>
      <div style={{ background: 'white', marginBottom: 32 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(3, 1fr)', background: 'var(--grey-0)', borderBottom: '2px solid var(--grey-1)' }}>
          <div style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--grey-2)' }}>
            Program
          </div>
          {OUTCOMES.map((o) => (
            <div key={o.id} style={{ padding: '12px 16px', borderLeft: '1px solid var(--grey-1)', borderTop: `3px solid ${OUTCOME_COLORS[o.id]}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: OUTCOME_COLORS[o.id], lineHeight: 1.4 }}>
                {o.label}<br />{o.sublabel}
              </div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {library.map((p, idx) => {
          const isSelected = selectedPrograms.includes(p.id);
          return (
            <div
              key={p.id}
              style={{ display: 'grid', gridTemplateColumns: '220px repeat(3, 1fr)', borderBottom: idx < library.length - 1 ? '1px solid var(--grey-1)' : 'none', background: isSelected ? '#FAFCFF' : 'white' }}
            >
              <div style={{ padding: '14px 16px', borderLeft: `3px solid ${isSelected ? 'var(--blue)' : 'var(--grey-1)'}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: isSelected ? 'var(--navy)' : 'var(--grey-3)', marginBottom: 2 }}>
                  {p.name}
                </div>
                {isSelected ? (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)', background: '#DBEAFE', padding: '1px 6px' }}>
                    In Scenario
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--grey-2)', fontStyle: 'italic' }}>Not in scenario</span>
                )}
              </div>
              {OUTCOMES.map((o) => {
                const contributes = (p.outcomes as string[]).includes(o.id);
                return (
                  <div key={o.id} style={{ borderLeft: '1px solid var(--grey-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    {contributes && (
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: OUTCOME_COLORS[o.id], opacity: isSelected ? 1 : 0.3 }} />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Add Program row */}
        <div
          onClick={() => navigate('/intake')}
          style={{ display: 'grid', gridTemplateColumns: '220px 1fr', borderTop: '1px dashed var(--grey-1)', cursor: 'pointer', background: '#FAFAFA' }}
        >
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--blue)', fontSize: 12, fontWeight: 600 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add Program to Portfolio
          </div>
          <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--grey-2)', display: 'flex', alignItems: 'center' }}>
            Define a new program in Program Intake to include it here and in your scenario
          </div>
        </div>
      </div>

      {/* ── Integrated Design and an Integrated Experience ── */}
      <SectionLabel>Integrated Design and an Integrated Experience</SectionLabel>
      <div style={{ background: 'var(--navy)', padding: '32px 40px' }}>
        <p style={{ fontFamily: 'Source Serif 4, serif', fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, maxWidth: 640, marginBottom: 28 }}>
          Multiple transformation programs sharing outcomes and dependencies creates a choice: manage them in parallel — or design them as one. Integrated design produces an integrated experience. And an integrated experience delivers value sooner.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, marginBottom: 24 }}>
          {[
            { label: 'Multiple Programs', sub: 'Shared outcomes, shared dependencies, overlapping change populations' },
            { label: 'Integrated Design', sub: 'One architecture, one change agenda, one enterprise business case' },
            { label: 'Integrated Experience', sub: "One transformation that FME's people and clinicians navigate once" },
            { label: 'Value Realized Sooner', sub: 'Compression, shared cost, and outcome uplift captured together' },
          ].map(({ label, sub }, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderTop: '2px solid var(--teal)', padding: '18px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{sub}</div>
              {i < 3 && <div style={{ fontSize: 16, color: 'var(--teal)', marginTop: 10 }}>→</div>}
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/realize')}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 11, fontWeight: 600, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderRadius: 3 }}
        >
          See Value Realization Scorecard →
        </button>
      </div>

    </div>
  );
}

function FlowPanel({ number, color, title, children }: { number: string; color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderTop: `3px solid ${color}`, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div
          style={{
            width: 24,
            height: 24,
            background: color,
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          {number}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.3 }}>{title}</div>
      </div>
      {children}
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
        marginBottom: 10,
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
