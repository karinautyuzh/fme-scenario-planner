import { useScenario } from '../../state/ScenarioContext';

interface TopBarProps {
  onOpenSummary: () => void;
  onOpenThoughtPartner?: () => void;
}

export function TopBar({ onOpenSummary, onOpenThoughtPartner }: TopBarProps) {
  const { activeScenario } = useScenario();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 56,
        background: 'var(--navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <AccentureDiamond />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Accenture × FME
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '0.01em',
            }}
          >
            Transformation Scenario Planner
          </span>
        </div>
      </div>

      {/* Center: active scenario name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {activeScenario.isBaseCaseLocked && (
          <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
            <rect x="1" y="5" width="9" height="7" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
            <path d="M3.5 5V3.5a2 2 0 0 1 4 0V5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
          {activeScenario.metadata.name}
        </span>
      </div>

      {/* Right: actions + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onOpenThoughtPartner && (
          <button
            onClick={onOpenThoughtPartner}
            style={{
              background: 'rgba(0,153,168,0.18)',
              border: '1px solid rgba(0,153,168,0.4)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em',
              borderRadius: 4,
              transition: 'background 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,153,168,0.28)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,153,168,0.18)')
            }
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
              <path d="M5.5 6.5C5.5 5.12 6.62 4 8 4C9.38 4 10.5 5.12 10.5 6.5C10.5 7.5 9.9 8.35 9.05 8.77C8.72 8.94 8.5 9.28 8.5 9.64V10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="8" cy="12" r="0.8" fill="rgba(255,255,255,0.8)" />
            </svg>
            Ask Thought Partner
          </button>
        )}
        <button
          onClick={onOpenSummary}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 12,
            fontWeight: 500,
            padding: '6px 16px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.02em',
            borderRadius: 4,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)')
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)')
          }
        >
          View My Scenario
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingLeft: 16,
            borderLeft: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              background: 'rgba(0,153,168,0.4)',
              border: '1px solid rgba(0,153,168,0.6)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Martin</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>CFO, FME</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function AccentureDiamond() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 0L22 11L11 22L0 11L11 0Z" fill="white" opacity="0.9" />
      <path d="M11 4L18 11L11 18L4 11L11 4Z" fill="var(--navy)" />
    </svg>
  );
}
