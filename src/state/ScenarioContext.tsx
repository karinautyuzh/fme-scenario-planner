import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  AppState,
  Scenario,
  ProgramId,
  ValueRealizationSpeed,
  BASE_CASE_ID,
  adjustAssumption,
  emptyInput,
  accentureEstimate,
} from '../types';
import { ACCENTURE_BASE_CASE } from '../data/baseCase';

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SELECT_SCENARIO'; id: string }
  | { type: 'CREATE_SCENARIO' }
  | { type: 'DUPLICATE_SCENARIO'; id: string }
  | { type: 'RENAME_SCENARIO'; id: string; name: string }
  | { type: 'DELETE_SCENARIO'; id: string }
  | { type: 'TOGGLE_PROGRAM'; programId: ProgramId }
  | { type: 'SET_BUSINESS_OUTCOME'; field: string; value: number | null }
  | { type: 'SET_SHARED_COST_BASE'; categoryId: string; value: number | null }
  | { type: 'SET_SHARED_COST_PCT'; categoryId: string; value: number }
  | { type: 'SET_COMPRESSION_MONTHS'; value: number }
  | { type: 'SET_VALUE_REALIZATION_SPEED'; value: ValueRealizationSpeed }
  | { type: 'SET_RAMP_MONTHS'; value: number }
  | { type: 'SET_FINANCIAL'; field: string; value: number | null }
  | { type: 'SET_PROGRAM_INVESTMENT'; programId: ProgramId; value: number | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cloneScenario(source: Scenario, name: string): Scenario {
  return {
    ...JSON.parse(JSON.stringify(source)),
    metadata: {
      ...source.metadata,
      id: uid(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    isBaseCaseLocked: false,
  };
}

function getActiveScenario(state: AppState): Scenario {
  return state.scenarios.find((s) => s.metadata.id === state.activeScenarioId)!;
}

function updateActive(state: AppState, mutate: (s: Scenario) => Scenario): AppState {
  const active = getActiveScenario(state);

  // Base case protection: clone before any mutation
  if (active.isBaseCaseLocked) {
    const cloneName = generateCloneName(state.scenarios);
    const clone = mutate(cloneScenario(active, cloneName));
    return {
      scenarios: [...state.scenarios, clone],
      activeScenarioId: clone.metadata.id,
    };
  }

  return {
    ...state,
    scenarios: state.scenarios.map((s) =>
      s.metadata.id === state.activeScenarioId
        ? { ...mutate(s), metadata: { ...s.metadata, updatedAt: new Date().toISOString() } }
        : s
    ),
  };
}

function generateCloneName(scenarios: Scenario[]): string {
  const existing = scenarios.filter((s) => !s.isBaseCaseLocked);
  const names = ['Your Scenario', 'Scenario A', 'Scenario B', 'Scenario C', 'Scenario D'];
  for (const name of names) {
    if (!existing.some((s) => s.metadata.name === name)) return name;
  }
  return `Scenario ${existing.length + 1}`;
}

function generateNewName(scenarios: Scenario[]): string {
  const existing = scenarios.filter((s) => !s.isBaseCaseLocked);
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (const label of labels) {
    const name = `Scenario ${label}`;
    if (!existing.some((s) => s.metadata.name === name)) return name;
  }
  return `Scenario ${existing.length + 1}`;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_SCENARIO':
      return { ...state, activeScenarioId: action.id };

    case 'CREATE_SCENARIO': {
      const base = getActiveScenario(state);
      const name = generateNewName(state.scenarios);
      const newScenario = cloneScenario(base, name);
      return {
        scenarios: [...state.scenarios, newScenario],
        activeScenarioId: newScenario.metadata.id,
      };
    }

    case 'DUPLICATE_SCENARIO': {
      const source = state.scenarios.find((s) => s.metadata.id === action.id);
      if (!source) return state;
      const name = generateNewName(state.scenarios);
      const dup = cloneScenario(source, name);
      return {
        scenarios: [...state.scenarios, dup],
        activeScenarioId: dup.metadata.id,
      };
    }

    case 'RENAME_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.metadata.id === action.id && !s.isBaseCaseLocked
            ? { ...s, metadata: { ...s.metadata, name: action.name, updatedAt: new Date().toISOString() } }
            : s
        ),
      };

    case 'DELETE_SCENARIO': {
      const remaining = state.scenarios.filter(
        (s) => s.metadata.id !== action.id || s.isBaseCaseLocked
      );
      if (remaining.length === state.scenarios.length) return state; // nothing deleted
      const newActive =
        remaining.find((s) => s.metadata.id === state.activeScenarioId)?.metadata.id ??
        remaining[remaining.length - 1].metadata.id;
      return { scenarios: remaining, activeScenarioId: newActive };
    }

    case 'TOGGLE_PROGRAM':
      return updateActive(state, (s) => {
        const selected = s.selectedPrograms.includes(action.programId)
          ? s.selectedPrograms.filter((p) => p !== action.programId)
          : [...s.selectedPrograms, action.programId];
        return { ...s, selectedPrograms: selected };
      });

    case 'SET_BUSINESS_OUTCOME':
      return updateActive(state, (s) => ({
        ...s,
        businessOutcomes: {
          ...s.businessOutcomes,
          [action.field]: adjustAssumption(
            (s.businessOutcomes as unknown as Record<string, ReturnType<typeof emptyInput>>)[action.field] ??
              emptyInput(),
            action.value
          ),
        },
      }));

    case 'SET_SHARED_COST_BASE':
      return updateActive(state, (s) => ({
        ...s,
        sharedCosts: {
          ...s.sharedCosts,
          [action.categoryId]: {
            ...s.sharedCosts[action.categoryId as keyof typeof s.sharedCosts],
            costBaseEurM: adjustAssumption(
              s.sharedCosts[action.categoryId as keyof typeof s.sharedCosts].costBaseEurM,
              action.value
            ),
          },
        },
      }));

    case 'SET_SHARED_COST_PCT':
      return updateActive(state, (s) => ({
        ...s,
        sharedCosts: {
          ...s.sharedCosts,
          [action.categoryId]: {
            ...s.sharedCosts[action.categoryId as keyof typeof s.sharedCosts],
            sharedPct: adjustAssumption(
              s.sharedCosts[action.categoryId as keyof typeof s.sharedCosts].sharedPct,
              action.value
            ),
          },
        },
      }));

    case 'SET_COMPRESSION_MONTHS':
      return updateActive(state, (s) => ({
        ...s,
        timing: {
          ...s.timing,
          compressionMonths: adjustAssumption(s.timing.compressionMonths, action.value),
        },
      }));

    case 'SET_VALUE_REALIZATION_SPEED':
      return updateActive(state, (s) => ({
        ...s,
        timing: {
          ...s.timing,
          valueRealizationSpeed: adjustAssumption(s.timing.valueRealizationSpeed, action.value),
        },
      }));

    case 'SET_RAMP_MONTHS':
      return updateActive(state, (s) => ({
        ...s,
        timing: {
          ...s.timing,
          rampToFullValueMonths: adjustAssumption(
            (s.timing as any).rampToFullValueMonths ?? accentureEstimate(24),
            action.value
          ),
        },
      }));

    case 'SET_FINANCIAL':
      return updateActive(state, (s) => ({
        ...s,
        financialBaselines: {
          ...s.financialBaselines,
          [action.field]: adjustAssumption(
            (s.financialBaselines as unknown as Record<string, ReturnType<typeof emptyInput>>)[action.field] ??
              emptyInput(),
            action.value
          ),
        },
      }));

    case 'SET_PROGRAM_INVESTMENT':
      return updateActive(state, (s) => ({
        ...s,
        programInvestmentsEurM: {
          ...s.programInvestmentsEurM,
          [action.programId]: adjustAssumption(
            s.programInvestmentsEurM[action.programId] ?? emptyInput(),
            action.value
          ),
        },
      }));

    default:
      return state;
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  const baseCaseCopy: Scenario = {
    ...JSON.parse(JSON.stringify(ACCENTURE_BASE_CASE)),
    metadata: { ...ACCENTURE_BASE_CASE.metadata, createdAt: new Date().toISOString() },
  };
  return {
    scenarios: [baseCaseCopy],
    activeScenarioId: BASE_CASE_ID,
  };
}

function loadFromStorage(): AppState | null {
  try {
    const raw = localStorage.getItem('fme-app-state');
    if (!raw) return null;
    const parsed: AppState = JSON.parse(raw);
    // Validate new state shape: must have scenarios array and a valid activeScenarioId
    if (!Array.isArray(parsed.scenarios) || !parsed.scenarios.length) return null;
    if (!parsed.activeScenarioId) return null;
    const activeExists = parsed.scenarios.some((s) => s.metadata?.id === parsed.activeScenarioId);
    if (!activeExists) return null;
    // Validate each scenario has the required new fields
    for (const s of parsed.scenarios) {
      if (!s.businessOutcomes || !s.sharedCosts || !s.timing || !s.financialBaselines) return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ScenarioContextValue {
  state: AppState;
  activeScenario: Scenario;
  dispatch: React.Dispatch<Action>;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadFromStorage() ?? buildInitialState());

  useEffect(() => {
    localStorage.setItem('fme-app-state', JSON.stringify(state));
  }, [state]);

  const activeScenario = getActiveScenario(state);

  return (
    <ScenarioContext.Provider value={{ state, activeScenario, dispatch }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}

// Re-export for convenience
export { accentureEstimate };
