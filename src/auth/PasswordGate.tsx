import { useState, useRef, useEffect } from 'react';
import { ACCESS_PASSWORD, SESSION_KEY } from './config';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function attempt() {
    if (value === ACCESS_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onAuthenticated();
    } else {
      setError(true);
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') attempt();
    if (error) setError(false);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--grey-0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: 'white',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        }}
      >
        {/* Navy header bar */}
        <div
          style={{
            background: 'var(--navy)',
            padding: '28px 36px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <AccentureDiamond />
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
                marginBottom: 3,
              }}
            >
              Accenture × FME
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'white',
                letterSpacing: '0.01em',
              }}
            >
              Transformation Scenario Planner
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '36px 36px 40px' }}>
          <h1
            style={{
              fontFamily: 'Source Serif 4, serif',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--navy)',
              marginBottom: 8,
              lineHeight: 1.25,
            }}
          >
            Restricted Access
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'var(--grey-3)',
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            Enter the access password to continue.
          </p>

          {/* Input row */}
          <div
            style={{
              animation: shake ? 'fme-shake 0.45s ease' : 'none',
            }}
          >
            <style>{`
              @keyframes fme-shake {
                0%,100% { transform: translateX(0); }
                20%      { transform: translateX(-8px); }
                40%      { transform: translateX(8px); }
                60%      { transform: translateX(-5px); }
                80%      { transform: translateX(5px); }
              }
            `}</style>
            <input
              ref={inputRef}
              type="password"
              value={value}
              placeholder="Access password"
              onChange={(e) => { setValue(e.target.value); setError(false); }}
              onKeyDown={handleKey}
              aria-label="Access password"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                border: `1.5px solid ${error ? '#EF4444' : 'var(--grey-1)'}`,
                outline: 'none',
                color: 'var(--navy)',
                marginBottom: 8,
                background: 'white',
                borderRadius: 3,
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) =>
                !error && (e.currentTarget.style.borderColor = 'var(--blue)')
              }
              onBlur={(e) =>
                !error && (e.currentTarget.style.borderColor = 'var(--grey-1)')
              }
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                color: '#DC2626',
                marginBottom: 16,
                marginTop: -4,
              }}
            >
              Incorrect password. Please try again.
            </div>
          )}

          <button
            onClick={attempt}
            style={{
              width: '100%',
              background: 'var(--navy)',
              border: 'none',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              padding: '12px 0',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              borderRadius: 3,
              transition: 'background 0.15s',
              marginTop: error ? 0 : 8,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'var(--navy)')
            }
          >
            Enter
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          fontSize: 11,
          color: 'var(--grey-2)',
          letterSpacing: '0.04em',
        }}
      >
        FME × ACCENTURE · CONFIDENTIAL
      </div>
    </div>
  );
}

function AccentureDiamond() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11 0L22 11L11 22L0 11L11 0Z" fill="white" opacity="0.9" />
      <path d="M11 4L18 11L11 18L4 11L11 4Z" fill="var(--navy)" />
    </svg>
  );
}
