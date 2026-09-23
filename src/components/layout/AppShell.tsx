import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { NavTabs } from './NavTabs';
import { ScenarioSummaryPanel } from './ScenarioSummaryPanel';
import { ThoughtPartnerButton, ThoughtPartnerPanel } from './ThoughtPartnerPanel';
import ScenarioStrip from '../scenario/ScenarioStrip';

export function AppShell() {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [thoughtPartnerOpen, setThoughtPartnerOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--grey-0)' }}>
      <TopBar
        onOpenSummary={() => setSummaryOpen(true)}
        onOpenThoughtPartner={() => setThoughtPartnerOpen(true)}
      />
      <NavTabs />
      <ScenarioStrip />

      {/* Main content — offset for TopBar(56) + NavTabs(44) + ScenarioStrip(44) */}
      <main
        style={{
          paddingTop: 144,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </main>

      <ScenarioSummaryPanel
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
      />

      <ThoughtPartnerPanel
        open={thoughtPartnerOpen}
        onClose={() => setThoughtPartnerOpen(false)}
      />

      <ThoughtPartnerButton onOpen={() => setThoughtPartnerOpen(true)} />
    </div>
  );
}
