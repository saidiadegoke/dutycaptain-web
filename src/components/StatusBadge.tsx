import { AgentKind } from '@/types';
import type { TaskStatus, StepStatus } from '@/lib/types';

/**
 * Status chrome for the REAL lifecycle.
 *
 * The mock had six task statuses; the runtime has nine, and three of them —
 * `planning`, `waiting_for_device`, `cancelled` — the mock never imagined. The
 * two that overlap are named differently (`completed` vs `done`,
 * `awaiting_approval` vs `waiting_for_approval`), so this is a replacement
 * rather than an extension.
 *
 * The suspended states share a tone deliberately: `paused`,
 * `waiting_for_approval` and `waiting_for_device` are all "alive, but waiting
 * on something", and reading as one family is the point — a user should see at
 * a glance that the task has not failed.
 */
const taskStyles: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
  queued: { label: 'Queued', cls: 'bg-canvas text-ink-500 border-line', dot: 'bg-ink-400' },
  planning: { label: 'Planning', cls: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-400' },
  running: { label: 'Running', cls: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-600' },
  waiting_for_approval: { label: 'Needs approval', cls: 'bg-warn-50 text-warn-700 border-warn-100', dot: 'bg-warn-600' },
  waiting_for_device: { label: 'Waiting for device', cls: 'bg-warn-50 text-warn-700 border-warn-100', dot: 'bg-warn-500' },
  waiting_for_input: { label: 'Needs your search', cls: 'bg-warn-50 text-warn-700 border-warn-100', dot: 'bg-warn-600' },
  // Its own badge rather than a shade of "waiting": the question it asks a
  // person is about money, and the answer is a number (P2-07).
  waiting_for_budget: { label: 'Out of budget', cls: 'bg-warn-50 text-warn-700 border-warn-100', dot: 'bg-warn-600' },
  paused: { label: 'Paused', cls: 'bg-canvas text-ink-700 border-line-strong', dot: 'bg-ink-500' },
  done: { label: 'Done', cls: 'bg-ok-50 text-ok-700 border-ok-100', dot: 'bg-ok-600' },
  failed: { label: 'Failed', cls: 'bg-danger-50 text-danger-700 border-danger-100', dot: 'bg-danger-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-canvas text-ink-500 border-line', dot: 'bg-ink-400' }
};

export function TaskStatusBadge({ status }: {status: TaskStatus;}) {
  // A status the UI has not been taught yet should read as itself, not crash a
  // page — the event vocabulary and the status list both grow by phase.
  const s = taskStyles[status] ?? { label: status, cls: 'bg-canvas text-ink-500 border-line', dot: 'bg-ink-400' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium ${s.cls}`}>
      
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>);

}

const stepStyles: Record<StepStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'text-ink-500 bg-canvas border-line' },
  ready: { label: 'Ready', cls: 'text-ink-700 bg-canvas border-line-strong' },
  running: { label: 'Running', cls: 'text-brand-700 bg-brand-50 border-brand-200' },
  waiting: { label: 'Waiting', cls: 'text-warn-700 bg-warn-50 border-warn-100' },
  done: { label: 'Done', cls: 'text-ok-700 bg-ok-50 border-ok-100' },
  failed: { label: 'Failed', cls: 'text-danger-700 bg-danger-50 border-danger-100' },
  skipped: { label: 'Skipped', cls: 'text-ink-500 bg-canvas border-line' },
  cancelled: { label: 'Cancelled', cls: 'text-ink-500 bg-canvas border-line' }
};

export function StepStatusBadge({ status }: {status: StepStatus;}) {
  const s = stepStyles[status] ?? { label: status, cls: 'text-ink-500 bg-canvas border-line' };
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-[2px] text-[11px] font-medium ${s.cls}`}>
      
      {s.label}
    </span>);

}

/**
 * A capability, rendered as the model sees it.
 *
 * Replaces the mock's `AgentKind`: §2 is explicit that the model sees
 * capability NAMES and never learns which runtime satisfied one, so labelling a
 * step "Browser" or "Vision" would be describing an implementation detail the
 * router owns — and often getting it wrong.
 */
export function CapabilityTag({ capability, runtime }: {capability: string;runtime?: string | null;}) {
  return (
    <span
      title={runtime ? `ran on: ${runtime}` : undefined}
      className="inline-flex items-center rounded border border-line bg-canvas px-1.5 py-[2px] font-mono text-[10px] tracking-wide text-ink-700">
      
      {capability}
    </span>);

}

const agentLabels: Record<AgentKind, string> = {
  planner: 'Planner',
  browser: 'Browser',
  vision: 'Vision',
  search: 'Search',
  file: 'File',
  api: 'API',
  human: 'Human'
};

/** Still used by the pages that remain on fixtures (Approvals, Audit, Models). */
export function AgentTag({ agent }: {agent: AgentKind;}) {
  return (
    <span className="inline-flex items-center rounded border border-line bg-canvas px-1.5 py-[2px] font-mono text-[10px] uppercase tracking-wide text-ink-700">
      {agentLabels[agent]}
    </span>);

}
