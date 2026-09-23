import React from 'react';
import { ProgramId } from '../../types';
import { PROGRAMS } from '../../data/programs';

interface Props {
  selectedPrograms: ProgramId[];
  compressionMonths: number;
}

const PROGRAM_COLORS: Record<ProgramId, string> = {
  'esphora-cd': '#0066B3',
  'ehr-patient-care': '#0099A8',
  'supply-chain': '#7C3AED',
  'gemini': '#D97706',
};

export default function TimelineViz({ selectedPrograms, compressionMonths }: Props) {
  const allPrograms = PROGRAMS;

  // Compute timeline bounds
  const allEnds = allPrograms.map((p) => p.defaultTimeline.startMonth + p.defaultTimeline.durationMonths);
  const separateEnd = Math.max(...allEnds);
  const integratedEnd = Math.max(separateEnd - compressionMonths, separateEnd * 0.6);
  const displayMonths = separateEnd + 2;

  const pctOf = (months: number) => `${(months / displayMonths) * 100}%`;

  // Month-to-year labels
  const yearLabels: { month: number; label: string }[] = [];
  for (let m = 0; m <= displayMonths; m += 6) {
    const year = 2026 + Math.floor(m / 12);
    const mo = m % 12;
    if (mo === 0) yearLabels.push({ month: m, label: String(year) });
    else if (mo === 6) yearLabels.push({ month: m, label: `Mid ${year}` });
  }

  return (
    <div style={{ marginTop: 20 }}>
      {/* Separate Delivery */}
      <TimelineSection
        label="SEPARATE DELIVERY"
        accent="#888"
        endMonth={separateEnd}
        displayMonths={displayMonths}
        pctOf={pctOf}
        programs={allPrograms}
        selectedPrograms={allPrograms.map((p) => p.id)} // all shown
        compressionFactor={0}
        programColors={PROGRAM_COLORS}
        yearLabels={yearLabels}
      />

      {compressionMonths > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 8px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--grey-1)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              ↑ {compressionMonths} months sooner with integrated design
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--grey-1)' }} />
          </div>

          {/* Integrated Delivery */}
          <TimelineSection
            label="INTEGRATED DELIVERY"
            accent="var(--teal)"
            endMonth={integratedEnd}
            displayMonths={displayMonths}
            pctOf={pctOf}
            programs={allPrograms}
            selectedPrograms={selectedPrograms}
            compressionFactor={compressionMonths / (separateEnd - (separateEnd * 0.6))}
            programColors={PROGRAM_COLORS}
            yearLabels={yearLabels}
          />
        </>
      )}
    </div>
  );
}

interface SectionProps {
  label: string;
  accent: string;
  endMonth: number;
  displayMonths: number;
  pctOf: (m: number) => string;
  programs: typeof PROGRAMS;
  selectedPrograms: ProgramId[];
  compressionFactor: number;
  programColors: Record<ProgramId, string>;
  yearLabels: { month: number; label: string }[];
}

function TimelineSection({
  label,
  accent,
  endMonth,
  displayMonths,
  pctOf,
  programs,
  selectedPrograms,
  compressionFactor,
  programColors,
}: SectionProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, fontFamily: 'Inter, sans-serif' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--grey-1)' }} />
        <span style={{ fontSize: 11, color: 'var(--grey-2)', fontFamily: 'Inter, sans-serif' }}>
          ends month {Math.round(endMonth)}
        </span>
      </div>

      {/* Year axis */}
      <div style={{ position: 'relative', height: 16, marginBottom: 4 }}>
        {[0, 6, 12, 18, 24, 30, 36, 42].filter((m) => m <= displayMonths).map((m) => {
          const year = 2026 + Math.floor(m / 12);
          const mo = m % 12;
          const showLabel = mo === 0;
          return (
            <div
              key={m}
              style={{
                position: 'absolute',
                left: pctOf(m),
                transform: 'translateX(-50%)',
                fontSize: 10,
                color: showLabel ? 'var(--grey-2)' : 'var(--grey-1)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: showLabel ? 600 : 400,
              }}
            >
              {showLabel ? year : '·'}
            </div>
          );
        })}
      </div>

      {/* Program bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {programs.map((prog) => {
          const isSelected = selectedPrograms.includes(prog.id);
          const { startMonth, durationMonths } = prog.defaultTimeline;
          const compressedDuration = isSelected
            ? durationMonths * (1 - compressionFactor * 0.5)
            : durationMonths;
          const compressedStart = isSelected
            ? startMonth * (1 - compressionFactor * 0.25)
            : startMonth;

          return (
            <div key={prog.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 110,
                  fontSize: 11,
                  color: isSelected ? 'var(--ink)' : 'var(--grey-2)',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: 'right',
                  flexShrink: 0,
                  fontStyle: isSelected ? 'normal' : 'italic',
                }}
              >
                {prog.shortName}
              </span>
              <div style={{ flex: 1, position: 'relative', height: 20 }}>
                {/* Track */}
                <div style={{ position: 'absolute', inset: '8px 0', background: 'var(--grey-0)', borderRadius: 2 }} />
                {/* Bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    bottom: '4px',
                    left: pctOf(compressedStart),
                    width: pctOf(compressedDuration),
                    background: isSelected ? programColors[prog.id] : 'var(--grey-1)',
                    borderRadius: 3,
                    opacity: isSelected ? 1 : 0.5,
                    transition: 'all 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* End marker */}
      <div style={{ position: 'relative', height: 12, marginTop: 6 }}>
        <div
          style={{
            position: 'absolute',
            left: pctOf(endMonth),
            transform: 'translateX(-50%)',
            fontSize: 10,
            fontWeight: 600,
            color: accent,
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          ▲ end
        </div>
      </div>
    </div>
  );
}
