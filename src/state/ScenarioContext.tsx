import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  AppState,
  Scenario,
  ProgramLibraryEntry,
  ProgramKPI,
  ProgramValueInputs,
  OutcomeId,
  ValueRealizationSpeed,
  BASE_CASE_ID,
  adjustAssumption,
  emptyInput,
  accentureEstimate,
} from '../types';
import { ACCENTURE_BASE_CASE } from '../data/baseCase';
import { INITIAL_PROGRAM_LIBRARY } from '../data/programLibrary';

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SELECT_SCENARIO'; id: string }
  | { type: 'CREATE_SCENARIO' }
  | { type: 'DUPLICATE_SCENARIO'; id: string }
  | { type: 'RENAME_SCENARIO'; id: string; name: string }
  | { type: 'DELETE_SCENARIO'; id: string }
  | { type: 'TOGGLE_PROGRAM'; programId: string }
  | { type: 'SET_BUSINESS_OUTCOME'; field: string; value: number | null }
  | { type: 'SET_SHARED_COST_BASE'; categoryId: string; value: number | null }
  | { type: 'SET_SHARED_COST_PCT'; categoryId: string; value: number }
  | { type: 'SET_COMPRESSION_MONTHS'; value: number }
  | { type: 'SET_VALUE_REALIZATION_SPEED'; value: ValueRealizationSpeed }
  | { type: 'SET_RAMP_MONTHS'; value: number }
  | { type: 'SET_FINANCIAL'; field: string; value: number | null }
  | { type: 'SET_PROGRAM_INVESTMENT'; programId: string; value: number | null }
  // Program Library
  | { type: 'ADD_PROGRAM'; program: ProgramLibraryEntry }
  | { type: 'UPDATE_PROGRAM'; id: string; updates: Partial<ProgramLibraryEntry> }
  | { type: 'DELETE_PROGRAM'; id: string }
  | { type: 'TOGGLE_PROGRAM_KPI'; programId: string; kpiId: string }
  | { type: 'ADD_CUSTOM_KPI'; programId: string; kpi: ProgramKPI }
  | { type: 'UPDATE_PROGRAM_KPI'; programId: string; kpiId: string; updates: Partial<ProgramKPI> }
  | { type: 'SET_PROGRAM_OUTCOME_PRIORITY'; programId: string; outcomeId: OutcomeId; value: number }
  | { type: 'SET_PROGRAM_FIELD'; programId: string; field: string; value: unknown }
  | { type: 'SET_PROGRAM_VALUE_INPUT'; programId: string; field: keyof ProgramValueInputs; value: number | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pidUid(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

  if (active.isBaseCaseLocked) {
    const cloneName = generateCloneName(state.scenarios);
    const clone = mutate(cloneScenario(active, cloneName));
    return {
      ...state,
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

function updateLibraryEntry(
  state: AppState,
  id: string,
  mutate: (p: ProgramLibraryEntry) => ProgramLibraryEntry
): AppState {
  return {
    ...state,
    programLibrary: state.programLibrary.map((p) => (p.id === id ? mutate(p) : p)),
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
        ...state,
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
        ...state,
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
      if (remaining.length === state.scenarios.length) return state;
      const newActive =
        remaining.find((s) => s.metadata.id === state.activeScenarioId)?.metadata.id ??
        remaining[remaining.length - 1].metadata.id;
      return { ...state, scenarios: remaining, activeScenarioId: newActive };
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

    // ── Program Library actions ────────────────────────────────────────────────

    case 'ADD_PROGRAM':
      return {
        ...state,
        programLibrary: [...state.programLibrary, action.program],
      };

    case 'UPDATE_PROGRAM':
      return updateLibraryEntry(state, action.id, (p) => ({ ...p, ...action.updates }));

    case 'DELETE_PROGRAM': {
      const entry = state.programLibrary.find((p) => p.id === action.id);
      if (!entry || entry.isBuiltIn) return state;
      return {
        ...state,
        programLibrary: state.programLibrary.filter((p) => p.id !== action.id),
        scenarios: state.scenarios.map((s) => ({
          ...s,
          selectedPrograms: s.selectedPrograms.filter((pid) => pid !== action.id),
        })),
      };
    }

    case 'TOGGLE_PROGRAM_KPI':
      return updateLibraryEntry(state, action.programId, (p) => ({
        ...p,
        kpis: p.kpis.map((k) => (k.id === action.kpiId ? { ...k, isActive: !k.isActive } : k)),
      }));

    case 'ADD_CUSTOM_KPI':
      return updateLibraryEntry(state, action.programId, (p) => ({
        ...p,
        kpis: [...p.kpis, action.kpi],
      }));

    case 'UPDATE_PROGRAM_KPI':
      return updateLibraryEntry(state, action.programId, (p) => ({
        ...p,
        kpis: p.kpis.map((k) => (k.id === action.kpiId ? { ...k, ...action.updates } : k)),
      }));

    case 'SET_PROGRAM_OUTCOME_PRIORITY':
      return updateLibraryEntry(state, action.programId, (p) => ({
        ...p,
        outcomePriorities: { ...p.outcomePriorities, [action.outcomeId]: action.value },
      }));

    case 'SET_PROGRAM_FIELD':
      return updateLibraryEntry(state, action.programId, (p) => ({
        ...p,
        [action.field]: action.value,
      }));

    case 'SET_PROGRAM_VALUE_INPUT':
      return updateActive(state, (s) => {
        const current = s.programValueInputs ?? {};
        const programInputs = current[action.programId] ?? {};
        const existing = (programInputs[action.field] as ReturnType<typeof emptyInput> | undefined) ?? emptyInput();
        return {
          ...s,
          programValueInputs: {
            ...current,
            [action.programId]: {
              ...programInputs,
              [action.field]: adjustAssumption(existing, action.value),
            },
          },
        };
      });

    default:
      return state;
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

function buildInitialState(): AppState {
  const baseCaseCopy: Scenario = {
    ...JSON.parse(JSON.stringify(ACCENTURE_BASE_CASE)),
    metadata: { ...ACCENTURE_BASE_CASE.metadata, createdAt: new Date().toISOString() },
    programValueInputs: JSON.parse(JSON.stringify(ACCENTURE_BASE_CASE.programValueInputs ?? {})),
  };
  return {
    scenarios: [baseCaseCopy],
    activeScenarioId: BASE_CASE_ID,
    programLibrary: JSON.parse(JSON.stringify(INITIAL_PROGRAM_LIBRARY)),
  };
}

function loadFromStorage(): AppState | null {
  try {
    const raw = localStorage.getItem('fme-app-state');
    if (!raw) return null;
    const parsed: AppState = JSON.parse(raw);
    if (!Array.isArray(parsed.scenarios) || !parsed.scenarios.length) return null;
    if (!parsed.activeScenarioId) return null;
    const activeExists = parsed.scenarios.some((s) => s.metadata?.id === parsed.activeScenarioId);
    if (!activeExists) return null;
    for (const s of parsed.scenarios) {
      if (!s.businessOutcomes || !s.sharedCosts || !s.timing || !s.financialBaselines) return null;
    }
    // Migrate: add programLibrary if missing
    if (!Array.isArray(parsed.programLibrary) || !parsed.programLibrary.length) {
      parsed.programLibrary = JSON.parse(JSON.stringify(INITIAL_PROGRAM_LIBRARY));
    }
    // Migrate: add programValueInputs if missing from any scenario
    for (const s of parsed.scenarios) {
      if (!s.programValueInputs) {
        s.programValueInputs = {};
      }
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

export { accentureEstimate, pidUid };
