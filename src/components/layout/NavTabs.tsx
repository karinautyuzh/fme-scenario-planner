import { NavLink } from 'react-router-dom';

const TABS = [
  { path: '/',              label: 'Executive Overview',   number: '01' },
  { path: '/intake',        label: 'Program Intake',       number: '02' },
  { path: '/build',         label: 'Build Your Scenario',  number: '03' },
  { path: '/pressure-test', label: 'Pressure-Test',        number: '04' },
  { path: '/compare',       label: 'Compare Value',        number: '05' },
  { path: '/realize',       label: 'Value Realization',    number: '06' },
];

export function NavTabs() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 56,
        left: 0,
        right: 0,
        zIndex: 190,
        height: 44,
        background: 'white',
        borderBottom: '1px solid var(--grey-1)',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0 32px',
        overflow: 'hidden',
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 16px',
            borderBottom: isActive ? '2px solid var(--blue)' : '2px solid transparent',
            marginBottom: -1,
            textDecoration: 'none',
            fontSize: 11.5,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--blue)' : 'var(--grey-3)',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s, border-color 0.15s',
            letterSpacing: '0.01em',
            cursor: 'pointer',
          })}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.style.borderBottom.includes('var(--blue)')) el.style.color = 'var(--blue)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.style.borderBottom.includes('var(--blue)')) el.style.color = 'var(--grey-3)';
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', opacity: 0.45 }}>
            {tab.number}
          </span>
          {tab.label}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 20,
          borderLeft: '1px solid var(--grey-1)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--grey-2)',
        }}
      >
        FME × Accenture · Confidential
      </div>
    </nav>
  );
}
