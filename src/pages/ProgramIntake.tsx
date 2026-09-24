import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenario, pidUid } from '../state/ScenarioContext';
import {
  ProgramLibraryEntry,
  ProgramKPI,
  OutcomeId,
  ProgramStatus,
  KpiUnit,
  emptyInput,
} from '../types';
import { INITIAL_PROGRAM_LIBRARY } from '../data/programLibrary';

const OUTCOMES: { id: OutcomeId; label: string }[] = [
  { id: 'grow-patient-volume',         label: 'Grow Patient Volume / Market Position' },
  { id: 'reduce-cost-per-treatment',   label: 'Reduce Cost per Treatment' },
  { id: 'scalable-digital-enterprise', label: 'Build a Scalable, Digitally Enabled Enterprise' },
];

const STATUS_OPTIONS: { value: ProgramStatus; label: string }[] = [
  { value: 'planned',   label: 'Planned' },
  { value: 'in-design', label: 'In Design' },
  { value: 'in-flight', label: 'In Flight' },
  { value: 'scaling',   label: 'Scaling' },
];

const KPI_UNITS: KpiUnit[] = ['%', '€', '$', 'Days', 'Volume', 'Rate', 'Other'];

function blankProgram(): ProgramLibraryEntry {
  return {
    id: pidUid(),
    name: '',
    shortName: '',
    description: '',
    isBuiltIn: false,
    status: 'planned',
    startTiming: '',
    targetCompletion: '',
    investmentEurM: emptyInput(),
    illustrativeValueEurM: emptyInput(),
    outcomes: [],
    outcomePriorities: {},
    kpis: [],
    dependencies: [],
    sharedWorkforce: false,
    sharedData: false,
    sharedTechnology: false,
    sharedChangePopulation: false,
    timingDependency: false,
    dependencyContext: '',
    integrationHypothesis: '',
    defaultTimeline: { startMonth: 0, durationMonths: 24 },
    additionalContext: '',
    notes: '',
    costAssumptions: {
      governanceCostBaseEurM: emptyInput(),
      changeCostBaseEurM: emptyInput(),
      trainingCostBaseEurM: emptyInput(),
      dataIntegrationCostBaseEurM: emptyInput(),
      programResourceCostBaseEurM: emptyInput(),
    },
  };
}

function blankKpi(programId: string): ProgramKPI {
  return {
    id: `kpi-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name: '',
    baseline: '',
    target: '',
    unit: '%',
    outcomeIds: [],
    isCustom: true,
    isActive: true,
    context: '',
  };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProgramStatus }) {
  const config: Record<ProgramStatus, { label: string; bg: string; color: string }> = {
    planned:   { label: 'Planned',   bg: '#F1F5F9', color: '#475569' },
    'in-design': { label: 'In Design', bg: '#EBF4FF', color: '#0066B3' },
    'in-flight': { label: 'In Flight', bg: '#E6F6F7', color: '#007380' },
    scaling:   { label: 'Scaling',   bg: '#ECFDF5', color: '#065F46' },
  };
  const cfg = config[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 2 }}>
      {cfg.label}
    </span>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  isEditing,
  onEdit,
}: {
  program: ProgramLibraryEntry;
  isEditing: boolean;
  onEdit: () => void;
}) {
  const activeKpis = program.kpis.filter((k) => k.isActive).length;

  return (
    <div
      style={{
        background: 'white',
        border: `2px solid ${isEditing ? 'var(--blue)' : 'var(--grey-1)'}`,
        borderLeft: `4px solid ${program.isBuiltIn ? 'var(--teal)' : 'var(--blue)'}`,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEdit()}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
            {program.name || <span style={{ fontStyle: 'italic', color: 'var(--grey-2)' }}>Unnamed program</span>}
          </div>
          <StatusBadge status={program.status} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--grey-2)', textAlign: 'right', flexShrink: 0 }}>
          {program.isBuiltIn && (
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 3 }}>
              Pre-populated · Illustrative
            </div>
          )}
          {activeKpis > 0 && <div>{activeKpis} KPI{activeKpis !== 1 ? 's' : ''} active</div>}
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--grey-3)', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {program.description || <span style={{ fontStyle: 'italic' }}>No description yet</span>}
      </p>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {program.outcomes.map((oid) => {
          const o = OUTCOMES.find((x) => x.id === oid);
          return o ? (
            <span key={oid} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--grey-0)', color: 'var(--grey-3)', padding: '2px 7px', borderRadius: 2 }}>
              {o.label.split('/')[0].trim()}
            </span>
          ) : null;
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>
        {isEditing ? '← Editing below' : 'Click to view / edit →'}
      </div>
    </div>
  );
}

// ─── Slider Row ───────────────────────────────────────────────────────────────

function OutcomePrioritySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--navy)' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>
          {value < 34 ? 'Low' : value < 67 ? 'Medium' : 'High'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: 'var(--grey-2)', width: 30 }}>Low</span>
        <input
          type="range" min={0} max={100} step={5} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--blue)' }}
        />
        <span style={{ fontSize: 10, color: 'var(--grey-2)', width: 30, textAlign: 'right' }}>High</span>
      </div>
    </div>
  );
}

// ─── KPI Row ─────────────────────────────────────────────────────────────────

function KpiRow({
  kpi,
  allKpis,
  programId,
  onToggle,
  onUpdate,
}: {
  kpi: ProgramKPI;
  allKpis: ProgramKPI[];
  programId: string;
  onToggle: () => void;
  onUpdate: (updates: Partial<ProgramKPI>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: `1px solid ${kpi.isActive ? 'var(--grey-1)' : 'var(--grey-0)'}`, borderRadius: 6, marginBottom: 8, background: kpi.isActive ? 'white' : 'var(--grey-0)', opacity: kpi.isActive ? 1 : 0.6 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => { if (kpi.isActive) setExpanded((v) => !v); }}
      >
        <input
          type="checkbox"
          checked={kpi.isActive}
          onChange={(e) => { e.stopPropagation(); onToggle(); }}
          style={{ width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0 }}
        />
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--navy)' }}>{kpi.name}</span>
        {kpi.isCustom && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#EBF4FF', color: 'var(--blue)', padding: '1px 6px', borderRadius: 2 }}>
            Custom
          </span>
        )}
        {kpi.isActive && (
          <span style={{ fontSize: 10, color: 'var(--grey-2)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
        )}
      </div>

      {expanded && kpi.isActive && (
        <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <LabeledInput
            label="Current Baseline"
            value={kpi.baseline}
            placeholder="e.g. 8%"
            onChange={(v) => onUpdate({ baseline: v })}
          />
          <LabeledInput
            label="Target / Expected Improvement"
            value={kpi.target}
            placeholder="e.g. 5%"
            onChange={(v) => onUpdate({ target: v })}
          />
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>Unit</label>
            <select
              value={kpi.unit}
              onChange={(e) => onUpdate({ unit: e.target.value as KpiUnit })}
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--grey-1)', borderRadius: 4, fontFamily: 'Inter, sans-serif', background: 'white' }}
            >
              {KPI_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>Enterprise Outcome Supported</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {OUTCOMES.map((o) => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={kpi.outcomeIds.includes(o.id)}
                    onChange={() => {
                      const updated = kpi.outcomeIds.includes(o.id)
                        ? kpi.outcomeIds.filter((x) => x !== o.id)
                        : [...kpi.outcomeIds, o.id];
                      onUpdate({ outcomeIds: updated });
                    }}
                    style={{ accentColor: 'var(--blue)' }}
                  />
                  <span style={{ color: 'var(--grey-3)', lineHeight: 1.3 }}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <LabeledInput
              label='Why does this KPI matter? (optional)'
              value={kpi.context}
              placeholder="Explain what this KPI tracks and why it matters for this program"
              onChange={(v) => onUpdate({ context: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add KPI Form ─────────────────────────────────────────────────────────────

function AddKpiForm({ programId, onAdd, onCancel }: { programId: string; onAdd: (kpi: ProgramKPI) => void; onCancel: () => void }) {
  const [kpi, setKpi] = useState<ProgramKPI>(blankKpi(programId));
  const update = (u: Partial<ProgramKPI>) => setKpi((prev) => ({ ...prev, ...u }));

  return (
    <div style={{ border: '2px solid var(--blue)', borderRadius: 8, padding: '18px 20px', background: '#F5F9FF', marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 14 }}>Add Custom KPI</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <LabeledInput label="KPI Name" value={kpi.name} placeholder="e.g. Digital Scheduling Adoption" onChange={(v) => update({ name: v })} />
        </div>
        <LabeledInput label="Current Baseline" value={kpi.baseline} placeholder="e.g. 20%" onChange={(v) => update({ baseline: v })} />
        <LabeledInput label="Target / Expected" value={kpi.target} placeholder="e.g. 65%" onChange={(v) => update({ target: v })} />
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>Unit</label>
          <select value={kpi.unit} onChange={(e) => update({ unit: e.target.value as KpiUnit })} style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--grey-1)', borderRadius: 4, fontFamily: 'Inter, sans-serif', background: 'white' }}>
            {KPI_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>Enterprise Outcome</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {OUTCOMES.map((o) => (
              <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={kpi.outcomeIds.includes(o.id)} onChange={() => {
                  const updated = kpi.outcomeIds.includes(o.id) ? kpi.outcomeIds.filter((x) => x !== o.id) : [...kpi.outcomeIds, o.id];
                  update({ outcomeIds: updated });
                }} style={{ accentColor: 'var(--blue)' }} />
                <span style={{ color: 'var(--grey-3)', lineHeight: 1.3 }}>{o.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <LabeledInput label="Why does this KPI matter? (optional)" value={kpi.context} placeholder="Context for this KPI" onChange={(v) => update({ context: v })} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          onClick={() => { if (kpi.name.trim()) { onAdd({ ...kpi, id: `kpi-custom-${Date.now()}` }); } }}
          disabled={!kpi.name.trim()}
          style={{ background: 'var(--blue)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, padding: '7px 16px', cursor: kpi.name.trim() ? 'pointer' : 'not-allowed', borderRadius: 4, fontFamily: 'Inter, sans-serif', opacity: kpi.name.trim() ? 1 : 0.5 }}
        >
          Add KPI
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--grey-1)', color: 'var(--grey-3)', fontSize: 12, padding: '7px 16px', cursor: 'pointer', borderRadius: 4, fontFamily: 'Inter, sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function LabeledInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, border: '1px solid var(--grey-1)', borderRadius: 4, fontFamily: 'Inter, sans-serif', color: 'var(--navy)', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function NumberInput({ label, value, placeholder, unit, onChange, illustrative = false }: { label: string; value: number | null; placeholder?: string; unit?: string; onChange: (v: number | null) => void; illustrative?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>
        {label}
        {illustrative && (
          <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#007380', background: '#E6F6F7', padding: '1px 5px', borderRadius: 2 }}>
            Illustrative
          </span>
        )}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {unit && <span style={{ fontSize: 12, color: 'var(--grey-2)', flexShrink: 0 }}>{unit}</span>}
        <input
          type="number"
          value={value ?? ''}
          placeholder={placeholder || 'Enter FME value'}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          style={{ flex: 1, padding: '7px 10px', fontSize: 12.5, border: '1px solid var(--grey-1)', borderRadius: 4, fontFamily: 'Inter, sans-serif', color: 'var(--navy)', outline: 'none' }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <div style={{ background: 'var(--grey-0)', borderBottom: '1px solid var(--grey-1)', padding: '14px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>{number}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{title}</span>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--grey-3)', margin: '4px 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

// ─── Program Edit Form ────────────────────────────────────────────────────────

function ProgramEditForm({
  program,
  allProgramIds,
  allLibrary,
  onUpdate,
  onSave,
  onCancel,
  isNew,
}: {
  program: ProgramLibraryEntry;
  allProgramIds: string[];
  allLibrary: ProgramLibraryEntry[];
  onUpdate: (updates: Partial<ProgramLibraryEntry>) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const [showAddKpi, setShowAddKpi] = useState(false);
  const p = program;

  return (
    <div style={{ background: 'white', border: '2px solid var(--blue)', borderRadius: 2 }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            {isNew ? 'New Program' : 'Edit Program'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
            {p.name || 'Unnamed Program'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onSave} style={{ background: 'var(--teal)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, padding: '8px 18px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
            {isNew ? 'Save Program' : 'Save Changes'}
          </button>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 12, padding: '8px 14px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}>
            Cancel
          </button>
        </div>
      </div>

      {p.isBuiltIn && (
        <div style={{ background: '#E6F6F7', borderBottom: '1px solid #B2E5EA', padding: '10px 24px', fontSize: 11.5, color: '#007380' }}>
          <strong>Illustrative — Requires FME Validation.</strong> Values pre-populated from comparable healthcare transformation data. All fields are editable.
        </div>
      )}

      <div style={{ padding: '0 24px 24px' }}>

        {/* Section A: Program Basics */}
        <SectionHeader number="A" title="Program Basics" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <LabeledInput label="Program Name" value={p.name} placeholder="e.g. Digital Patient Engagement" onChange={(v) => onUpdate({ name: v, shortName: v.length < 25 ? v : v.slice(0, 22) + '…' })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <LabeledInput label="Program Objective / Description" value={p.description} placeholder="What does this program transform and why does it matter?" onChange={(v) => onUpdate({ description: v })} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--grey-2)', display: 'block', marginBottom: 5 }}>Current Status</label>
            <select value={p.status} onChange={(e) => onUpdate({ status: e.target.value as ProgramStatus })} style={{ width: '100%', padding: '7px 10px', fontSize: 12.5, border: '1px solid var(--grey-1)', borderRadius: 4, fontFamily: 'Inter, sans-serif', background: 'white' }}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <LabeledInput label="Start Timing" value={p.startTiming} placeholder="e.g. Q1 2026" onChange={(v) => onUpdate({ startTiming: v })} />
          <LabeledInput label="Target Completion" value={p.targetCompletion} placeholder="e.g. Q4 2027" onChange={(v) => onUpdate({ targetCompletion: v })} />
          <NumberInput label="Program Investment" unit="€M" value={p.investmentEurM.value} placeholder="Enter FME budget" onChange={(v) => onUpdate({ investmentEurM: { ...p.investmentEurM, value: v, source: 'user-input' } })} />
          <NumberInput label="Illustrative Modeled Value / Benefit" unit="€M" value={p.illustrativeValueEurM.value} placeholder="Enter or leave blank" illustrative={p.isBuiltIn} onChange={(v) => onUpdate({ illustrativeValueEurM: { ...p.illustrativeValueEurM, value: v, source: 'user-input' } })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <LabeledInput label="Additional Context (optional)" value={p.additionalContext} placeholder="Business case summary, sponsor, constraints, etc." onChange={(v) => onUpdate({ additionalContext: v })} />
          </div>
        </div>

        {/* Section B: Prioritize What Matters Most */}
        <SectionHeader number="B" title="Prioritize What Matters Most" subtitle="How important is each enterprise outcome to this program? These sliders feed scenario interpretation and the Value Realization scorecard." />
        <div style={{ marginBottom: 24 }}>
          {OUTCOMES.map((o) => (
            <OutcomePrioritySlider
              key={o.id}
              label={o.label}
              value={p.outcomePriorities[o.id] ?? 50}
              onChange={(v) => onUpdate({ outcomePriorities: { ...p.outcomePriorities, [o.id]: v } })}
            />
          ))}
          <div style={{ fontSize: 11, color: 'var(--grey-2)', lineHeight: 1.5, marginTop: 4 }}>
            Enterprise outcomes covered by this program will automatically be marked in Build Your Scenario and the Executive Overview.
          </div>
        </div>

        {/* Section C: Business KPIs */}
        <SectionHeader number="C" title="Business KPIs" subtitle="Select the KPIs that this program is accountable for. Edit baseline and target values for each active KPI." />
        <div style={{ marginBottom: 24 }}>
          {p.kpis.length === 0 ? (
            <div style={{ padding: '20px', background: 'var(--grey-0)', borderRadius: 6, textAlign: 'center', fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic' }}>
              No KPIs defined yet. Add a custom KPI below.
            </div>
          ) : (
            p.kpis.map((kpi) => (
              <KpiRow
                key={kpi.id}
                kpi={kpi}
                allKpis={p.kpis}
                programId={p.id}
                onToggle={() => onUpdate({ kpis: p.kpis.map((k) => k.id === kpi.id ? { ...k, isActive: !k.isActive } : k) })}
                onUpdate={(updates) => onUpdate({ kpis: p.kpis.map((k) => k.id === kpi.id ? { ...k, ...updates } : k) })}
              />
            ))
          )}

          {showAddKpi ? (
            <AddKpiForm
              programId={p.id}
              onAdd={(kpi) => { onUpdate({ kpis: [...p.kpis, kpi] }); setShowAddKpi(false); }}
              onCancel={() => setShowAddKpi(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddKpi(true)}
              style={{ width: '100%', padding: '10px', border: '1.5px dashed var(--blue)', background: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, fontFamily: 'Inter, sans-serif', marginTop: 8 }}
            >
              + Add KPI
            </button>
          )}
        </div>

        {/* Section D: Dependencies */}
        <SectionHeader number="D" title="Dependencies" subtitle="What does this program depend on or share with other programs?" />
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-3)', marginBottom: 10 }}>Program Dependencies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {allLibrary.filter((lp) => lp.id !== p.id).map((lp) => (
              <label key={lp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', padding: '6px 10px', background: p.dependencies.includes(lp.id) ? '#EBF4FF' : 'var(--grey-0)', borderRadius: 4 }}>
                <input
                  type="checkbox"
                  checked={p.dependencies.includes(lp.id)}
                  onChange={() => {
                    const updated = p.dependencies.includes(lp.id)
                      ? p.dependencies.filter((d) => d !== lp.id)
                      : [...p.dependencies, lp.id];
                    onUpdate({ dependencies: updated });
                  }}
                  style={{ accentColor: 'var(--blue)' }}
                />
                <span style={{ color: 'var(--navy)', fontWeight: p.dependencies.includes(lp.id) ? 600 : 400 }}>{lp.name}</span>
              </label>
            ))}
            {allLibrary.filter((lp) => lp.id !== p.id).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--grey-2)', fontStyle: 'italic', padding: '8px 0' }}>No other programs in library yet.</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {([
              { field: 'sharedWorkforce', label: 'Shared Workforce?' },
              { field: 'sharedData', label: 'Shared Data?' },
              { field: 'sharedTechnology', label: 'Shared Technology?' },
              { field: 'sharedChangePopulation', label: 'Shared Change Population?' },
              { field: 'timingDependency', label: 'Timing Dependency?' },
            ] as { field: keyof ProgramLibraryEntry; label: string }[]).map(({ field, label }) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', padding: '8px 12px', background: 'var(--grey-0)', borderRadius: 4 }}>
                <input
                  type="checkbox"
                  checked={!!p[field]}
                  onChange={() => onUpdate({ [field]: !p[field] })}
                  style={{ accentColor: 'var(--blue)' }}
                />
                <span style={{ color: 'var(--navy)' }}>{label}</span>
              </label>
            ))}
          </div>

          <LabeledInput label="Additional Dependency Context (optional)" value={p.dependencyContext} placeholder="Describe how this program depends on or enables others" onChange={(v) => onUpdate({ dependencyContext: v })} />
        </div>

        {/* Section E: Value / Cost */}
        <SectionHeader number="E" title="Value / Cost Assumptions" subtitle="Enter cost base assumptions for this program. All values are illustrative and require FME validation." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <NumberInput label="Governance Cost Base" unit="€M" value={p.costAssumptions.governanceCostBaseEurM.value} placeholder="Enter FME value" illustrative={p.isBuiltIn} onChange={(v) => onUpdate({ costAssumptions: { ...p.costAssumptions, governanceCostBaseEurM: { ...p.costAssumptions.governanceCostBaseEurM, value: v, source: 'user-input' } } })} />
          <NumberInput label="Change Management Cost Base" unit="€M" value={p.costAssumptions.changeCostBaseEurM.value} placeholder="Enter FME value" illustrative={p.isBuiltIn} onChange={(v) => onUpdate({ costAssumptions: { ...p.costAssumptions, changeCostBaseEurM: { ...p.costAssumptions.changeCostBaseEurM, value: v, source: 'user-input' } } })} />
          <NumberInput label="Training / Rollout Cost Base" unit="€M" value={p.costAssumptions.trainingCostBaseEurM.value} placeholder="Enter FME value" illustrative={p.isBuiltIn} onChange={(v) => onUpdate({ costAssumptions: { ...p.costAssumptions, trainingCostBaseEurM: { ...p.costAssumptions.trainingCostBaseEurM, value: v, source: 'user-input' } } })} />
          <NumberInput label="Data / Integration Cost Base" unit="€M" value={p.costAssumptions.dataIntegrationCostBaseEurM.value} placeholder="Enter FME value" illustrative={p.isBuiltIn} onChange={(v) => onUpdate({ costAssumptions: { ...p.costAssumptions, dataIntegrationCostBaseEurM: { ...p.costAssumptions.dataIntegrationCostBaseEurM, value: v, source: 'user-input' } } })} />
          <NumberInput label="Program Resource Cost Base" unit="€M" value={p.costAssumptions.programResourceCostBaseEurM.value} placeholder="Enter FME value" illustrative={p.isBuiltIn} onChange={(v) => onUpdate({ costAssumptions: { ...p.costAssumptions, programResourceCostBaseEurM: { ...p.costAssumptions.programResourceCostBaseEurM, value: v, source: 'user-input' } } })} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProgramIntake() {
  const { state, dispatch } = useScenario();
  const navigate = useNavigate();

  // editingId: null = none, 'new' = new program, else string = program id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftProgram, setDraftProgram] = useState<ProgramLibraryEntry | null>(null);

  function openNew() {
    const blank = blankProgram();
    setDraftProgram(blank);
    setEditingId('new');
  }

  function openEdit(program: ProgramLibraryEntry) {
    setDraftProgram(JSON.parse(JSON.stringify(program)));
    setEditingId(program.id);
  }

  function closeEdit() {
    setEditingId(null);
    setDraftProgram(null);
  }

  function saveProgram() {
    if (!draftProgram) return;
    if (editingId === 'new') {
      dispatch({ type: 'ADD_PROGRAM', program: draftProgram });
    } else {
      dispatch({ type: 'UPDATE_PROGRAM', id: draftProgram.id, updates: draftProgram });
    }
    closeEdit();
  }

  function updateDraft(updates: Partial<ProgramLibraryEntry>) {
    setDraftProgram((prev) => prev ? { ...prev, ...updates } : prev);
  }

  const library = state.programLibrary;
  const allLibrary = library;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8 }}>
          02 — Program Intake
        </div>
        <h1 style={{ fontFamily: 'Source Serif 4, serif', fontSize: 28, fontWeight: 600, color: 'var(--navy)', marginBottom: 12, lineHeight: 1.2 }}>
          Build the FME Transformation Portfolio
        </h1>
        <p style={{ fontSize: 13, color: 'var(--grey-3)', lineHeight: 1.65, maxWidth: 640, marginBottom: 0 }}>
          Each program you define here becomes a first-class object throughout the application — in your scenario, pressure-test, comparison, and value realization scorecard. Programs are the building blocks of your value journey.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editingId ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: Program Library */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)' }}>
              Program Library ({library.length})
            </div>
            <button
              onClick={openNew}
              style={{ background: 'var(--blue)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, padding: '7px 14px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              + Add Program
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {library.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                isEditing={editingId === program.id}
                onEdit={() => {
                  if (editingId === program.id) { closeEdit(); } else { openEdit(program); }
                }}
              />
            ))}
            {editingId !== 'new' && (
              <button
                onClick={openNew}
                style={{ border: '1.5px dashed var(--grey-1)', background: 'none', padding: '16px', cursor: 'pointer', borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--grey-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = 'var(--blue)'; b.style.color = 'var(--blue)'; }}
                onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = 'var(--grey-1)'; b.style.color = 'var(--grey-2)'; }}
              >
                + Add Program to Portfolio
              </button>
            )}
          </div>

          {library.length > 0 && (
            <div style={{ marginTop: 20, padding: '14px 16px', background: '#E6F6F7', borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', marginBottom: 4 }}>
                Ready to build a scenario?
              </div>
              <div style={{ fontSize: 11, color: 'var(--grey-3)', marginBottom: 10 }}>
                Select which programs to integrate in Build Your Scenario.
              </div>
              <button
                onClick={() => navigate('/build')}
                style={{ background: 'var(--teal)', border: 'none', color: 'white', fontSize: 11, fontWeight: 600, padding: '6px 14px', cursor: 'pointer', borderRadius: 3, fontFamily: 'Inter, sans-serif' }}
              >
                Build Your Scenario →
              </button>
            </div>
          )}
        </div>

        {/* Right: Edit Form */}
        {editingId && draftProgram && (
          <ProgramEditForm
            program={draftProgram}
            allProgramIds={library.map((p) => p.id)}
            allLibrary={allLibrary}
            onUpdate={updateDraft}
            onSave={saveProgram}
            onCancel={closeEdit}
            isNew={editingId === 'new'}
          />
        )}
      </div>

    </div>
  );
}
