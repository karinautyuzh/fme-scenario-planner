import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScenarioProvider } from './state/ScenarioContext';
import { AppShell } from './components/layout/AppShell';
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import BuildScenario from './pages/BuildScenario';
import PressureTest from './pages/PressureTest';
import { CompareValue } from './pages/CompareValue';
import { RealizeValue } from './pages/RealizeValue';

export default function App() {
  return (
    <BrowserRouter>
      <ScenarioProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index         element={<ExecutiveOverview />} />
            <Route path="build"  element={<BuildScenario />} />
            <Route path="pressure-test" element={<PressureTest />} />
            <Route path="compare" element={<CompareValue />} />
            <Route path="realize" element={<RealizeValue />} />
          </Route>
        </Routes>
      </ScenarioProvider>
    </BrowserRouter>
  );
}
