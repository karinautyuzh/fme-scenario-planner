import React from 'react';
import { AssumptionSource } from '../../types';

interface Props {
  source: AssumptionSource;
  className?: string;
}

const CONFIG: Record<AssumptionSource, { label: string; bg: string; color: string } | null> = {
  'fme-reported': { label: 'FME Reported', bg: '#E8F0FB', color: '#0066B3' },
  'accenture-estimate': { label: 'Illustrative', bg: '#E6F6F7', color: '#007380' },
  'adjusted': { label: 'Adjusted', bg: '#FEF3C7', color: '#92400E' },
  'user-input': null,
  'unknown': null,
};

export default function ProvenanceBadge({ source, className = '' }: Props) {
  const cfg = CONFIG[source];
  if (!cfg) return null;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 7px',
        borderRadius: 99,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {cfg.label}
    </span>
  );
}
