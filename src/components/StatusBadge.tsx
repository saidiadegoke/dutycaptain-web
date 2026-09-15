import { AgentKind, JobStatus, TaskStatus } from '@/types';

const jobStyles: Record<JobStatus, {label: string;cls: string;dot: string;}> = {
  running: { label: 'Running', cls: 'bg-brand-50 text-brand-700 border-brand-200', dot: 'bg-brand-600' },
  awaiting_approval: { label: 'Awaiting approval', cls: 'bg-warn-50 text-warn-700 border-warn-100', dot: 'bg-warn-600' },
  completed: { label: 'Completed', cls: 'bg-ok-50 text-ok-700 border-ok-100', dot: 'bg-ok-600' },
  failed: { label: 'Failed', cls: 'bg-danger-50 text-danger-700 border-danger-100', dot: 'bg-danger-600' },
  queued: { label: 'Queued', cls: 'bg-canvas text-ink-500 border-line', dot: 'bg-ink-400' },
  paused: { label: 'Paused', cls: 'bg-canvas text-ink-700 border-line-strong', dot: 'bg-ink-500' }
};

export function JobStatusBadge({ status }: {status: JobStatus;}) {
  const s = jobStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium ${s.cls}`}>
      
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>);

}

const taskStyles: Record<TaskStatus, {label: string;cls: string;}> = {
  done: { label: 'Done', cls: 'text-ok-700 bg-ok-50 border-ok-100' },
  running: { label: 'Running', cls: 'text-brand-700 bg-brand-50 border-brand-200' },
  queued: { label: 'Queued', cls: 'text-ink-500 bg-canvas border-line' },
  failed: { label: 'Failed', cls: 'text-danger-700 bg-danger-50 border-danger-100' },
  blocked: { label: 'Blocked', cls: 'text-warn-700 bg-warn-50 border-warn-100' }
};

export function TaskStatusBadge({ status }: {status: TaskStatus;}) {
  const s = taskStyles[status];
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-[2px] text-[11px] font-medium ${s.cls}`}>
      
      {s.label}
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

export function AgentTag({ agent }: {agent: AgentKind;}) {
  return (
    <span className="inline-flex items-center rounded border border-line bg-canvas px-1.5 py-[2px] font-mono text-[10px] uppercase tracking-wide text-ink-700">
      {agentLabels[agent]}
    </span>);

}