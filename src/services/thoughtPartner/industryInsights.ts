import { IndustryInsight } from './types';

// All insights are illustrative benchmarks or Accenture hypotheses.
// None are sourced from FME-specific data. Label clearly in UI.
export const INDUSTRY_INSIGHTS: IndustryInsight[] = [
  {
    id: 'ehr-volume-uplift',
    topic: 'volume-uplift',
    claim:
      'EHR implementations at specialty care providers have been associated with 8–15% reductions in no-show and cancellation rates through automated scheduling workflows and patient reminders.',
    sourceLabel: 'ILLUSTRATIVE BENCHMARK',
    detail:
      'Composite pattern from healthcare IT transformation case studies. Not sourced from FME-specific data. Validate against your own historic no-show rates before using as a target.',
    relevantPrograms: ['ehr-patient-care'],
    isDemoData: true,
  },
  {
    id: 'ehr-cost-reduction',
    topic: 'cost-reduction',
    claim:
      'EHR programs with integrated clinical workflows can reduce administrative cost per treatment through documentation automation and reduced rework, with ranges of 5–12% depending on current process maturity.',
    sourceLabel: 'ILLUSTRATIVE BENCHMARK',
    detail:
      'Clinical workflow automation and reduced duplicate documentation are the primary cost levers. Magnitude depends heavily on how manual the current baseline is.',
    relevantPrograms: ['ehr-patient-care'],
    isDemoData: true,
  },
  {
    id: 'supply-chain-waste',
    topic: 'supply-waste',
    claim:
      'Integrated supply chain programs in medical device and specialty pharma settings typically target 10–20% reductions in consumable waste through improved demand visibility and inventory positioning.',
    sourceLabel: 'ILLUSTRATIVE BENCHMARK',
    detail:
      'Composite benchmark from supply chain transformation engagements. Actual results depend on current inventory visibility, procurement maturity, and demand forecasting capability. The higher end requires real-time EHR-to-procurement integration.',
    relevantPrograms: ['supply-chain'],
    isDemoData: true,
  },
  {
    id: 'integrated-vs-separate-speed',
    topic: 'integration-speed',
    claim:
      'Programs designed as an integrated set from the outset typically realize value 3–9 months earlier than programs executed sequentially, due to shared data architecture and unified change management.',
    sourceLabel: 'ACCENTURE HYPOTHESIS',
    detail:
      'The compression advantage comes from eliminating redundant workstreams (separate data integrations, separate change management programs, separate reporting builds). Accenture hypothesis — not independently published research.',
    relevantPrograms: ['esphora-cd', 'ehr-patient-care', 'supply-chain', 'gemini'],
    isDemoData: true,
  },
  {
    id: 'value-capture-rate',
    topic: 'value-capture',
    claim:
      'Sustained value capture rates of 60–80% are achievable with structured change management, governance, and adoption programs. Organizations without explicit value realization programs typically capture 40–55%.',
    sourceLabel: 'ACCENTURE HYPOTHESIS',
    detail:
      'Value capture rate represents how much of the theoretical financial benefit is actually realized through behavioral change, process adoption, and governance. Investing in change management directly increases this rate.',
    relevantPrograms: ['esphora-cd', 'ehr-patient-care', 'supply-chain', 'gemini'],
    isDemoData: true,
  },
  {
    id: 'gemini-reporting-consolidation',
    topic: 'reporting-consolidation',
    claim:
      'Unified enterprise reporting platforms integrated from the start of a transformation reduce management reporting effort by 20–40% by eliminating program-level shadow reporting and temporary dashboards.',
    sourceLabel: 'ILLUSTRATIVE BENCHMARK',
    detail:
      'When GEMINI is integrated from day one, each program team avoids building its own temporary reporting infrastructure — a common source of wasted effort in large transformations that is often not tracked or measured.',
    relevantPrograms: ['gemini'],
    isDemoData: true,
  },
  {
    id: 'ramp-to-full-value',
    topic: 'ramp-speed',
    claim:
      'Large-scale EHR and supply chain transformations in healthcare typically take 12–30 months to ramp from go-live to full run-rate value, depending on organizational change management investment.',
    sourceLabel: 'ILLUSTRATIVE BENCHMARK',
    detail:
      'The ramp period reflects the time needed for process adoption, workflow optimization, and behavioral change after system go-live. Faster realization requires intensive change management and executive sponsorship.',
    relevantPrograms: ['ehr-patient-care', 'supply-chain'],
    isDemoData: true,
  },
];

export function getInsightsForPrograms(programIds: string[]): IndustryInsight[] {
  return INDUSTRY_INSIGHTS.filter((i) =>
    i.relevantPrograms.some((p) => programIds.includes(p))
  );
}

export function getInsightsByTopic(topic: string): IndustryInsight[] {
  return INDUSTRY_INSIGHTS.filter((i) => i.topic === topic);
}
