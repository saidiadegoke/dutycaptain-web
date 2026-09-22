/**
 * The API's shapes, not the mock's.
 *
 * `src/types/index.ts` describes the design mock — `Task` there has `workers`,
 * `eta`, `owner` and `connector`, none of which the runtime has or will. Rather
 * than bend one into the other, the real contract lives here and the mock types
 * stay where they are for the pages still using them (Approvals, Artifacts,
 * Audit, Models — Phases 3 to 6 build those).
 *
 * The status vocabularies differ too, and the API's is the one that is real:
 * the mock has `completed` and `awaiting_approval`; the runtime has `done`,
 * `waiting_for_approval`, and also `planning`, `waiting_for_device` and
 * `cancelled`, which the mock never imagined.
 */

export type TaskStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'waiting_for_approval'
  | 'waiting_for_device'
  | 'paused'
  | 'done'
  | 'failed'
  | 'cancelled';

export type StepStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'waiting'
  | 'done'
  | 'failed'
  | 'skipped'
  | 'cancelled';

/** §6's typed Observation. Every actuator returns one; none returns a string. */
export interface Observation {
  status: 'success' | 'partial' | 'failure';
  capability: string;
  runtime: 'cloud' | 'device' | 'browser';
  durationMs: number;
  summary: string;
  data: Record<string, unknown>;
  error?: { code: string; message: string; retryable: boolean };
  artifacts?: { id: string; kind: string }[];
  cost?: { usd?: number; tokens?: number };
}

export interface Step {
  id: string;
  key: string;
  title: string;
  capability: string;
  status: StepStatus;
  runtime: string | null;
  depends_on: string[];
  attempt: number;
  plan_version: number;
  observation: Observation | null;
  verification: Record<string, unknown> | null;
  cost_usd: number | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface Artifact {
  id: string;
  kind: string;
  filename: string | null;
  mime: string | null;
  bytes: number | null;
  origin: 'cloud' | 'device';
  step_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  objective: string;
  status: TaskStatus;
  plan_version: number;
  budget: Record<string, unknown>;
  error: { code?: string; message?: string } | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

/** `GET /tasks/:id` — the task plus its current plan. */
export interface TaskDetail extends Task {
  state?: Record<string, unknown>;
  steps: Step[];
  artifacts: Artifact[];
}

/**
 * One row of the timeline, as the event log projects it.
 *
 * `seq` is the SSE cursor: it is what the stream emits as an event `id`, and
 * what a reconnect sends back in `Last-Event-ID` to resume rather than replay.
 */
export interface TimelineEvent {
  seq: number;
  at: string;
  type: string;
  stepId: string | null;
  stepKey: string | null;
  title: string | null;
  capability: string | null;
  summary: string;
  payload: Record<string, any>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SessionUser {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

/** Statuses from which nothing follows. Mirrors the orchestrator's own list. */
export const TERMINAL: TaskStatus[] = ['done', 'failed', 'cancelled'];

/** Alive, but waiting on something rather than working. */
export const SUSPENDED: TaskStatus[] = ['waiting_for_approval', 'waiting_for_device', 'paused'];

export const isTerminal = (s: TaskStatus) => TERMINAL.includes(s);
export const isSuspended = (s: TaskStatus) => SUSPENDED.includes(s);
export const isActive = (s: TaskStatus) => !isTerminal(s) && !isSuspended(s);
