import React from 'react';
import { Assumption, resetAssumption } from '../../types';
import ProvenanceBadge from './ProvenanceBadge';

interface Props {
  label: string;
  assumption: Assumption<number>;
  min: number;
  max: number;
  step?: number;
  formatValue: (v: number) => string;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
  onReset?: () => void;
}

export default function AssumptionSlider({
  label,
  assumption,
  min,
  max,
  step = 1,
  formatValue,
  minLabel,
  maxLabel,
  onChange,
  onReset,
}: Props) {
  const value = assumption.value ?? min;
  const fillPct = ((value - min) / (max - min)) * 100;
  const isAdjusted = assumption.source === 'adjusted';
  const hasBase =
    assumption.baseValue !== undefined &&
    assumption.baseValue !== null &&
    assumption.baseValue !== value;

  const handleReset = () => {
    const reset = resetAssumption(assumption);
    if (reset.value !== null) onChange(reset.value);
    onReset?.();
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', fontFamily: 'Inter, sans-serif', flex: 1 }}>
          {label}
        </span>
        <ProvenanceBadge source={assumption.source} />
        {isAdjusted && hasBase && (
          <button
            onClick={handleReset}
            title={`Reset to ${formatValue(assumption.baseValue as number)}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              color: 'var(--blue)',
              textDecoration: 'underline',
              padding: 0,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Reset
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="fme-range"
            style={{ '--fill-pct': `${fillPct}%` } as React.CSSProperties}
          />
        </div>
        <span
          style={{
            minWidth: 48,
            textAlign: 'right',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--blue)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {formatValue(value)}
        </span>
      </div>

      {(minLabel || maxLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--grey-2)', fontFamily: 'Inter, sans-serif' }}>
            {minLabel ?? formatValue(min)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--grey-2)', fontFamily: 'Inter, sans-serif' }}>
            {maxLabel ?? formatValue(max)}
          </span>
        </div>
      )}
    </div>
  );
}
