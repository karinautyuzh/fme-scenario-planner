import React, { useState, useRef, useEffect } from 'react';
import { Assumption, resetAssumption } from '../../types';
import ProvenanceBadge from './ProvenanceBadge';

interface Props {
  label: string;
  assumption: Assumption<number>;
  unit?: string;
  placeholder?: string;
  description?: string;
  onChange: (value: number | null) => void;
}

export default function AssumptionInput({
  label,
  assumption,
  unit,
  placeholder = 'Enter value',
  description,
  onChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = assumption.value !== null && assumption.value !== undefined;
  const isAdjusted = assumption.source === 'adjusted';
  const hasBase =
    assumption.baseValue !== undefined &&
    assumption.baseValue !== null &&
    assumption.baseValue !== assumption.value;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(hasValue ? String(assumption.value) : '');
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const num = parseFloat(draft.replace(/[^0-9.-]/g, ''));
    if (draft.trim() === '' || isNaN(num)) {
      onChange(null);
    } else {
      onChange(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const reset = resetAssumption(assumption);
    onChange(reset.value);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', fontFamily: 'Inter, sans-serif', flex: 1 }}>
          {label}
        </span>
        <ProvenanceBadge source={assumption.source} />
        {isAdjusted && hasBase && (
          <button
            onClick={handleReset}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          onClick={startEditing}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 36,
            padding: '0 12px',
            border: editing ? '1.5px solid var(--blue)' : '1.5px solid var(--grey-1)',
            borderRadius: 6,
            background: 'white',
            cursor: 'text',
            transition: 'border-color 0.15s',
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink)',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          ) : (
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: hasValue ? 600 : 400,
                color: hasValue ? 'var(--ink)' : 'var(--grey-2)',
                fontFamily: 'Inter, sans-serif',
                fontStyle: hasValue ? 'normal' : 'italic',
              }}
            >
              {hasValue
                ? assumption.value!.toLocaleString()
                : placeholder}
            </span>
          )}
          {unit && (
            <span style={{ fontSize: 13, color: 'var(--grey-2)', fontFamily: 'Inter, sans-serif' }}>
              {unit}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--grey-2)', fontFamily: 'Inter, sans-serif' }}>
          {description}
        </p>
      )}
    </div>
  );
}
