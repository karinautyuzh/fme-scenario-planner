import { ProgramLibraryEntry } from '../types';

// ─── Overlap Types ────────────────────────────────────────────────────────────

export type OverlapLevel = 'none' | 'low' | 'medium' | 'high';

export interface OverlapDimension {
  id: string;
  label: string;
  score: number;         // 0–100
  level: OverlapLevel;
  evidence: string;
  involvedPrograms: string[];
  potentialSynergy: string;
  whatMustBeTrue: string;
}

export interface OverlapAnalysis {
  dimensions: OverlapDimension[];
  overallScore: number;
  overallLevel: OverlapLevel;
  caseForConsolidation: number;  // 0–100
  caseLevel: OverlapLevel;
  caseRationale: string;
  numPrograms: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelFromScore(score: number): OverlapLevel {
  if (score < 20) return 'none';
  if (score < 45) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

function impactToScore(v: 'none' | 'low' | 'medium' | 'high' | undefined | null): number {
  if (!v || v === 'none') return 0;
  if (v === 'low') return 33;
  if (v === 'medium') return 67;
  return 100;
}

function fteToScore(v: 'low' | 'medium' | 'high' | undefined | null): number {
  if (!v) return 0;
  if (v === 'low') return 33;
  if (v === 'medium') return 67;
  return 100;
}

function populationToScore(v: 'none' | 'small' | 'medium' | 'large' | undefined | null): number {
  if (!v || v === 'none') return 0;
  if (v === 'small') return 25;
  if (v === 'medium') return 65;
  return 100;
}

function countOverlappingFunctions(programs: ProgramLibraryEntry[]): number {
  if (programs.length < 2) return 0;
  const allFunctions = programs.map((p) => p.businessFunctionsAffected ?? []);
  const overlap = allFunctions[0].filter((fn) =>
    allFunctions.slice(1).some((arr) => arr.includes(fn))
  );
  return overlap.length;
}

function avgScore(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// ─── Dimension Computers ──────────────────────────────────────────────────────

function computeBusinessProcessOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const withSharedBP = programs.filter((p) => p.sharedBusinessProcesses);
  const sharedFnCount = countOverlappingFunctions(programs);
  const boolScore = programs.length > 0 ? (withSharedBP.length / programs.length) * 100 : 0;
  const fnScore = Math.min(sharedFnCount * 25, 100);
  const score = Math.round(boolScore * 0.6 + fnScore * 0.4);

  const sharedFunctions: string[] = [];
  if (programs.length >= 2) {
    const allFunctions = programs.map((p) => p.businessFunctionsAffected ?? []);
    allFunctions[0].forEach((fn) => {
      if (allFunctions.slice(1).some((arr) => arr.includes(fn))) sharedFunctions.push(fn);
    });
  }

  return {
    id: 'business-process',
    label: 'Business Process Overlap',
    score,
    level: levelFromScore(score),
    evidence: withSharedBP.length > 0
      ? `${withSharedBP.map((p) => p.shortName).join(', ')} share business processes.${sharedFunctions.length ? ` Common functions: ${sharedFunctions.join(', ')}.` : ''}`
      : 'No programs indicate shared business processes.',
    involvedPrograms: withSharedBP.map((p) => p.shortName),
    potentialSynergy: 'Shared process design reduces rework, duplicate workshops, and conflicting process definitions.',
    whatMustBeTrue: 'Process owners from all overlapping programs must be co-located in design sessions to identify and reconcile conflicts early.',
  };
}

function computeStakeholderOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const withSharedStakeholders = programs.filter((p) => p.sharedStakeholders);
  const score = programs.length > 0 ? Math.round((withSharedStakeholders.length / programs.length) * 100) : 0;

  return {
    id: 'stakeholder',
    label: 'Stakeholder & Workshop Overlap',
    score,
    level: levelFromScore(score),
    evidence: withSharedStakeholders.length > 0
      ? `${withSharedStakeholders.map((p) => p.shortName).join(', ')} share stakeholders or governance bodies.`
      : 'Programs indicate limited stakeholder overlap.',
    involvedPrograms: withSharedStakeholders.map((p) => p.shortName),
    potentialSynergy: 'Consolidated steering, fewer parallel design workshops, and reduced decision friction for senior leadership.',
    whatMustBeTrue: 'A single integrated governance forum must be established with authority to make cross-program decisions.',
  };
}

function computeTrainingOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const populations = programs.map((p) => populationToScore(p.trainingPopulation));
  const activePrograms = programs.filter((p) => p.trainingPopulation && p.trainingPopulation !== 'none');
  const avgPop = avgScore(populations);
  const overlapBonus = activePrograms.length >= 2 ? 20 : 0;
  const score = Math.min(avgPop + overlapBonus, 100);

  return {
    id: 'training',
    label: 'Training & Change Population',
    score,
    level: levelFromScore(score),
    evidence: activePrograms.length > 0
      ? `${activePrograms.map((p) => `${p.shortName} (${p.trainingPopulation})`).join(', ')} require training populations.`
      : 'No programs indicate significant training needs.',
    involvedPrograms: activePrograms.map((p) => p.shortName),
    potentialSynergy: 'Consolidated change management and training waves reduce stakeholder burden and compress the change calendar.',
    whatMustBeTrue: 'A single Change Management lead with authority across all programs must be appointed to design the integrated adoption plan.',
  };
}

function computeBusinessFteOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const highFte = programs.filter((p) => p.businessFteRequirement === 'high');
  const medFte = programs.filter((p) => p.businessFteRequirement === 'medium');
  const scores = programs.map((p) => fteToScore(p.businessFteRequirement));
  const avgFte = avgScore(scores);
  const overlapBonus = (highFte.length >= 2 || (highFte.length >= 1 && medFte.length >= 1)) ? 20 : 0;
  const score = Math.min(avgFte + overlapBonus, 100);

  const high = programs.filter((p) => ['high', 'medium'].includes(p.businessFteRequirement ?? ''));
  return {
    id: 'business-fte',
    label: 'Business FTE Demand',
    score,
    level: levelFromScore(score),
    evidence: high.length > 0
      ? `${high.map((p) => `${p.shortName} (${p.businessFteRequirement} FTE demand)`).join(', ')}.`
      : 'Business FTE demand is low across selected programs.',
    involvedPrograms: high.map((p) => p.shortName),
    potentialSynergy: 'Consolidated program management reduces the total business FTE required by eliminating duplicated subject-matter expert time across programs.',
    whatMustBeTrue: 'Business capacity planning must be done across all programs together — not program by program — to avoid double-counting SME availability.',
  };
}

function computeItFteOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const highFte = programs.filter((p) => p.itFteRequirement === 'high');
  const scores = programs.map((p) => fteToScore(p.itFteRequirement));
  const avgFte = avgScore(scores);
  const overlapBonus = highFte.length >= 2 ? 20 : 0;
  const score = Math.min(avgFte + overlapBonus, 100);

  const high = programs.filter((p) => ['high', 'medium'].includes(p.itFteRequirement ?? ''));
  return {
    id: 'it-fte',
    label: 'IT FTE Demand',
    score,
    level: levelFromScore(score),
    evidence: high.length > 0
      ? `${high.map((p) => `${p.shortName} (${p.itFteRequirement} IT FTE demand)`).join(', ')}.`
      : 'IT FTE demand is low across selected programs.',
    involvedPrograms: high.map((p) => p.shortName),
    potentialSynergy: 'Shared IT architecture, integration layers, and infrastructure team reduces total IT staffing overhead.',
    whatMustBeTrue: 'IT resource allocation must be planned jointly to prevent bottlenecks from sequential over-commitment.',
  };
}

function computeGovernanceOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const withDeps = programs.filter((p) => p.timingDependency || p.dependencies.some((d) => programs.find((pp) => pp.id === d)));
  const score = programs.length > 1
    ? Math.round((withDeps.length / programs.length) * 80 + (programs.length > 2 ? 20 : 0))
    : 0;

  return {
    id: 'governance',
    label: 'Governance & Decision Overlap',
    score: Math.min(score, 100),
    level: levelFromScore(Math.min(score, 100)),
    evidence: programs.length > 1
      ? `${programs.length} concurrent programs require cross-program decision-making authority.${withDeps.length > 0 ? ` ${withDeps.map((p) => p.shortName).join(', ')} have declared interdependencies.` : ''}`
      : 'Single program — no cross-program governance required.',
    involvedPrograms: programs.map((p) => p.shortName),
    potentialSynergy: 'Unified governance eliminates escalation bottlenecks and reduces decision latency across programs.',
    whatMustBeTrue: 'Executive sponsor must be able to make binding decisions across all programs in a single forum.',
  };
}

function computeDataTechOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const withSharedData = programs.filter((p) => p.sharedData);
  const withSharedTech = programs.filter((p) => p.sharedTechnology);
  const score = programs.length > 0
    ? Math.round(((withSharedData.length + withSharedTech.length) / (programs.length * 2)) * 100)
    : 0;

  return {
    id: 'data-tech',
    label: 'Data & Technology Dependency',
    score,
    level: levelFromScore(score),
    evidence: withSharedData.length > 0 || withSharedTech.length > 0
      ? `Shared data: ${withSharedData.map((p) => p.shortName).join(', ') || 'none'}. Shared technology: ${withSharedTech.map((p) => p.shortName).join(', ') || 'none'}.`
      : 'Programs indicate independent data and technology stacks.',
    involvedPrograms: [...new Set([...withSharedData, ...withSharedTech].map((p) => p.shortName))],
    potentialSynergy: 'Consolidated integration architecture and shared data model reduces the number of point-to-point integrations and the risk of data inconsistency.',
    whatMustBeTrue: 'A single enterprise integration architect must own the cross-program data model from the start of design.',
  };
}

function computeCutoverOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const withCutover = programs.filter((p) => p.majorCutoverWindow);
  const windows = withCutover.map((p) => p.majorCutoverWindow as string);
  const uniqueWindows = new Set(windows);
  const conflictingWindows = windows.length > uniqueWindows.size || windows.length >= 2;
  const score = conflictingWindows ? Math.min(50 + withCutover.length * 15, 100) : withCutover.length > 1 ? 30 : 0;

  return {
    id: 'cutover',
    label: 'Cutover & Timing Dependency',
    score,
    level: levelFromScore(score),
    evidence: withCutover.length > 0
      ? `Cutover windows: ${withCutover.map((p) => `${p.shortName} — ${p.majorCutoverWindow}`).join('; ')}.${conflictingWindows ? ' Multiple programs share overlapping cutover periods.' : ''}`
      : 'No cutover windows declared.',
    involvedPrograms: withCutover.map((p) => p.shortName),
    potentialSynergy: 'Coordinating cutover windows reduces total business disruption and allows shared hypercare teams.',
    whatMustBeTrue: 'A single cutover director must own the enterprise-wide blackout calendar and resolve conflicts across programs.',
  };
}

function computeCustomerSupplierOverlap(programs: ProgramLibraryEntry[]): OverlapDimension {
  const customerScores = programs.map((p) => impactToScore(p.customerImpact));
  const supplierScores = programs.map((p) => impactToScore(p.supplierImpact));
  const avgCustomer = avgScore(customerScores);
  const avgSupplier = avgScore(supplierScores);
  const score = Math.round(avgCustomer * 0.6 + avgSupplier * 0.4);

  const withCustomer = programs.filter((p) => p.customerImpact && p.customerImpact !== 'none');
  const withSupplier = programs.filter((p) => p.supplierImpact && p.supplierImpact !== 'none');

  return {
    id: 'customer-supplier',
    label: 'Customer & Supplier Impact',
    score,
    level: levelFromScore(score),
    evidence: [
      withCustomer.length > 0 ? `Customer impact: ${withCustomer.map((p) => `${p.shortName} (${p.customerImpact})`).join(', ')}` : '',
      withSupplier.length > 0 ? `Supplier impact: ${withSupplier.map((p) => `${p.shortName} (${p.supplierImpact})`).join(', ')}` : '',
    ].filter(Boolean).join('. ') || 'No significant customer or supplier impact indicated.',
    involvedPrograms: [...new Set([...withCustomer, ...withSupplier].map((p) => p.shortName))],
    potentialSynergy: 'Coordinated external communications and change management reduce confusion and reputational risk with customers and suppliers.',
    whatMustBeTrue: 'A unified external stakeholder communication strategy must be developed before any program reaches cutover.',
  };
}

// ─── Main Overlap Engine ──────────────────────────────────────────────────────

export function computeOverlap(selectedLib: ProgramLibraryEntry[]): OverlapAnalysis {
  if (selectedLib.length === 0) {
    return {
      dimensions: [],
      overallScore: 0,
      overallLevel: 'none',
      caseForConsolidation: 0,
      caseLevel: 'none',
      caseRationale: 'No programs selected.',
      numPrograms: 0,
    };
  }

  if (selectedLib.length === 1) {
    return {
      dimensions: [],
      overallScore: 0,
      overallLevel: 'none',
      caseForConsolidation: 0,
      caseLevel: 'none',
      caseRationale: 'Only one program selected — overlap analysis requires at least two programs.',
      numPrograms: 1,
    };
  }

  const dimensions: OverlapDimension[] = [
    computeBusinessProcessOverlap(selectedLib),
    computeStakeholderOverlap(selectedLib),
    computeTrainingOverlap(selectedLib),
    computeBusinessFteOverlap(selectedLib),
    computeItFteOverlap(selectedLib),
    computeGovernanceOverlap(selectedLib),
    computeDataTechOverlap(selectedLib),
    computeCutoverOverlap(selectedLib),
    computeCustomerSupplierOverlap(selectedLib),
  ];

  // Weighted overall score — weights sum to 100
  const weights: Record<string, number> = {
    'business-process': 20,
    'stakeholder': 15,
    'training': 15,
    'business-fte': 12,
    'it-fte': 12,
    'governance': 10,
    'data-tech': 8,
    'cutover': 5,
    'customer-supplier': 3,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const dim of dimensions) {
    const w = weights[dim.id] ?? 0;
    weightedSum += dim.score * w;
    totalWeight += w;
  }
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const overallLevel = levelFromScore(overallScore);

  // Case for Consolidated Ownership: emphasizes duplication-reduction dimensions
  const consolidationWeights: Record<string, number> = {
    'business-process': 25,
    'stakeholder': 20,
    'governance': 20,
    'training': 15,
    'business-fte': 10,
    'it-fte': 10,
  };
  let csSum = 0;
  let csTotalW = 0;
  for (const dim of dimensions) {
    const w = consolidationWeights[dim.id] ?? 0;
    csSum += dim.score * w;
    csTotalW += w;
  }
  const caseForConsolidation = csTotalW > 0 ? Math.round(csSum / csTotalW) : 0;
  const caseLevel = levelFromScore(caseForConsolidation);

  const highDims = dimensions.filter((d) => d.level === 'high');
  const medDims = dimensions.filter((d) => d.level === 'medium');

  let caseRationale: string;
  if (caseLevel === 'high') {
    caseRationale = `Demonstrable overlap across ${highDims.length + medDims.length} dimensions — particularly ${highDims.map((d) => d.label).join(', ')}. Separate program management is likely to produce duplicated effort, conflicting design decisions, and compounding delivery risk. Consolidated ownership would reduce structural duplication and decision friction.`;
  } else if (caseLevel === 'medium') {
    caseRationale = `Moderate overlap across ${medDims.length + highDims.length} dimensions — particularly ${[...highDims, ...medDims].slice(0, 2).map((d) => d.label).join(', ')}. Coordinated delivery with shared governance forums may be sufficient, though full consolidation would further reduce overhead.`;
  } else if (caseLevel === 'low') {
    caseRationale = `Limited overlap detected. Programs can be delivered separately with lightweight coordination checkpoints. A shared governance forum is advisable but consolidated ownership is not clearly justified by this data.`;
  } else {
    caseRationale = `Insufficient overlap detected to make a case for consolidated ownership. Programs appear to be largely independent and are best delivered separately.`;
  }

  return {
    dimensions,
    overallScore,
    overallLevel,
    caseForConsolidation,
    caseLevel,
    caseRationale,
    numPrograms: selectedLib.length,
  };
}
