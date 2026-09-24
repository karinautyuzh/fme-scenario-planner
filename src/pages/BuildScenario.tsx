import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenario } from '../state/ScenarioContext';
import { OUTCOMES } from '../data/outcomes';
import { ProgramLibraryEntry } from '../types';

const PALETTE = [
  { bg: '#EBF4FF', border: '#0066B3', accent: '#0066B3' },
  { bg: '#E6F6F7', border: '#0099A8', accent: '#0099A8' },
  { bg: '#F5F3FF', border: '#7C3AED', accent: '#7C3AED' },
  { bg: '#FFF7ED', border: '#D97706', accent: '#D97706' },
  { bg: '#F0FDF4', border: '#16A34A', accent: '#16A34A' },
  { bg: '#FFF1F2', border: '#E11D48', accent: '#E11D48' },
];

function getPaletteEntry(id: string, index: number) {
  // Use deterministic color based on index in library
  return PALETTE[index % PALETTE.length];
}

export default function BuildScenario() {
  const { activeScenario, state, dispatch } = useScenario();
  const navigate = useNavigate();
  const { selectedPrograms } = activeScenario;
  const library = state.programLibrary;

  const integratedPrograms = library.filter((p) => selectedPrograms.includes(p.id));
  const separatePrograms = library.filter((p) => !selectedPrograms.includes(p.id));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow">03 — Build Your Scenario</div>
        <h1 className="section-heading">
          Which programs do you want to bring under one integrated design?
        </h1>
        <p className="section-sub">
          Select the programs to include in this scenario. Programs under integrated design share
          governance, change management, and data architecture — generating value that would not
          exist if they ran separately.
        </p>
      </div>

      {/* Integrated Design Zone */}
      <div style={{ marginBottom: 28 }}>
        <ZoneHeader
          label="Integrated Design"
          sublabel="These programs share a unified delivery engine"
          color="var(--blue)"
          count={integratedPrograms.length}
        />

        <div
          style={{
            border: '2px solid var(--blue)',
            borderRadius: 10,
            padding: 16,
            background: '#F5F9FF',
            minHeight: 120,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
          }}
        >
          {integratedPrograms.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--grey-2)',
                fontSize: 13,
                fontStyle: 'italic',
                minHeight: 80,
              }}
            >
              Select programs below to include them in the integrated design
            </div>
          ) : (
            integratedPrograms.map((p, i) => (
              <ProgramCard
                key={p.id}
                program={p}
                selected
                colorEntry={getPaletteEntry(p.id, library.findIndex((lp) => lp.id === p.id))}
                onToggle={() => dispatch({ type: 'TOGGLE_PROGRAM', programId: p.id })}
              />
            ))
          )}
        </div>
      </div>

      {/* Separate Programs Zone */}
      {separatePrograms.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <ZoneHeader
            label="Programs Running Separately"
            sublabel="Click any card to add it to the integrated design"
            color="var(--grey-2)"
            count={separatePrograms.length}
          />

          <div
            style={{
              border: '1.5px dashed var(--grey-1)',
              borderRadius: 10,
              padding: 16,
              background: 'white',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {separatePrograms.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                selected={false}
                colorEntry={getPaletteEntry(p.id, library.findIndex((lp) => lp.id === p.id))}
                onToggle={() => dispatch({ type: 'TOGGLE_PROGRAM', programId: p.id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Outcome Mapping */}
      {selectedPrograms.length > 0 && (
        <div>
          <div className="eyebrow">Enterprise Outcomes Addressed</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OUTCOMES.map((outcome) => {
              const contributing = integratedPrograms.filter((p) =>
                (p.outcomes as string[]).includes(outcome.id)
              );
              const covered = contributing.length > 0;
              return (
                <div
                  key={outcome.id}
                  style={{
                    padding: '16px 20px',
                    background: 'white',
                    borderLeft: `3px solid ${covered ? 'var(--teal)' : 'var(--grey-1)'}`,
                    borderRadius: '0 8px 8px 0',
                    opacity: covered ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: covered ? 'var(--navy)' : 'var(--grey-3)', marginBottom: 3 }}>
                        {outcome.label} {outcome.sublabel}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.5 }}>
                        {outcome.description}
                      </div>
                    </div>
                    {covered && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {contributing.map((p, pi) => {
                          const colors = getPaletteEntry(p.id, library.findIndex((lp) => lp.id === p.id));
                          return (
                            <span
                              key={p.id}
                              style={{
                                padding: '3px 8px',
                                background: colors.bg,
                                color: colors.accent,
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 4,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.shortName || p.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation hint */}
          <div style={{ marginTop: 32, padding: '16px 20px', background: '#E6F6F7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>Ready to pressure-test your scenario?</div>
              <div style={{ fontSize: 12, color: 'var(--grey-3)', marginTop: 2 }}>
                Set program-level assumptions, shared cost percentages, and timeline compression.
              </div>
            </div>
            <button
              onClick={() => navigate('/pressure-test')}
              style={{
                padding: '8px 20px',
                background: 'var(--teal)',
                border: 'none',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                borderRadius: 6,
                whiteSpace: 'nowrap',
              }}
            >
              Pressure-Test →
            </button>
          </div>
        </div>
      )}

      {/* If library is empty, prompt to add programs */}
      {library.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--grey-3)', marginBottom: 16, lineHeight: 1.6 }}>
            No programs in your library yet. Define your programs in Program Intake first, then return here to build your scenario.
          </div>
          <button
            onClick={() => navigate('/intake')}
            style={{ background: 'var(--blue)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, padding: '10px 22px', cursor: 'pointer', borderRadius: 4, fontFamily: 'Inter, sans-serif' }}
          >
            Go to Program Intake →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Zone Header ──────────────────────────────────────────────────────────────

function ZoneHeader({
  label,
  sublabel,
  color,
  count,
}: {
  label: string;
  sublabel: string;
  color: string;
  count: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--grey-2)' }}>{sublabel}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--grey-1)', alignSelf: 'center' }} />
      <span
        style={{
          background: color,
          color: 'white',
          fontSize: 10,
          fontWeight: 700,
          padding: '1px 8px',
          borderRadius: 99,
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  selected,
  colorEntry,
  onToggle,
}: {
  program: ProgramLibraryEntry;
  selected: boolean;
  colorEntry: { bg: string; border: string; accent: string };
  onToggle: () => void;
}) {
  const colors = colorEntry;
  const activeKpis = program.kpis.filter((k) => k.isActive).length;

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      style={{
        background: selected ? colors.bg : 'white',
        border: `2px solid ${selected ? colors.border : 'var(--grey-1)'}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: selected ? colors.accent : 'var(--ink)',
              marginBottom: 2,
            }}
          >
            {program.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--grey-2)' }}>
            {program.defaultTimeline.durationMonths}mo · {activeKpis} KPI{activeKpis !== 1 ? 's' : ''}
          </div>
        </div>
        <div
          style={{
            width: 20,
            height: 20,
            border: `2px solid ${selected ? colors.border : 'var(--grey-1)'}`,
            borderRadius: '50%',
            background: selected ? colors.border : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
            transition: 'all 0.15s',
          }}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--grey-3)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {program.description || <span style={{ fontStyle: 'italic' }}>No description yet</span>}
      </p>

      {/* Outcome tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(program.outcomes as string[]).map((oid) => {
          const o = OUTCOMES.find((out) => out.id === oid);
          if (!o) return null;
          return (
            <span
              key={oid}
              style={{
                padding: '2px 7px',
                background: selected ? 'rgba(255,255,255,0.7)' : 'var(--grey-0)',
                color: selected ? colors.accent : 'var(--grey-3)',
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 4,
              }}
            >
              {o.label}
            </span>
          );
        })}
      </div>

      {/* Program context (shown when selected) */}
      {selected && program.description && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.8)',
            borderLeft: `2px solid ${colors.border}`,
            fontSize: 11,
            color: 'var(--grey-3)',
            lineHeight: 1.5,
            borderRadius: '0 4px 4px 0',
          }}
        >
          {program.additionalContext || program.description}
        </div>
      )}
    </div>
  );
}
