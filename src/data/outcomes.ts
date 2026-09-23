import { EnterpriseOutcome } from '../types';

export const OUTCOMES: EnterpriseOutcome[] = [
  {
    id: 'grow-patient-volume',
    label: 'Grow Patient Volume',
    sublabel: '/ Market Position',
    description:
      "Increase FME's capacity to treat more patients through improved scheduling, reduced cycle times, expanded referral networks, and digitally enabled care pathways.",
    programs: ['esphora-cd', 'ehr-patient-care', 'gemini'],
  },
  {
    id: 'reduce-cost-per-treatment',
    label: 'Reduce Cost',
    sublabel: 'per Treatment',
    description:
      'Drive down the per-treatment cost through supply chain efficiency, clinical workflow optimization, reduced clinical data overhead, and elimination of manual rework.',
    programs: ['ehr-patient-care', 'supply-chain'],
  },
  {
    id: 'scalable-digital-enterprise',
    label: 'Build a Scalable,',
    sublabel: 'Digitally Enabled Enterprise',
    description:
      'Create the integrated technology, data, and operational foundation that allows FME to scale its mission, respond to regulatory change, and sustain transformation gains.',
    programs: ['esphora-cd', 'ehr-patient-care', 'supply-chain', 'gemini'],
  },
];

export const OUTCOME_MAP: Record<string, EnterpriseOutcome> = Object.fromEntries(
  OUTCOMES.map((o) => [o.id, o])
);
