import { ThoughtPartnerContext, ThoughtPartnerIntent, ThoughtPartnerResponse, IndustryInsight } from './types';
import { INDUSTRY_INSIGHTS, getInsightsForPrograms, getInsightsByTopic } from './industryInsights';

// ─── Intent Detection ──────────────────────────────────────────────────────────

export function detectIntent(message: string): ThoughtPartnerIntent {
  const lower = message.toLowerCase();

  if (/(missing|need|required|unlock|what.*need|still need|haven.t entered|baseline)/i.test(lower))
    return 'MISSING_INPUTS';
  if (/(compress|speed up|faster delivery|timeline|timing|months earlier|delay|earlier start|how.*long)/i.test(lower))
    return 'TIMELINE';
  if (/(sensitive|sensitivity|what.*if|what if|what happen|change.*assumption|impact of|effect of|scenario.*where)/i.test(lower))
    return 'SENSITIVITY';
  if (/(driver|contribute|biggest|most.*value|top.*value|what.*drive|key.*lever|main.*lever)/i.test(lower))
    return 'VALUE_DRIVERS';
  if (/(add.*program|which.*program|program.*add|include.*program|minimum.*program|set.*achieve)/i.test(lower))
    return 'ADD_PROGRAM';
  if (/(compare|comparison|difference|vs\.|versus|base case|other scenario|both scenario)/i.test(lower))
    return 'SCENARIO_DIFF';
  if (/(benchmark|industry|peer|typical|average|other.*compan|market.*data|research|studies)/i.test(lower))
    return 'INDUSTRY_INSIGHT';
  if (/(calculat|how.*work|formula|compute|derive|explain.*calc|methodology|model work)/i.test(lower))
    return 'CALCULATION';

  return 'GENERAL';
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtEur(v: number, status?: string): string {
  return `€${v.toFixed(1)}M${status === 'PARTIAL' ? '+' : ''}`;
}

function programIdsFromNames(names: string[]): string[] {
  return names.map((name) => {
    if (name.includes('EHR')) return 'ehr-patient-care';
    if (name.includes('Supply')) return 'supply-chain';
    if (name.includes('ESPHORA')) return 'esphora-cd';
    if (name.includes('GEMINI')) return 'gemini';
    return name.toLowerCase().replace(/\s+/g, '-');
  });
}

// ─── Response Generators ───────────────────────────────────────────────────────

function respondToMissingInputs(ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  if (ctx.missingFinancialInputs.length === 0) {
    return {
      content: `"${ctx.scenarioName}" has all the financial baseline inputs needed to run the full value calculation. The model has what it needs.\n\nYou can now explore sensitivity scenarios — try cloning and adjusting individual assumptions — or head to **Compare Value** to see the value realization curve.`,
      intent: 'MISSING_INPUTS',
      suggestedFollowUps: [
        'Walk me through how the annual value is calculated.',
        'Which assumptions drive the most total value?',
        'How does running programs together accelerate value versus separately?',
      ],
    };
  }

  const missingList = ctx.missingFinancialInputs.map((m) => `• ${m}`).join('\n');
  const partialNote =
    ctx.totalAnnualValueEurM !== null
      ? `\n\nThe model is currently calculating a **partial total of ${fmtEur(ctx.totalAnnualValueEurM, ctx.totalAnnualValueStatus)}/yr** from the inputs already entered. Adding the missing baselines will complete it.`
      : '';

  return {
    content: `To complete the value calculation for "${ctx.scenarioName}", these financial baselines are still needed:\n\n${missingList}${partialNote}\n\nEnter these in **Pressure Test → Advanced Assumptions → Financial Baselines**. Once entered, the engine will calculate the full annual business value and generate the value realization curve.`,
    intent: 'MISSING_INPUTS',
    suggestedFollowUps: [
      'Walk me through how the annual value is calculated.',
      'Which assumptions drive the most total value?',
    ],
  };
}

function respondToTimeline(ctx: ThoughtPartnerContext, _message: string): ThoughtPartnerResponse {
  const hasCompression = ctx.compressionMonths !== null && ctx.compressionMonths > 0;

  const speedLabel =
    ctx.valueRealizationSpeed === 'faster'
      ? 'faster than expected'
      : ctx.valueRealizationSpeed === 'slower'
        ? 'slower than expected'
        : 'at expected pace';

  const integrationInsights = INDUSTRY_INSIGHTS.filter((i) => i.topic === 'integration-speed');

  if (!hasCompression) {
    return {
      content: `No delivery compression is set in "${ctx.scenarioName}" yet. Based on the selected programs, the value start dates are:\n\n• **Separate program delivery:** ${ctx.separateValueStartLabel}\n• **Integrated delivery (current setting):** ${ctx.integratedValueStartLabel}\n\nDelivery compression reflects how many months integration saves by eliminating redundant workstreams. To set it, use the compression slider in **Pressure Test → Section 02**.\n\nValue realization speed is currently set to ${speedLabel}, which affects how quickly the scenario ramps from go-live to full run-rate value.`,
      intent: 'TIMELINE',
      suggestedFollowUps: [
        'What industry benchmarks exist for how much integration accelerates value?',
        'How does value realization speed affect the calculation?',
        'Walk me through how the annual value is calculated.',
      ],
      insights: integrationInsights,
    };
  }

  let accelerationText = '';
  if (ctx.valueAccelerated2030EurM !== null) {
    accelerationText = `\n\nBy 2030, this integration advantage is worth **${fmtEur(ctx.valueAccelerated2030EurM)} in accelerated cumulative value** compared to running programs separately — that is the gap between the integrated and separate curves on the value realization chart.`;
  }

  return {
    content: `"${ctx.scenarioName}" uses **${ctx.compressionMonths} months** of delivery compression, with value realization running ${speedLabel}.\n\n• **Separate program value start:** ${ctx.separateValueStartLabel}\n• **Integrated value start:** ${ctx.integratedValueStartLabel}${accelerationText}\n\nTo test a different compression setting, any edit in **Pressure Test** will create a new scenario. You can then compare both in the **Compare Value** tab — the value curve chart shows integrated vs. separate side by side.`,
    intent: 'TIMELINE',
    suggestedFollowUps: [
      ctx.valueAccelerated2030EurM !== null
        ? 'How does the value acceleration calculation work?'
        : 'What industry benchmarks exist for how much integration accelerates value?',
      'How does value realization speed affect the ramp calculation?',
      ctx.scenarioCount > 1
        ? 'How does this scenario compare to the others?'
        : 'How sensitive is total value to delivery speed?',
    ],
    insights: integrationInsights,
  };
}

function respondToValueDrivers(ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  if (ctx.selectedProgramCount === 0) {
    return {
      content: `No programs are selected in "${ctx.scenarioName}" yet. Select programs in the **Choose Programs** tab to define the scope of the transformation, then come back here to analyze what drives value in your scenario.`,
      intent: 'VALUE_DRIVERS',
      suggestedFollowUps: ['Which programs should I start with?', 'Walk me through how the annual value is calculated.'],
    };
  }

  const drivers: string[] = [];

  if (ctx.patientVolumeUpliftPct !== null) {
    drivers.push(
      `**Patient volume uplift (${ctx.patientVolumeUpliftPct}%):** Value = annual treatment volume × uplift % × value per incremental treatment × value capture %. Requires both volume and per-treatment value baselines.`
    );
  } else {
    drivers.push(
      `**Patient volume uplift:** Not yet set — enter a % in Pressure Test → Section 01 to activate this lever.`
    );
  }

  if (ctx.costPerTreatmentImprovementPct !== null) {
    drivers.push(
      `**Cost per treatment reduction (${ctx.costPerTreatmentImprovementPct}%):** Applied to cost-per-treatment baseline × annual volume × value capture %. The cost baseline is the key financial input here.`
    );
  } else {
    drivers.push(
      `**Cost per treatment reduction:** Not yet set — enter a % in Pressure Test → Section 01 to activate this lever.`
    );
  }

  if (ctx.supplyWasteReductionPct !== null) {
    drivers.push(
      `**Supply waste reduction (${ctx.supplyWasteReductionPct}%):** Applied to supply consumable cost base × value capture %. Only active once the supply cost baseline is entered.`
    );
  } else {
    drivers.push(
      `**Supply waste reduction:** Not yet set — enter a % in Pressure Test → Section 01 to activate this lever.`
    );
  }

  const captureNote =
    ctx.overallValueCapturePct !== null
      ? `\n\n**Value capture rate (${ctx.overallValueCapturePct}%)** acts as a multiplier across all three components. It represents how much of the theoretical benefit is captured through adoption and change management. Increasing it from 60% to 75% has the same effect as increasing each underlying assumption by 25%.`
      : '';

  const totalText =
    ctx.totalAnnualValueEurM !== null
      ? `\n\nCurrent modeled annual value: **${fmtEur(ctx.totalAnnualValueEurM, ctx.totalAnnualValueStatus)}/yr** (${ctx.totalAnnualValueStatus === 'PARTIAL' ? 'partial — some baselines still missing' : 'fully calculated'}).`
      : '';

  return {
    content: `Value drivers in "${ctx.scenarioName}":\n\n${drivers.join('\n\n')}${captureNote}${totalText}`,
    intent: 'VALUE_DRIVERS',
    suggestedFollowUps: [
      'How sensitive is total value to the value capture rate?',
      ctx.missingFinancialInputs.length > 0 ? 'What inputs do I still need to unlock the full value calculation?' : 'Walk me through how the annual value is calculated.',
      'What industry benchmarks exist for these value drivers?',
    ],
    insights: getInsightsForPrograms(ctx.selectedProgramIds).slice(0, 2),
  };
}

function respondToCalculation(ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  const hasValue = ctx.totalAnnualValueEurM !== null;
  const currentValueLine = hasValue
    ? `\n\nFor "${ctx.scenarioName}", the current total is **${fmtEur(ctx.totalAnnualValueEurM!, ctx.totalAnnualValueStatus)}/yr**${ctx.totalAnnualValueStatus === 'PARTIAL' ? ' (partial — some baselines still missing)' : ''}.`
    : `\n\nFor "${ctx.scenarioName}", the calculation requires additional financial baselines before a total can be computed.`;

  return {
    content: `The value model has three annual business value components:\n\n**1. Patient Volume Uplift Value**\nAnnual treatment volume × volume uplift % × value per incremental treatment × value capture %\n\n**2. Cost per Treatment Benefit**\nAnnual treatment volume × cost per treatment € × improvement % × value capture %\n\n**3. Supply Waste Benefit**\nSupply consumable cost base × waste reduction % × value capture %${currentValueLine}\n\n**Value Acceleration** is calculated separately: the difference between integrated cumulative value and separate cumulative value at a given year (2030 or 2035), using a ramp curve that accelerates from zero to run-rate over the ramp period.\n\nAll calculations are visible with a **"How is this calculated?"** link in Pressure Test and Compare Value.`,
    intent: 'CALCULATION',
    suggestedFollowUps: [
      'Which assumptions drive the most total value?',
      ctx.missingFinancialInputs.length > 0
        ? 'What inputs do I still need to unlock the full value calculation?'
        : 'How does value realization speed affect the ramp calculation?',
      'How does running programs together accelerate value versus separately?',
    ],
  };
}

function respondToScenarioDiff(ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  if (ctx.scenarioCount <= 1) {
    return {
      content: `You currently only have one scenario — "${ctx.scenarioName}". To compare scenarios, create a second one by editing any assumption in **Pressure Test** — the app will automatically clone the base case and prompt you to name the new scenario.\n\nThen go to **Compare Value** to see a side-by-side view with summary cards, a 15-row comparison table, and value realization curves plotted together from 2026–2035.`,
      intent: 'SCENARIO_DIFF',
      suggestedFollowUps: [
        'Which assumptions would be most worth testing in a second scenario?',
        'How sensitive is total value to the value capture rate?',
        'What would change if I compressed delivery by 6 months?',
      ],
    };
  }

  const others = ctx.allScenarioNames.filter((n) => n !== ctx.scenarioName);
  const valueClause =
    ctx.totalAnnualValueEurM !== null
      ? ` (currently ${fmtEur(ctx.totalAnnualValueEurM, ctx.totalAnnualValueStatus)}/yr)`
      : '';

  return {
    content: `You have **${ctx.scenarioCount} scenarios**: ${ctx.allScenarioNames.map((n) => `"${n}"`).join(', ')}.\n\nThe active scenario is **"${ctx.scenarioName}"**${valueClause}. The other${others.length > 1 ? 's' : ''} — ${others.map((n) => `"${n}"`).join(', ')} — can be compared in the **Compare Value** tab.\n\nThat tab shows:\n• Summary cards with total annual value per scenario\n• A 15-row comparison table across business outcomes, costs, timing, and acceleration\n• Value curves plotted together from 2026–2035\n\nYou can select up to 3 scenarios at once for comparison.`,
    intent: 'SCENARIO_DIFF',
    suggestedFollowUps: [
      'What is driving the difference between scenarios?',
      'How does the value acceleration calculation work?',
    ],
  };
}

function respondToIndustryInsight(ctx: ThoughtPartnerContext, message: string): ThoughtPartnerResponse {
  let relevantInsights: IndustryInsight[] = [];

  if (/ehr|patient|volume|no.?show|cancellat/i.test(message)) {
    relevantInsights = [
      ...getInsightsByTopic('volume-uplift'),
      ...getInsightsByTopic('cost-reduction'),
    ];
  } else if (/supply|waste|inventory|consumable/i.test(message)) {
    relevantInsights = getInsightsByTopic('supply-waste');
  } else if (/gemini|report/i.test(message)) {
    relevantInsights = getInsightsByTopic('reporting-consolidation');
  } else if (/capture|adoption|change.*management/i.test(message)) {
    relevantInsights = getInsightsByTopic('value-capture');
  } else if (/integrat|compress|speed|acceler|earlier/i.test(message)) {
    relevantInsights = getInsightsByTopic('integration-speed');
  } else if (/ramp|go.?live|full.*value/i.test(message)) {
    relevantInsights = getInsightsByTopic('ramp-speed');
  } else {
    relevantInsights = getInsightsForPrograms(ctx.selectedProgramIds).slice(0, 3);
  }

  if (relevantInsights.length === 0) {
    relevantInsights = INDUSTRY_INSIGHTS.slice(0, 2);
  }

  const insightText = relevantInsights
    .slice(0, 3)
    .map((i) => `**[${i.sourceLabel}]**\n${i.claim}`)
    .join('\n\n');

  return {
    content: `Here are relevant reference points:\n\n${insightText}\n\n⚠ These are illustrative benchmarks and Accenture hypotheses — they are **not sourced from FME-specific data**. Use them as directional context, not as targets. Validate against FME's own operational history before using in a business case.`,
    intent: 'INDUSTRY_INSIGHT',
    insights: relevantInsights.slice(0, 3),
    suggestedFollowUps: [
      'How do these benchmarks compare to my current assumptions?',
      'Which assumptions drive the most total value?',
      ctx.missingFinancialInputs.length > 0
        ? 'What inputs do I still need to unlock the full value calculation?'
        : 'How sensitive is total value to the value capture rate?',
    ],
  };
}

function respondToAddProgram(ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  const ALL_PROGRAMS = [
    { id: 'esphora-cd', name: 'ESPHORA / CD', outcomes: 'Grow patient volume, scalable digital enterprise' },
    { id: 'ehr-patient-care', name: 'EHR / Patient Care', outcomes: 'All three outcomes — the broadest coverage' },
    { id: 'supply-chain', name: 'Supply Chain', outcomes: 'Reduce cost per treatment, scalable digital enterprise' },
    { id: 'gemini', name: 'GEMINI', outcomes: 'Grow patient volume, scalable digital enterprise' },
  ];

  const notSelected = ALL_PROGRAMS.filter((p) => !ctx.selectedProgramIds.includes(p.id));

  if (notSelected.length === 0) {
    return {
      content: `All programs are already included in "${ctx.scenarioName}" — this is the full integrated scenario.\n\nWith all programs active, the integration benefits are maximized:\n• Shared data layer eliminates duplicate architecture across all streams\n• Single change management program across the transformation\n• Value acceleration is at its highest because all programs benefit from integrated design`,
      intent: 'ADD_PROGRAM',
      suggestedFollowUps: [
        'How does running programs together accelerate value versus separately?',
        'Walk me through how the annual value is calculated.',
      ],
    };
  }

  const addableList = notSelected
    .map((p) => `• **${p.name}:** ${p.outcomes}`)
    .join('\n');

  return {
    content: `Programs not yet in "${ctx.scenarioName}":\n\n${addableList}\n\nTo add programs, go to the **Choose Programs** tab. If you are on the base case scenario, any change creates a new scenario automatically — so your base case remains intact.\n\nEach additional program adds to the shared cost benefit pool and may extend the value start timeline, but also increases the integration acceleration advantage.`,
    intent: 'ADD_PROGRAM',
    suggestedFollowUps: [
      'What industry benchmarks exist for EHR-led patient volume uplift?',
      'Which assumptions drive the most total value?',
    ],
  };
}

function respondToSensitivity(ctx: ThoughtPartnerContext, message: string): ThoughtPartnerResponse {
  const compressionMatch = message.match(/(\d+)\s*month/i);
  const requestedCompression = compressionMatch ? parseInt(compressionMatch[1]) : null;
  const currentCompression = ctx.compressionMonths ?? 0;

  if (requestedCompression !== null && requestedCompression !== currentCompression) {
    const hasValue = ctx.totalAnnualValueEurM !== null;
    return {
      content: `You're asking about ${requestedCompression} months of compression — "${ctx.scenarioName}" currently uses ${currentCompression === 0 ? 'no compression' : `${currentCompression} months`}.\n\nThe best way to explore this:\n1. ${currentCompression === 0 ? 'Edit any assumption to create a new scenario' : 'Your current scenario is ready'}\n2. Set compression to ${requestedCompression} months in **Pressure Test → Section 02**\n3. Compare both in **Compare Value** — the value curve chart shows the difference directly\n\n${hasValue ? `The acceleration advantage compounds over time, so the gap between the two curves is most pronounced in the 2028–2032 window.` : `Once financial baselines are entered, the value curve will show the cumulative difference between the two compression settings.`}`,
      intent: 'SENSITIVITY',
      suggestedFollowUps: [
        'How does the value acceleration calculation work?',
        'What industry benchmarks exist for how much integration accelerates value?',
      ],
    };
  }

  if (ctx.totalAnnualValueEurM === null) {
    return {
      content: `To run sensitivity analysis, the value calculation needs financial baseline inputs first. Once entered, sensitivity testing works by cloning the scenario, adjusting one assumption, and comparing both in **Compare Value**.\n\nThe assumptions with the highest leverage on total outcome are typically:\n• **Value capture rate %** — multiplies across all value components\n• **Annual treatment volume** — the base for volume and cost calculations\n• **Delivery compression** — affects timing of value realization, not annual run rate`,
      intent: 'SENSITIVITY',
      suggestedFollowUps: ['What inputs do I still need to unlock the full value calculation?'],
    };
  }

  return {
    content: `The scenario planner is built for sensitivity testing through comparison:\n\n**How to test an assumption:**\n1. Any edit to "${ctx.scenarioName}" creates a new scenario — the original is preserved\n2. Adjust the single assumption you want to test (compression, uplift %, value capture, ramp speed)\n3. Compare both in **Compare Value** — 15-row table + side-by-side value curves\n\n**High-leverage assumptions** to consider:\n• **Value capture rate %** — multiplies across all components simultaneously\n• **Delivery compression** — affects when value starts, compounding over time\n• **Volume uplift %** combined with the value-per-treatment baseline\n\nCurrent scenario: **"${ctx.scenarioName}"** — ${fmtEur(ctx.totalAnnualValueEurM, ctx.totalAnnualValueStatus)}/yr.`,
    intent: 'SENSITIVITY',
    suggestedFollowUps: [
      'How does running programs together accelerate value versus separately?',
      'Which assumptions drive the most total value?',
    ],
  };
}

function respondToGeneral(ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  const hasValue = ctx.totalAnnualValueEurM !== null;
  const hasMissing = ctx.missingFinancialInputs.length > 0;

  let statusText: string;
  if (hasValue) {
    statusText = `"${ctx.scenarioName}" shows **${fmtEur(ctx.totalAnnualValueEurM!, ctx.totalAnnualValueStatus)}/yr** in modeled annual value with ${ctx.selectedProgramCount} program${ctx.selectedProgramCount !== 1 ? 's' : ''} in scope.`;
  } else if (hasMissing) {
    statusText = `"${ctx.scenarioName}" needs a few more financial baseline inputs before the value calculation can run.`;
  } else {
    statusText = `I've loaded "${ctx.scenarioName}". Ready to explore your scenario.`;
  }

  return {
    content: `${statusText}\n\nI can help you:\n• **Understand** what inputs are still needed to unlock the calculation\n• **Analyze** which assumptions have the most leverage on total value\n• **Explain** the calculation methodology in plain terms\n• **Explore** delivery timing and compression trade-offs\n• **Find** relevant industry benchmarks (clearly labeled as illustrative)\n• **Compare** this scenario to others you have built\n\nWhat would you like to explore?`,
    intent: 'GENERAL',
    suggestedFollowUps: [
      hasMissing
        ? 'What inputs do I still need to unlock the full value calculation?'
        : 'Which assumptions drive the most total value?',
      hasValue
        ? 'Walk me through how the annual value is calculated.'
        : 'How do I set up my financial baselines?',
      ctx.compressionMonths
        ? 'How does running programs together accelerate value versus separately?'
        : 'What would change if I compressed delivery by 6 months?',
    ],
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function processMessage(message: string, ctx: ThoughtPartnerContext): ThoughtPartnerResponse {
  const intent = detectIntent(message);

  switch (intent) {
    case 'MISSING_INPUTS':
      return respondToMissingInputs(ctx);
    case 'TIMELINE':
      return respondToTimeline(ctx, message);
    case 'VALUE_DRIVERS':
      return respondToValueDrivers(ctx);
    case 'CALCULATION':
      return respondToCalculation(ctx);
    case 'SCENARIO_DIFF':
      return respondToScenarioDiff(ctx);
    case 'INDUSTRY_INSIGHT':
      return respondToIndustryInsight(ctx, message);
    case 'ADD_PROGRAM':
      return respondToAddProgram(ctx);
    case 'SENSITIVITY':
      return respondToSensitivity(ctx, message);
    default:
      return respondToGeneral(ctx);
  }
}
