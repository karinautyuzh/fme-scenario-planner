# FME Transformation Scenario Planner

An interactive executive planning tool that models the financial and strategic value of integrating FME's four transformation programs — EHR / Patient Care, ESPHORA / CD, Supply Chain, and GEMINI — as one coordinated transformation rather than four parallel initiatives.

Built by Accenture for FME leadership.

---

## Product Purpose

FME has four major digital transformation programs in flight. Run separately, they create overlapping change burdens, duplicated integration costs, and value realized later. Run as one integrated transformation, they unlock shared cost savings, earlier value realization, and better enterprise outcomes.

This tool lets FME leadership (Martin, CFO) model that choice. It does not fabricate results — it shows Martin exactly what assumptions are needed to generate a number, and tracks which outputs are calculated versus which are awaiting input.

**The tool answers three questions:**
1. What is the financial value of integrating these programs? (Business Outcome Value + Shared Cost Benefit)
2. How much sooner does value arrive when programs are integrated? (Value Acceleration)
3. What must be true — organizationally and operationally — for those numbers to be real? (BEO Capabilities)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| Styling | CSS custom properties (inline styles) |
| Fonts | Inter (body), Source Serif 4 (display) |
| Charts | Recharts |
| State | React Context + localStorage persistence |
| AI / Chat | Local rule-based engine (no API key required) |

No backend. No API keys. No external data dependencies. Runs fully in the browser.

---

## Local Setup

**Prerequisites:** Node.js 18+ at `C:\Program Files\nodejs` (Windows) or on PATH.

```bash
cd fme-scenario-planner
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

The dev server uses port 3001 (configured in `vite.config.ts`).

---

## Build Command

```bash
npm run build
```

Output goes to `dist/`. TypeScript is checked before build. To run TypeScript check independently:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

---

## Project Structure

```
src/
  App.tsx                         # Router and route definitions
  main.tsx                        # React entry point
  index.css                       # Global CSS variables and base styles

  types.ts                        # All core TypeScript types (Scenario, Assumption, etc.)

  data/
    programs.ts                   # The 4 transformation programs (id, name, outcomes)
    outcomes.ts                   # The 3 enterprise outcomes

  state/
    ScenarioContext.tsx            # Global state: scenarios[], activeScenarioId
    initialState.ts                # Base case defaults and scenario factory

  engine/
    types.ts                       # ScenarioEngineOutput, CalculationResult
    scenarioEngine.ts              # Pure calculation function: Scenario → ScenarioEngineOutput
    useEngine.ts                   # React hook wrapping the engine with useMemo

  pages/
    ExecutiveOverview.tsx          # Route: /  (01)
    BuildScenario.tsx              # Route: /build  (02 — Choose Programs)
    PressureTest.tsx               # Route: /pressure-test  (03)
    CompareValue.tsx               # Route: /compare  (04)
    RealizeValue.tsx               # Route: /realize  (05)

  components/
    layout/
      AppShell.tsx                 # Persistent shell: TopBar + NavTabs + Scenario Strip
      TopBar.tsx                   # Fixed header with scenario name + overlay triggers
      NavTabs.tsx                  # Tab navigation (01–05)
      ScenarioSummaryPanel.tsx     # Full-screen executive summary overlay
      ThoughtPartnerPanel.tsx      # Right-drawer AI chat panel
    scenario/
      ScenarioStrip.tsx            # Sub-header: scenario switcher
    value/
      ValueCurveChart.tsx          # Recharts line chart: integrated vs. separate delivery
    inputs/
      AssumptionInput.tsx          # Labeled input with source badge

  services/
    thoughtPartner/
      types.ts                     # ThoughtPartnerMessage, ThoughtPartnerContext, etc.
      contextBuilder.ts            # buildThoughtPartnerContext() — scenario → chat context
      industryInsights.ts          # 7 curated benchmark insights (all labeled ILLUSTRATIVE)
      localEngine.ts               # Intent detection + response generators
      service.ts                   # IThoughtPartnerService interface + local implementation
```

---

## Scenario Data Model

Every scenario is a `Scenario` object (defined in `src/types.ts`). Key shape:

```typescript
interface Scenario {
  metadata: { id: string; name: string; createdAt: string; updatedAt: string; };
  isBaseCaseLocked: boolean;          // Base case is read-only; edits clone it
  selectedPrograms: ProgramId[];

  timing: {
    compressionMonths: Assumption<number>;   // Months of delivery acceleration
    valueRealizationSpeed: Assumption<string>; // 'standard' | 'accelerated' | 'aggressive'
  };

  businessOutcomes: {
    patientVolumeUpliftPct: Assumption<number>;       // % more patients treated
    costPerTreatmentImprovementPct: Assumption<number>; // % reduction in cost/treatment
    supplyWasteReductionPct: Assumption<number>;       // % supply waste reduced
    overallValueCapturePct: Assumption<number>;        // % of theoretical value actually captured
  };

  financialInputs: {
    annualTreatmentVolume: Assumption<number | null>;  // User must enter
    valuPerIncrementalTreatment: Assumption<number | null>; // User must enter
    costPerTreatment: Assumption<number | null>;       // User must enter
    supplyConsumableCostBaseEurM: Assumption<number | null>; // User must enter
  };

  sharedCosts: {
    changeManagement: { totalEurM: Assumption<number>; sharedPct: Assumption<number>; };
    dataIntegration:  { totalEurM: Assumption<number>; sharedPct: Assumption<number>; };
    programManagement:{ totalEurM: Assumption<number>; sharedPct: Assumption<number>; };
    infrastructure:   { totalEurM: Assumption<number>; sharedPct: Assumption<number>; };
  };
}
```

`Assumption<T>` wraps every editable value with a `source` field:

```typescript
type AssumptionSource = 'fme-reported' | 'accenture-estimate' | 'user-input' | 'adjusted' | 'unknown';
interface Assumption<T> { value: T; source: AssumptionSource; }
```

---

## Calculation Engine Overview

**File:** `src/engine/scenarioEngine.ts`

The engine is a pure function: `calculateScenario(scenario: Scenario): ScenarioEngineOutput`. It uses no side effects and has no dependencies on React state.

**Calculation flow:**

1. **Business Outcome Value** — derived from financial inputs × KPI assumptions:
   - Volume uplift: `annualTreatmentVolume × (patientVolumeUpliftPct / 100) × valuPerIncrementalTreatment`
   - Cost reduction: `annualTreatmentVolume × costPerTreatment × (costPerTreatmentImprovementPct / 100)`
   - Supply saving: `supplyConsumableCostBaseEurM × (supplyWasteReductionPct / 100)`
   - Each multiplied by `overallValueCapturePct / 100`
   - All denominated in €M/year

2. **Shared Cost Benefit** — derived from the shared cost inputs:
   - For each cost category: `totalEurM × (sharedPct / 100)`
   - Sum = total shared cost benefit (€M, one-time)

3. **Value Curve** — 2026–2035 cumulative value series:
   - Integrated curve: value starts at `compressionMonths` before the separate curve
   - Both curves ramp over `valueRealizationSpeed` months then plateau
   - Requires `hasEnoughForCurve = true` (at least one annual value component calculated)

4. **Value Accelerated** — cumulative integrated − cumulative separate through 2030 and 2035

Each output field is a `CalculationResult<T>`:
```typescript
interface CalculationResult<T> {
  value: T | null;
  status: 'CALCULATED' | 'PARTIAL' | 'REQUIRES_INPUT' | 'NOT_APPLICABLE';
  requiredInputs: string[];
  calculationDescription: string;
  isRecurring: boolean;
  warning?: string;
}
```

`missingFinancialInputs` on the output lists every null financial input by display name, enabling the UI to surface exactly what Martin needs to enter.

---

## Thought Partner Architecture

**Files:** `src/services/thoughtPartner/`

The Thought Partner is a local rule-based system — no API key, no network call. It simulates an AI assistant using FME's actual scenario data.

**Flow:**

```
User message
  → detectIntent(message) → ThoughtPartnerIntent
  → processMessage(message, context) → ThoughtPartnerResponse
  → ThoughtPartnerPanel renders response
```

**Intent categories:** `MISSING_INPUTS | VALUE_DRIVERS | ADD_PROGRAM | SCENARIO_DIFF | INDUSTRY_INSIGHT | TIMELINE | CALCULATION | SENSITIVITY | GENERAL`

**Context:** `buildThoughtPartnerContext(scenario, engine, allScenarios)` — flattens scenario + engine output into a plain object so response generators never read the scenario directly. This means every response is grounded in actual scenario values, not invented numbers.

**Response generators** in `localEngine.ts` — one per intent. Each generator uses only values from the context object. If a value is null (not yet entered), the response says so explicitly rather than substituting an illustrative number.

---

## Industry Insight Architecture

**File:** `src/services/thoughtPartner/industryInsights.ts`

Seven curated benchmark insights, each explicitly labeled `ILLUSTRATIVE BENCHMARK` or `ACCENTURE HYPOTHESIS` with `isDemoData: true`. These are directional reference points, not FME-specific data.

Topics: volume uplift, cost reduction, supply waste, integration speed, value capture, reporting consolidation, ramp speed.

Each insight has:
- `relevantPrograms: string[]` — which program IDs it relates to
- `sourceLabel` — "Accenture Life Sciences Health Index" or similar
- `claim` — one-sentence finding
- `detail` — context and caveats

`getInsightsForPrograms(programIds)` filters by program relevance. `getInsightsByTopic(topic)` filters by topic keyword.

---

## How to Connect a Future Live LLM

The `IThoughtPartnerService` interface in `src/services/thoughtPartner/service.ts` decouples the UI from the implementation:

```typescript
interface IThoughtPartnerService {
  sendMessage(
    message: string,
    context: ThoughtPartnerContext,
    history: ThoughtPartnerMessage[]
  ): Promise<ThoughtPartnerResponse>;
}
```

To connect Claude (or any LLM):

1. Create `src/services/thoughtPartner/claudeService.ts`
2. Implement `IThoughtPartnerService` — call your backend proxy (never put API keys in frontend code)
3. Your backend receives `message`, `context`, and `history`; returns `{ content, intent, suggestedFollowUps }`
4. In `service.ts`, update `createThoughtPartnerService()` to return the new implementation based on an environment variable:
   ```typescript
   export function createThoughtPartnerService(): IThoughtPartnerService {
     if (import.meta.env.VITE_USE_LIVE_LLM === 'true') {
       return new ClaudeThoughtPartnerService();
     }
     return new LocalThoughtPartnerService();
   }
   ```
5. Set `VITE_USE_LIVE_LLM=true` in `.env.local` (never commit this file)

The `ThoughtPartnerContext` object already contains all scenario values the LLM needs. Pass it as a system-prompt section.

---

## How to Add / Update FME Source Data

**Programs:** Edit `src/data/programs.ts`. Each program has:
- `id: ProgramId` — must also be added to the `ProgramId` union in `src/types.ts`
- `name`, `shortName` — display labels
- `outcomes: OutcomeId[]` — which enterprise outcomes it contributes to

**Outcomes:** Edit `src/data/outcomes.ts`. Each outcome has `id`, `label`, `sublabel`.

**Base case defaults:** Edit `src/state/initialState.ts`. The `BASE_CASE` object contains all default `Assumption<T>` values with `source: 'accenture-estimate'`. These are the only hard-coded estimates in the application. Every value there should be traceable to an Accenture source.

---

## How to Add a New KPI

1. Add the field to `BusinessOutcomes` in `src/types.ts` as `Assumption<number>`
2. Add it to the base case in `src/state/initialState.ts` with an Accenture estimate and `source: 'accenture-estimate'`
3. Add the calculation in `src/engine/scenarioEngine.ts` — produce a new `CalculationResult` and add it to `ScenarioEngineOutput` in `src/engine/types.ts`
4. Add an input slider/field in `src/pages/PressureTest.tsx`
5. Add the output display in `src/components/layout/ScenarioSummaryPanel.tsx` under the appropriate value lens

---

## How to Add a New Program

1. Add `'new-program-id'` to the `ProgramId` union type in `src/types.ts`
2. Add the program object to the `PROGRAMS` array in `src/data/programs.ts`
3. Add cross-program dependency strings in `src/pages/RealizeValue.tsx` → `buildCrossProgramDependencies()`
4. Add relevant industry insights in `src/services/thoughtPartner/industryInsights.ts` with `relevantPrograms: ['new-program-id']`
5. If the program has unique KPI assumptions, add them following the steps in "How to Add a New KPI" above

---

## How to Update Accenture Estimates

All Accenture estimates live in `src/state/initialState.ts` in the `BASE_CASE` object. Every estimate is an `Assumption<T>` with `source: 'accenture-estimate'`.

When updating:
- Change the `value` field on the relevant `Assumption`
- Keep `source: 'accenture-estimate'` unless the source changes
- The base case is read-only in the UI (`isBaseCaseLocked: true`) — users who want to explore different values clone it into their own scenario

---

## How to Deploy

This is a static single-page application. The production build (`npm run build`) produces a `dist/` folder that can be deployed anywhere that serves static files.

**Vercel (recommended for quick share):**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
npm run build
# Drag dist/ folder into Netlify UI, or use netlify deploy --prod --dir dist
```

**Azure Static Web Apps / SharePoint embed:** Upload the `dist/` folder contents. The app has no server-side requirements.

**Important:** Add a redirect rule so all routes return `index.html` (React Router handles routing client-side). On Netlify, add `_redirects`:
```
/*  /index.html  200
```

---

## Known Limitations

- **No real LLM:** The Thought Partner uses a local rule-based engine. Responses are grounded in scenario data but are not generative. See "How to Connect a Future Live LLM" above.
- **Industry insights are illustrative:** All benchmark figures shown in the Thought Partner are labeled `ILLUSTRATIVE BENCHMARK` and must be replaced with FME-validated figures before external use.
- **Financial inputs required for full calculation:** Volume uplift, cost per treatment, treatment volume, and supply cost base must be entered by Martin before the full hero output (€M/yr) is shown. The tool shows partial state clearly rather than inventing numbers.
- **Single user, browser-only:** State persists in `localStorage`. No multi-user, no server sync, no version history beyond the current session.
- **Euro-denominated:** All financial outputs are in €M. Currency formatting is not configurable in this version.

---

## Assumptions Requiring FME Validation

Before this tool is used in an executive presentation, FME should validate:

1. **Accenture base case estimates** in `src/state/initialState.ts` — compression months, value realization speed, shared cost percentages
2. **Program-to-outcome mapping** in `src/data/programs.ts` — confirm which outcomes each program actually contributes to
3. **Industry benchmark figures** in `src/services/thoughtPartner/industryInsights.ts` — all marked `isDemoData: true`; replace with FME-specific or validated benchmarks
4. **Value ramp assumptions** in `src/engine/scenarioEngine.ts` — the ramp durations by `valueRealizationSpeed` category

---

## Build / TypeScript / Runtime Status

| Check | Status |
|---|---|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Production build (`vite build`) | Clean · 331kB JS · 8.5kB CSS |
| Runtime console errors | None |
| British spelling (`programme`, `organisation`, etc.) | 0 instances |

---

*Accenture × FME · Confidential*
