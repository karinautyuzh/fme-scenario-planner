/**
 * XLS VALUE ENGINE
 *
 * Bottom-up formula functions derived from "Fresenius Initiative KPI mapping_Draft.xlsx",
 * specifically the EHR Operational Benefits sheet and other value-driver sheets.
 *
 * These functions compute standalone program value — the benefit each program delivers
 * independently of integration effects. Synergy/integration value is computed separately
 * in the existing scenario engine (sharedCosts, timing compression).
 *
 * Formula sources:
 *  EHR OT:       OT_hours × addressable% × improvement% × blended_rate × (1 + OT_premium)
 *  EHR Turnover: baseline_turnover_cost × improvement%
 *  EHR Backfill: backfill_hours × addressable% × improvement% × blended_rate
 *  SC:           inventory_cost × DIO_improvement% + maverick_spend × reduction%
 *  ESPHORA:      FTE_cost × productivity_improvement% + revenue × DSO_reduction_days / 365
 *  GEMINI:       manufacturing_cost × cost_improvement% + manufacturing_cost × scrap_reduction%
 */

import { ProgramValueInputs } from '../types';
import { CalculationResult } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCalc(
  value: number,
  desc: string,
  inputs?: Record<string, number | string | null>
): CalculationResult {
  return {
    value: Math.round(value * 100) / 100,
    status: 'CALCULATED',
    requiredInputs: [],
    calculationDescription: desc,
    ...(inputs ? { inputs } : {}),
  };
}

function makePartial(
  value: number,
  desc: string,
  missing: string[],
  inputs?: Record<string, number | string | null>
): CalculationResult {
  return {
    value: Math.round(value * 100) / 100,
    status: 'PARTIAL',
    requiredInputs: missing,
    calculationDescription: desc,
    ...(inputs ? { inputs } : {}),
  };
}

function makeMissing(req: string[], desc: string): CalculationResult {
  return { value: null, status: 'REQUIRES_INPUT', requiredInputs: req, calculationDescription: desc };
}

function v(a: ProgramValueInputs[keyof ProgramValueInputs]): number | null {
  return (a as { value: number | null } | undefined)?.value ?? null;
}

// ─── EHR: Overtime Reduction ──────────────────────────────────────────────────
// XLS: OT_hours × addressable% × improvement% × blended_rate × (1 + OT_premium) / 1_000_000

export function calcEhrOvertimeReduction(inp: ProgramValueInputs): CalculationResult {
  const hours = v(inp.ehrAnnualOtHours);
  const addressable = v(inp.ehrOtAddressablePct);
  const improvement = v(inp.ehrOtImprovementPct);
  const nursePct = v(inp.ehrOtNursePct);
  const nurseRate = v(inp.ehrOtNurseRateEur);
  const pctRate = v(inp.ehrOtPctRateEur);
  const otPremium = v(inp.ehrOtPremiumPct);

  const needed: string[] = [
    ...(!hours ? ['Annual OT hours'] : []),
    ...(!addressable ? ['% addressable by EHR'] : []),
    ...(!improvement ? ['OT improvement %'] : []),
    ...(!nursePct ? ['Nurse % of OT hours'] : []),
    ...(!nurseRate ? ['Nurse hourly rate (€)'] : []),
    ...(!pctRate ? ['PCT hourly rate (€)'] : []),
    ...(!otPremium && otPremium !== 0 ? ['OT premium %'] : []),
  ];

  if (needed.length > 0) return makeMissing(needed, 'EHR OT: hours × addressable% × improvement% × blended_rate × (1 + OT_premium)');

  const blendedRate = ((nursePct! / 100) * nurseRate!) + ((1 - nursePct! / 100) * pctRate!);
  const value = hours! * (addressable! / 100) * (improvement! / 100) * blendedRate * (1 + otPremium! / 100) / 1_000_000;

  return makeCalc(
    value,
    `EHR OT: ${hours!.toLocaleString()} hrs × ${addressable}% addressable × ${improvement}% improvement × €${blendedRate.toFixed(2)}/hr × (1 + ${otPremium}% premium)`,
    { 'Blended rate (€/hr)': blendedRate, 'Addressable hours': hours! * (addressable! / 100) }
  );
}

// ─── EHR: Turnover — Hiring & Deployment ─────────────────────────────────────
// XLS: baseline_turnover_cost × improvement%

export function calcEhrTurnoverHiring(inp: ProgramValueInputs): CalculationResult {
  const base = v(inp.ehrTurnoverCostBaseEurM);
  const imp = v(inp.ehrTurnoverImprovementPct);

  const needed = [
    ...(!base ? ['Turnover cost base (€M)'] : []),
    ...(!imp ? ['Turnover improvement %'] : []),
  ];
  if (needed.length > 0) return makeMissing(needed, 'EHR turnover/hiring: baseline_cost × improvement%');

  const value = base! * (imp! / 100);
  return makeCalc(value, `EHR turnover/hiring: €${base}M base × ${imp}% improvement`);
}

// ─── EHR: Backfill Hours ──────────────────────────────────────────────────────
// XLS: backfill_hours × addressable% × improvement% × avg_incremental_rate / 1_000_000

export function calcEhrBackfillReduction(inp: ProgramValueInputs): CalculationResult {
  const hours = v(inp.ehrBackfillHoursBase);
  const addressable = v(inp.ehrBackfillAddressablePct);
  const improvement = v(inp.ehrBackfillImprovementPct);
  const rate = v(inp.ehrBackfillAvgRateEur);

  const needed = [
    ...(!hours ? ['Backfill hours baseline'] : []),
    ...(!addressable ? ['% addressable by EHR'] : []),
    ...(!improvement ? ['Backfill improvement %'] : []),
    ...(!rate ? ['Avg incremental backfill rate (€/hr)'] : []),
  ];
  if (needed.length > 0) return makeMissing(needed, 'EHR backfill: hours × addressable% × improvement% × rate');

  const value = hours! * (addressable! / 100) * (improvement! / 100) * rate! / 1_000_000;
  return makeCalc(
    value,
    `EHR backfill: ${hours!.toLocaleString()} hrs × ${addressable}% addressable × ${improvement}% improvement × €${rate}/hr`
  );
}

// ─── EHR: Total Standalone Value ──────────────────────────────────────────────

export function calcEhrStandaloneValue(inp: ProgramValueInputs): CalculationResult {
  const ot = calcEhrOvertimeReduction(inp);
  const hiring = calcEhrTurnoverHiring(inp);
  const backfill = calcEhrBackfillReduction(inp);

  const components = [ot, hiring, backfill];
  const computed = components.filter((c) => c.value !== null);

  if (computed.length === 0) {
    return makeMissing(
      ['EHR operational value drivers — see Pressure-Test program tab'],
      'EHR standalone value: OT reduction + turnover/hiring reduction + backfill hours reduction'
    );
  }

  const totalValue = computed.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const allMissing = components.filter((c) => c.value === null).flatMap((c) => c.requiredInputs);

  if (computed.length < 3) {
    return makePartial(
      totalValue,
      `EHR standalone value (${computed.length}/3 components calculable): OT + turnover/hiring + backfill`,
      allMissing,
      { 'OT reduction (€M)': ot.value, 'Turnover/hiring reduction (€M)': hiring.value, 'Backfill reduction (€M)': backfill.value }
    );
  }

  return makeCalc(
    totalValue,
    'EHR standalone value (3/3 components): OT reduction + turnover/hiring + backfill hours',
    { 'OT reduction (€M)': ot.value, 'Turnover/hiring reduction (€M)': hiring.value, 'Backfill reduction (€M)': backfill.value }
  );
}

// ─── Supply Chain: Standalone Value ──────────────────────────────────────────
// Inventory DIO improvement + maverick spend reduction

export function calcSupplyChainStandaloneValue(inp: ProgramValueInputs): CalculationResult {
  const invCost = v(inp.scInventoryCostBaseEurM);
  const dioPct = v(inp.scDioImprovementPct);
  const mavSpend = v(inp.scMaverickSpendBaseEurM);
  const mavRed = v(inp.scMaverickReductionPct);

  const computed: CalculationResult[] = [];

  if (invCost !== null && dioPct !== null) {
    const val = invCost * (dioPct / 100);
    computed.push(makeCalc(val, `SC inventory: €${invCost}M × ${dioPct}% DIO improvement`));
  }

  if (mavSpend !== null && mavRed !== null) {
    const val = mavSpend * (mavRed / 100);
    computed.push(makeCalc(val, `SC maverick spend: €${mavSpend}M × ${mavRed}% reduction`));
  }

  if (computed.length === 0) {
    return makeMissing(
      ['Supply chain cost inputs — see Pressure-Test program tab'],
      'Supply chain standalone value: inventory optimization + maverick spend reduction'
    );
  }

  const totalValue = computed.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const missing: string[] = [
    ...((invCost === null || dioPct === null) ? ['Inventory cost base + DIO improvement %'] : []),
    ...((mavSpend === null || mavRed === null) ? ['Maverick spend base + reduction %'] : []),
  ];

  return makePartial(
    totalValue,
    `Supply chain standalone value (${computed.length}/2 components): inventory optimization + maverick spend`,
    missing,
    { 'Inventory DIO benefit (€M)': computed[0]?.value ?? null, 'Maverick spend benefit (€M)': computed.length > 1 ? computed[1]?.value : null }
  );
}

// ─── ESPHORA: Standalone Value ────────────────────────────────────────────────
// Finance FTE productivity + DSO working capital release
// DSO: revenue × (dso_days × improvement%) / 365

export function calcEsphoraStandaloneValue(inp: ProgramValueInputs): CalculationResult {
  const fteCost = v(inp.espFinanceFteCostBaseEurM);
  const fteImp = v(inp.espFteImprovementPct);
  const dso = v(inp.espDsoBaselineDays);
  const dsoImp = v(inp.espDsoImprovementPct);
  const rev = v(inp.espRevenueBaseEurM);

  const computed: CalculationResult[] = [];

  if (fteCost !== null && fteImp !== null) {
    const val = fteCost * (fteImp / 100);
    computed.push(makeCalc(val, `ESPHORA FTE productivity: €${fteCost}M × ${fteImp}%`));
  }

  if (dso !== null && dsoImp !== null && rev !== null) {
    const daysSaved = dso * (dsoImp / 100);
    const val = rev * daysSaved / 365;
    computed.push(makeCalc(val, `ESPHORA DSO: €${rev}M revenue × ${daysSaved.toFixed(1)} days saved / 365`));
  }

  if (computed.length === 0) {
    return makeMissing(
      ['ESPHORA finance inputs — see Pressure-Test program tab'],
      'ESPHORA standalone value: FTE productivity + DSO working capital release'
    );
  }

  const totalValue = computed.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const missing: string[] = [
    ...((fteCost === null || fteImp === null) ? ['Finance FTE cost base + improvement %'] : []),
    ...((dso === null || dsoImp === null || rev === null) ? ['DSO days + improvement % + revenue base'] : []),
  ];

  if (missing.length === 0) {
    return makeCalc(
      totalValue,
      'ESPHORA standalone value (2/2): FTE productivity + DSO working capital',
      { 'FTE productivity (€M)': computed[0]?.value ?? null, 'DSO working capital (€M)': computed[1]?.value ?? null }
    );
  }

  return makePartial(
    totalValue,
    `ESPHORA standalone value (${computed.length}/2 components): FTE + DSO`,
    missing,
    { 'FTE productivity (€M)': computed[0]?.value ?? null, 'DSO working capital (€M)': computed.length > 1 ? computed[1]?.value : null }
  );
}

// ─── GEMINI: Standalone Value ─────────────────────────────────────────────────
// Production cost improvement + scrap reduction

export function calcGeminiStandaloneValue(inp: ProgramValueInputs): CalculationResult {
  const mfgCost = v(inp.gemManufacturingCostBaseEurM);
  const costImp = v(inp.gemProductionCostImprovementPct);
  const scrapBase = v(inp.gemScrapRateBaselinePct);
  const scrapTarget = v(inp.gemScrapRateTargetPct);

  const computed: CalculationResult[] = [];

  if (mfgCost !== null && costImp !== null) {
    const val = mfgCost * (costImp / 100);
    computed.push(makeCalc(val, `GEMINI production cost: €${mfgCost}M × ${costImp}%`));
  }

  if (mfgCost !== null && scrapBase !== null && scrapTarget !== null) {
    const scrapReductionPp = scrapBase - scrapTarget;
    if (scrapReductionPp > 0) {
      const val = mfgCost * (scrapReductionPp / 100);
      computed.push(makeCalc(val, `GEMINI scrap: €${mfgCost}M × ${scrapReductionPp.toFixed(1)}pp scrap reduction`));
    }
  }

  if (computed.length === 0) {
    return makeMissing(
      ['GEMINI manufacturing cost inputs — see Pressure-Test program tab'],
      'GEMINI standalone value: production cost reduction + scrap reduction'
    );
  }

  const totalValue = computed.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const missing: string[] = [
    ...((mfgCost === null || costImp === null) ? ['Manufacturing cost base + cost improvement %'] : []),
    ...((mfgCost === null || scrapBase === null || scrapTarget === null) ? ['Scrap rate baseline + target'] : []),
  ];

  if (missing.length === 0) {
    return makeCalc(
      totalValue,
      'GEMINI standalone value (2/2): production cost + scrap reduction',
      { 'Production cost improvement (€M)': computed[0]?.value ?? null, 'Scrap reduction (€M)': computed[1]?.value ?? null }
    );
  }

  return makePartial(
    totalValue,
    `GEMINI standalone value (${computed.length} component${computed.length !== 1 ? 's' : ''}): production cost + scrap`,
    missing.filter(Boolean)
  );
}

// ─── Master Dispatch ──────────────────────────────────────────────────────────

export function calcProgramStandaloneValue(
  programId: string,
  inputs: ProgramValueInputs
): CalculationResult {
  switch (programId) {
    case 'ehr-patient-care': return calcEhrStandaloneValue(inputs);
    case 'supply-chain': return calcSupplyChainStandaloneValue(inputs);
    case 'esphora-cd': return calcEsphoraStandaloneValue(inputs);
    case 'gemini': return calcGeminiStandaloneValue(inputs);
    default:
      return { value: null, status: 'NOT_APPLICABLE', requiredInputs: [], calculationDescription: 'No XLS value model for this program.' };
  }
}

// ─── All-Programs Aggregate ───────────────────────────────────────────────────

export function calcAllStandaloneValues(
  selectedPrograms: string[],
  programValueInputs: Record<string, ProgramValueInputs>
): { byProgram: Record<string, CalculationResult>; total: CalculationResult } {
  const byProgram: Record<string, CalculationResult> = {};

  for (const pid of selectedPrograms) {
    byProgram[pid] = calcProgramStandaloneValue(pid, programValueInputs[pid] ?? {});
  }

  const computed = Object.values(byProgram).filter((r) => r.value !== null);

  if (computed.length === 0) {
    return {
      byProgram,
      total: makeMissing(
        ['Program value drivers — enter in Pressure-Test per program tab'],
        'Total XLS-derived standalone value across all selected programs'
      ),
    };
  }

  const totalValue = computed.reduce((sum, r) => sum + (r.value ?? 0), 0);
  const hasPartial = computed.some((r) => r.status === 'PARTIAL');
  const allMissing = Object.values(byProgram)
    .filter((r) => r.value === null)
    .flatMap((r) => r.requiredInputs);

  const inputs: Record<string, number | string | null> = {};
  for (const [pid, r] of Object.entries(byProgram)) {
    if (r.value !== null) inputs[pid] = r.value;
  }

  const status = (hasPartial || computed.length < selectedPrograms.length) ? 'PARTIAL' : 'CALCULATED';

  return {
    byProgram,
    total: {
      value: Math.round(totalValue * 100) / 100,
      status,
      requiredInputs: allMissing,
      calculationDescription: `Total standalone value (${computed.length}/${selectedPrograms.length} programs calculable): sum of XLS-derived program values`,
      inputs,
    },
  };
}
