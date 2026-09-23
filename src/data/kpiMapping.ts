import { ProgramId } from '../types';

export interface KpiControl {
  field: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  description: string;
}

// KPIs that surface in Pressure-Test when the given program is selected
export const PROGRAM_KPIS: Record<ProgramId, KpiControl[]> = {
  'ehr-patient-care': [
    {
      field: 'noShowRateReductionPct',
      label: 'No-Show Rate Reduction',
      unit: '%',
      min: 0,
      max: 50,
      step: 1,
      formatValue: (v) => `-${v}%`,
      description: 'Reduction in patient no-show / DNA rate through proactive reminders and scheduling optimization.',
    },
    {
      field: 'cancellationRateReductionPct',
      label: 'Late Cancellation Reduction',
      unit: '%',
      min: 0,
      max: 50,
      step: 1,
      formatValue: (v) => `-${v}%`,
      description: 'Reduction in late cancellations through improved patient engagement and appointment management.',
    },
  ],
  'supply-chain': [
    {
      field: 'inventoryTurnsImprovementPct',
      label: 'Inventory Turns Improvement',
      unit: '%',
      min: 0,
      max: 40,
      step: 1,
      formatValue: (v) => `+${v}%`,
      description: 'Improvement in inventory turns through demand-driven procurement and reduced safety stock.',
    },
    {
      field: 'stockoutReductionPct',
      label: 'Stockout Event Reduction',
      unit: '%',
      min: 0,
      max: 80,
      step: 5,
      formatValue: (v) => `-${v}%`,
      description: 'Reduction in supply stockout incidents through real-time inventory visibility and automated reorder.',
    },
  ],
  'esphora-cd': [
    {
      field: 'noShowRateReductionPct',
      label: 'No-Show Rate Reduction',
      unit: '%',
      min: 0,
      max: 50,
      step: 1,
      formatValue: (v) => `-${v}%`,
      description: 'Clinical data improvements enable better patient engagement and reduced no-shows.',
    },
  ],
  'gemini': [
    {
      field: 'financeProductivityImprovementPct',
      label: 'Finance Productivity Improvement',
      unit: '%',
      min: 0,
      max: 30,
      step: 1,
      formatValue: (v) => `+${v}%`,
      description: 'Finance function productivity gain through integrated reporting, automation, and reduced manual close cycles.',
    },
    {
      field: 'dsoReductionPct',
      label: 'DSO Reduction',
      unit: '%',
      min: 0,
      max: 30,
      step: 1,
      formatValue: (v) => `-${v}%`,
      description: 'Reduction in Days Sales Outstanding through improved billing accuracy and collections automation.',
    },
  ],
};

// Return unique KPI controls for a given set of selected programs (deduped by field)
export function getActiveKpis(selectedPrograms: ProgramId[]): KpiControl[] {
  const seen = new Set<string>();
  const result: KpiControl[] = [];
  for (const pid of selectedPrograms) {
    for (const kpi of PROGRAM_KPIS[pid] ?? []) {
      if (!seen.has(kpi.field)) {
        seen.add(kpi.field);
        result.push(kpi);
      }
    }
  }
  return result;
}
