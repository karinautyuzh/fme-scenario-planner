import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useScenario } from '../../state/ScenarioContext';
import { useEngineOutput } from '../../engine/useEngine';
import { buildThoughtPartnerContext, buildSuggestedPrompts } from '../../services/thoughtPartner/contextBuilder';
import { createThoughtPartnerService } from '../../services/thoughtPartner/service';
import {
  ThoughtPartnerMessage,
  IndustryInsight,
} from '../../services/thoughtPartner/types';

// ─── Trigger Button ───────────────────────────────────────────────────────────

interface ThoughtPartnerButtonProps {
  onOpen: () => void;
}

export function ThoughtPartnerButton({ onOpen }: ThoughtPartnerButtonProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open Transformation Thought Partner"
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: 'var(--navy)',
        color: 'white',
        border: 'none',
        padding: '10px 18px 10px 14px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,51,102,0.4)',
        letterSpacing: '0.01em',
        borderRadius: 4,
        transition: 'background 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget;
        b.style.background = '#004080';
        b.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget;
        b.style.background = 'var(--navy)';
        b.style.transform = 'translateY(0)';
      }}
    >
      <TPIcon color="rgba(255,255,255,0.8)" />
      Transformation Thought Partner
    </button>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

const _service = createThoughtPartnerService();

function uid() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso() {
  return new Date().toISOString();
}

interface ThoughtPartnerPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ThoughtPartnerPanel({ open, onClose }: ThoughtPartnerPanelProps) {
  const { state, activeScenario } = useScenario();
  const engine = useEngineOutput(activeScenario);

  const context = useMemo(
    () => buildThoughtPartnerContext(activeScenario, engine, state.scenarios, state.programLibrary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeScenario.metadata.id, activeScenario.metadata.updatedAt, engine, state.scenarios.length, state.programLibrary]
  );

  const [messages, setMessages] = useState<ThoughtPartnerMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Generate opening message on first open
  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      const valueText =
        context.totalAnnualValueEurM !== null
          ? `The model currently shows **€${context.totalAnnualValueEurM.toFixed(1)}M${context.totalAnnualValueStatus === 'PARTIAL' ? '+' : ''}/yr** in modeled annual value.`
          : context.missingFinancialInputs.length > 0
            ? `A few financial baseline inputs are still needed before the value calculation can run.`
            : `Ready to explore your scenario.`;

      const programText =
        context.selectedProgramCount === 0
          ? `No programs are selected yet.`
          : `${context.selectedProgramCount} program${context.selectedProgramCount > 1 ? 's' : ''} in scope: ${context.selectedPrograms.join(', ')}.`;

      const opening: ThoughtPartnerMessage = {
        id: uid(),
        role: 'assistant',
        content: `I've reviewed **"${context.scenarioName}"**. ${programText} ${valueText}\n\nI can help you pressure-test assumptions, understand what's driving value, explore timeline trade-offs, or find relevant industry benchmarks. What would you like to explore?`,
        timestamp: nowIso(),
        intent: 'GENERAL',
        suggestedFollowUps: [],
      };
      setMessages([opening]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, thinking]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      const userMsg: ThoughtPartnerMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        timestamp: nowIso(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setThinking(true);

      try {
        const response = await _service.sendMessage(trimmed, context, messages);
        const assistantMsg: ThoughtPartnerMessage = {
          id: uid(),
          role: 'assistant',
          content: response.content,
          timestamp: nowIso(),
          intent: response.intent,
          insights: response.insights,
          suggestedFollowUps: response.suggestedFollowUps,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setThinking(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [thinking, context, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Contextual prompts — either follow-ups from last assistant msg, or scenario-derived prompts
  const lastAssistantMsg = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant'),
    [messages]
  );

  const showFollowUps =
    !thinking &&
    messages.length > 1 &&
    lastAssistantMsg?.suggestedFollowUps &&
    lastAssistantMsg.suggestedFollowUps.length > 0;

  const showOpeningPrompts =
    !thinking &&
    messages.length === 1 &&
    messages[0].role === 'assistant';

  const openingPrompts = useMemo(
    () =>
      buildSuggestedPrompts(context)
        .filter((p) => p.conditionMet)
        .slice(0, 4),
    [context]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 490,
          background: 'rgba(26,39,64,0.25)',
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          zIndex: 500,
          background: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        aria-label="Transformation Thought Partner"
      >
        {/* ── Header ── */}
        <div
          style={{
            background: 'var(--navy)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TPIcon color="rgba(255,255,255,0.85)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', letterSpacing: '0.01em' }}>
                Transformation Thought Partner
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginTop: 1 }}>
                Accenture × FME
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Thought Partner"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: 3,
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'white')}
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)')
            }
          >
            ×
          </button>
        </div>

        {/* ── Scenario Context Strip ── */}
        <ScenarioContextStrip context={context} />

        {/* ── Messages ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onPromptClick={handleSend} />
          ))}

          {thinking && <ThinkingIndicator />}

          {/* Suggested prompts after last assistant message */}
          {showFollowUps && lastAssistantMsg?.suggestedFollowUps && (
            <SuggestedPromptsRow
              prompts={lastAssistantMsg.suggestedFollowUps}
              onSelect={handleSend}
            />
          )}

          {/* Opening prompts when conversation just started */}
          {showOpeningPrompts && openingPrompts.length > 0 && (
            <SuggestedPromptsRow
              prompts={openingPrompts.map((p) => p.text)}
              onSelect={handleSend}
              label="Explore questions like"
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--grey-1)',
            background: 'white',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              background: 'var(--grey-0)',
              border: '1px solid var(--grey-1)',
              borderRadius: 6,
              padding: '8px 10px 8px 14px',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your scenario…"
              disabled={thinking}
              rows={1}
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                resize: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: 'var(--navy)',
                lineHeight: 1.5,
                minHeight: 22,
                maxHeight: 100,
                outline: 'none',
                paddingTop: 1,
              }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 100)}px`;
              }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || thinking}
              aria-label="Send message"
              style={{
                background: !input.trim() || thinking ? 'var(--grey-1)' : 'var(--navy)',
                border: 'none',
                color: !input.trim() || thinking ? 'var(--grey-2)' : 'white',
                cursor: !input.trim() || thinking ? 'not-allowed' : 'pointer',
                width: 32,
                height: 32,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <SendIcon />
            </button>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--grey-2)',
              marginTop: 6,
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          >
            Local prototype · Context-aware · No external data sent ·{' '}
            <span style={{ color: '#B45309' }}>Benchmarks are illustrative</span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Scenario Context Strip ───────────────────────────────────────────────────

function ScenarioContextStrip({
  context,
}: {
  context: ReturnType<typeof buildThoughtPartnerContext>;
}) {
  const valueLabel =
    context.totalAnnualValueEurM !== null
      ? `€${context.totalAnnualValueEurM.toFixed(1)}M${context.totalAnnualValueStatus === 'PARTIAL' ? '+' : ''}/yr`
      : context.missingFinancialInputs.length > 0
        ? 'Needs inputs'
        : '—';

  const valueColor =
    context.totalAnnualValueEurM !== null
      ? context.totalAnnualValueStatus === 'PARTIAL'
        ? '#D97706'
        : '#047857'
      : 'var(--grey-2)';

  const programLabel =
    context.selectedProgramCount === 0
      ? 'No programs'
      : `${context.selectedProgramCount} program${context.selectedProgramCount > 1 ? 's' : ''}`;

  return (
    <div
      style={{
        background: '#F0F4F8',
        borderBottom: '1px solid var(--grey-1)',
        padding: '10px 20px',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {/* Lock icon for base case */}
      {context.isBaseCaseLocked && (
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ flexShrink: 0 }}>
          <rect x="0.75" y="5" width="8.5" height="6" rx="1.25" stroke="var(--grey-2)" strokeWidth="1.5" fill="none" />
          <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="var(--grey-2)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--navy)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {context.scenarioName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--grey-2)', marginTop: 1 }}>
          {programLabel} · {context.integratedValueStartLabel} value start
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: valueColor }}>{valueLabel}</div>
        <div style={{ fontSize: 10, color: 'var(--grey-2)', marginTop: 1 }}>annual value</div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onPromptClick,
}: {
  message: ThoughtPartnerMessage;
  onPromptClick: (text: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            background: 'var(--navy)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <TPIcon color="rgba(255,255,255,0.85)" size={14} />
        </div>
      )}

      <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Content bubble */}
        <div
          style={{
            background: isUser ? 'var(--navy)' : 'white',
            border: isUser ? 'none' : '1px solid var(--grey-1)',
            color: isUser ? 'white' : 'var(--navy)',
            padding: '10px 14px',
            borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <RichContent content={message.content} />
          )}
        </div>

        {/* Insight cards */}
        {!isUser && message.insights && message.insights.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {message.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rich Content Renderer ────────────────────────────────────────────────────

function RichContent({ content }: { content: string }) {
  const paragraphs = content.split('\n\n');
  return (
    <>
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n');
        return (
          <div key={pi} style={{ marginBottom: pi < paragraphs.length - 1 ? 10 : 0 }}>
            {lines.map((line, li) => (
              <div key={li} style={{ lineHeight: 1.65 }}>
                <InlineFormatted text={line} />
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function InlineFormatted({ text }: { text: string }) {
  // Split on **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: IndustryInsight }) {
  const [expanded, setExpanded] = useState(false);
  const labelColor = insight.isDemoData ? '#5B21B6' : '#1E40AF';
  const labelBg = insight.isDemoData ? '#EDE9FE' : '#DBEAFE';

  return (
    <div
      style={{
        background: '#FAFBFD',
        border: '1px solid var(--grey-1)',
        borderLeft: `3px solid ${labelColor}`,
        borderRadius: '0 6px 6px 0',
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            background: labelBg,
            color: labelColor,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '2px 5px',
            borderRadius: 2,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {insight.sourceLabel}
        </span>
        <span style={{ color: 'var(--navy)', lineHeight: 1.5 }}>{insight.claim}</span>
      </div>
      {expanded && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: 'var(--grey-3)',
            lineHeight: 1.55,
            borderTop: '1px solid var(--grey-1)',
            paddingTop: 6,
          }}
        >
          {insight.detail}
        </div>
      )}
      <button
        onClick={() => setExpanded((x) => !x)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          color: 'var(--blue)',
          padding: '4px 0 0',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {expanded ? 'Show less' : 'More context'}
      </button>
    </div>
  );
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

function SuggestedPromptsRow({
  prompts,
  onSelect,
  label,
}: {
  prompts: string[];
  onSelect: (text: string) => void;
  label?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--grey-2)',
            marginBottom: 2,
          }}
        >
          {label}
        </div>
      )}
      {prompts.slice(0, 4).map((prompt, i) => (
        <button
          key={i}
          onClick={() => onSelect(prompt)}
          style={{
            background: 'var(--grey-0)',
            border: '1px solid var(--grey-1)',
            borderLeft: '3px solid var(--blue)',
            padding: '7px 12px',
            textAlign: 'left',
            fontSize: 12,
            color: 'var(--navy)',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.45,
            fontStyle: 'italic',
            borderRadius: '0 4px 4px 0',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = '#EBF4FF')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'var(--grey-0)')
          }
        >
          "{prompt}"
        </button>
      ))}
    </div>
  );
}

// ─── Thinking Indicator ───────────────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 28,
          height: 28,
          background: 'var(--navy)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <TPIcon color="rgba(255,255,255,0.85)" size={14} />
      </div>
      <div
        style={{
          background: 'white',
          border: '1px solid var(--grey-1)',
          padding: '12px 16px',
          borderRadius: '12px 12px 12px 4px',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              background: 'var(--grey-2)',
              borderRadius: '50%',
              display: 'inline-block',
              animation: `tp-dot 1.2s ${i * 0.2}s infinite ease-in-out`,
            }}
          />
        ))}
        <style>{`
          @keyframes tp-dot {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
            40% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TPIcon({ color = 'white', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <path
        d="M5.5 6.5C5.5 5.12 6.62 4 8 4C9.38 4 10.5 5.12 10.5 6.5C10.5 7.5 9.9 8.35 9.05 8.77C8.72 8.94 8.5 9.28 8.5 9.64V10"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12" r="0.8" fill={color} />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 7L13 1L7 13L6 8L1 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
