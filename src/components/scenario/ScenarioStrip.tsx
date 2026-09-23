import React, { useState, useRef, useEffect } from 'react';
import { useScenario } from '../../state/ScenarioContext';
import { BASE_CASE_ID } from '../../types';

export default function ScenarioStrip() {
  const { state, activeScenario, dispatch } = useScenario();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditDraft(currentName);
    setOpenMenuId(null);
  };

  const commitRename = () => {
    if (editingId && editDraft.trim()) {
      dispatch({ type: 'RENAME_SCENARIO', id: editingId, name: editDraft.trim() });
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditingId(null);
  };

  const userScenarios = state.scenarios.filter((s) => !s.isBaseCaseLocked);

  return (
    <div
      style={{
        position: 'fixed',
        top: 100,
        left: 0,
        right: 0,
        height: 44,
        background: 'white',
        borderBottom: '1px solid var(--grey-1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 4,
        zIndex: 90,
        overflowX: 'auto',
      }}
    >
      {/* Base Case tab */}
      {state.scenarios.filter((s) => s.isBaseCaseLocked).map((s) => {
        const active = s.metadata.id === state.activeScenarioId;
        return (
          <button
            key={s.metadata.id}
            onClick={() => dispatch({ type: 'SELECT_SCENARIO', id: s.metadata.id })}
            title="Accenture starting hypothesis — protected. Changes create a new scenario."
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 6,
              border: '1.5px solid',
              borderColor: active ? 'var(--teal)' : 'var(--grey-1)',
              background: active ? '#E6F6F7' : 'var(--grey-0)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              color: active ? '#007380' : 'var(--grey-2)',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
              <rect x="1" y="5" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M3.5 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            {s.metadata.name}
          </button>
        );
      })}

      <div style={{ width: 1, height: 20, background: 'var(--grey-1)', margin: '0 4px', flexShrink: 0 }} />

      {/* User scenario tabs */}
      {userScenarios.map((s) => {
        const active = s.metadata.id === state.activeScenarioId;
        const renaming = editingId === s.metadata.id;

        return (
          <div
            key={s.metadata.id}
            style={{ position: 'relative', flexShrink: 0 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 10px 4px 14px',
                borderRadius: 6,
                border: '1.5px solid',
                borderColor: active ? 'var(--blue)' : 'var(--grey-1)',
                background: active ? '#EBF4FB' : 'white',
                cursor: renaming ? 'default' : 'pointer',
              }}
            >
              {renaming ? (
                <input
                  ref={editRef}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={handleKeyDown}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--navy)',
                    fontFamily: 'Inter, sans-serif',
                    width: Math.max(80, editDraft.length * 7),
                  }}
                />
              ) : (
                <span
                  onClick={() => dispatch({ type: 'SELECT_SCENARIO', id: s.metadata.id })}
                  onDoubleClick={() => startRename(s.metadata.id, s.metadata.name)}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--navy)' : 'var(--grey-2)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {s.metadata.name}
                </span>
              )}

              {/* Menu trigger */}
              {!renaming && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === s.metadata.id ? null : s.metadata.id);
                  }}
                  style={{
                    marginLeft: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 2px',
                    color: 'var(--grey-2)',
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ···
                </button>
              )}
            </div>

            {/* Dropdown menu */}
            {openMenuId === s.metadata.id && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'white',
                  border: '1px solid var(--grey-1)',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,51,102,0.12)',
                  zIndex: 200,
                  minWidth: 160,
                  overflow: 'hidden',
                }}
              >
                {[
                  {
                    label: 'Rename',
                    action: () => startRename(s.metadata.id, s.metadata.name),
                  },
                  {
                    label: 'Duplicate',
                    action: () => {
                      dispatch({ type: 'DUPLICATE_SCENARIO', id: s.metadata.id });
                      setOpenMenuId(null);
                    },
                  },
                  {
                    label: 'Delete',
                    action: () => {
                      dispatch({ type: 'DELETE_SCENARIO', id: s.metadata.id });
                      setOpenMenuId(null);
                    },
                    danger: true,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'Inter, sans-serif',
                      color: item.danger ? '#DC2626' : 'var(--ink)',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'var(--grey-0)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'none';
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* New Scenario */}
      <button
        onClick={() => dispatch({ type: 'CREATE_SCENARIO' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 12px',
          borderRadius: 6,
          border: '1.5px dashed var(--grey-1)',
          background: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--blue)',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          marginLeft: 4,
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        New Scenario
      </button>
    </div>
  );
}
