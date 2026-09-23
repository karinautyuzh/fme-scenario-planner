import { useMemo } from 'react';
import { Scenario } from '../types';
import { computeScenarioOutput } from './scenario';
import { ScenarioEngineOutput } from './types';

export function useEngineOutput(scenario: Scenario): ScenarioEngineOutput {
  return useMemo(() => computeScenarioOutput(scenario), [scenario]);
}
