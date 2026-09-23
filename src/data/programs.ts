import { Program } from '../types';

export const PROGRAMS: Program[] = [
  {
    id: 'esphora-cd',
    name: 'ESPHORA / CD Transformation',
    shortName: 'ESPHORA / CD',
    description:
      'Clinical Data and ESPHORA modernization enabling unified patient and trial data, streamlined regulatory submission workflows, and a foundation for data-driven clinical operations.',
    outcomes: ['grow-patient-volume', 'scalable-digital-enterprise'],
    accentureHypothesis:
      'Integrated design with EHR creates a shared patient data layer, eliminating duplicate clinical data architecture and accelerating both programs.',
    defaultTimeline: { startMonth: 0, durationMonths: 18 },
  },
  {
    id: 'ehr-patient-care',
    name: 'EHR / Patient Care',
    shortName: 'EHR / Patient Care',
    description:
      'Electronic Health Record implementation transforming point-of-care workflows, patient engagement, and clinical decision support across FME treatment centers.',
    outcomes: [
      'grow-patient-volume',
      'reduce-cost-per-treatment',
      'scalable-digital-enterprise',
    ],
    accentureHypothesis:
      'Integrated design with ESPHORA/CD and Supply Chain enables a single patient-to-cost data model, reducing per-treatment cost and increasing throughput simultaneously.',
    defaultTimeline: { startMonth: 2, durationMonths: 24 },
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    shortName: 'Supply Chain',
    description:
      'End-to-end supply chain transformation optimizing medical supply procurement, inventory management, and logistics to reduce treatment cost and waste.',
    outcomes: ['reduce-cost-per-treatment', 'scalable-digital-enterprise'],
    accentureHypothesis:
      'Integrated design with EHR connects clinical demand signals to procurement in real time, compressing the supply chain program by eliminating a separate demand-modeling workstream.',
    defaultTimeline: { startMonth: 3, durationMonths: 20 },
  },
  {
    id: 'gemini',
    name: 'GEMINI',
    shortName: 'GEMINI',
    description:
      'Enterprise management and intelligence platform providing FME leadership with unified financial, operational, and patient-journey reporting across the organization.',
    outcomes: ['grow-patient-volume', 'scalable-digital-enterprise'],
    accentureHypothesis:
      'GEMINI integrated from the start becomes the intelligence layer for the entire transformation, eliminating the need for program-level reporting built and then discarded by each stream.',
    defaultTimeline: { startMonth: 1, durationMonths: 22 },
  },
];

export const PROGRAM_MAP: Record<string, Program> = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p])
);
