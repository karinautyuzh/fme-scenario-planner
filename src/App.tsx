import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScenarioProvider } from './state/ScenarioContext';
import { AppShell } from './components/layout/AppShell';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import ProgramIntake from './pages/ProgramIntake';
import BuildScenario from './pages/BuildScenario';
import PressureTest from './pages/PressureTest';
import { CompareValue } from './pages/CompareValue';
import { RealizeValue } from './pages/RealizeValue';
import { PasswordGate } from './auth/PasswordGate';
import { SESSION_KEY } from './auth/config';

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  }

  if (!authenticated) {
    return <PasswordGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScenarioProvider>
        <Routes>
          <Route element={<AppShell onLogout={handleLogout} />}>
            <Route index              element={<ExecutiveOverview />} />
            <Route path="intake"      element={<ProgramIntake />} />
            <Route path="build"       element={<BuildScenario />} />
            <Route path="pressure-test" element={<PressureTest />} />
            <Route path="compare"     element={<CompareValue />} />
            <Route path="realize"     element={<RealizeValue />} />
          </Route>
        </Routes>
      </ScenarioProvider>
    </BrowserRouter>
  );
}
