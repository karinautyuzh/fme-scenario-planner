import React, { useState } from 'react';
import { CalculationResult } from '../../engine/types';

interface CalcDrawerProps {
  result: CalculationResult;
  label?: string;
}

export default function CalcDrawer({ result, label }: CalcDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--blue)',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
          <text x="6" y="9" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="700">?</text>
        </svg>
        {open ? 'Hide calculation' : 'How is this calculated?'}
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            background: 'var(--grey-0)',
            border: '1px solid var(--grey-1)',
            padding: '12px 14px',
            fontSize: 12,
          }}
        >
          {label && (
            <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>{label}</div>
          )}

          {result.calculationDescription && (
            <div style={{ color: 'var(--grey-3)', lineHeight: 1.55, marginBottom: result.inputs ? 8 : 0 }}>
              {result.calculationDescription}
            </div>
          )}

          {result.inputs && Object.keys(result.inputs).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(result.inputs).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: 'var(--grey-2)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{v ?? '—'}</span>
                </div>
              ))}
            </div>
          )}

          {result.requiredInputs.length > 0 && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF3C7', borderLeft: '3px solid #D97706' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400E', marginBottom: 4 }}>
                Missing Inputs
              </div>
              {result.requiredInputs.map((inp) => (
                <div key={inp} style={{ color: '#92400E', lineHeight: 1.5 }}>• {inp}</div>
              ))}
            </div>
          )}

          {result.warning && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#B45309', fontStyle: 'italic' }}>
              ⚠ {result.warning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
