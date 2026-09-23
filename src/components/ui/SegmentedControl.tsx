import React from 'react';

interface Option<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: Props<T>) {
  const padding = size === 'sm' ? '4px 10px' : '6px 16px';
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--grey-0)',
        border: '1.5px solid var(--grey-1)',
        borderRadius: 8,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            style={{
              padding,
              fontSize,
              fontWeight: active ? 600 : 400,
              fontFamily: 'Inter, sans-serif',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              background: active ? 'white' : 'transparent',
              color: active ? 'var(--navy)' : 'var(--grey-2)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
