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
  | 'waiting_for_review'
  | 'waiting_for_approval'
  | 'waiting_for_device'
  | 'waiting_for_budget'
  | 'waiting_for_input'
  | 'paused'
  | 'done'
  | 'partial'
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
  | 'cancelled'
  | 'partial';

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

/** A verifier's verdict on one step (P2-06, §7.2). Deterministic code, never a model. */
export interface Verification {
  passed: boolean;
  tier: 'targeted' | 'broad' | 'full';
  checks: { name: string; tier: string; passed: boolean; detail?: string }[];
  reason: string | null;
  at: string;
}

/**
 * Caps in force and what has been spent against them (P2-07).
 *
 * `used.estimated` is true because these are token counts multiplied by a price
 * table, not an invoice from the provider. A number presented as money gets
 * believed, so the UI says so.
 */
/**
 * Where one step's time went (P2-10).
 *
 * `finished_at - started_at` cannot answer this: the clock on the row starts
 * when the step is CLAIMED, which is after its arguments turn — so the model
 * time, which dominates, is invisible in it.
 */
export interface StepTimings {
  decideMs: number;
  dispatchMs: number;
  verifyMs: number;
  attempts: number;
}

export interface CostRollup {
  steps: {
    key: string; capability: string; status: string; attempts: number;
    costUsd: number; decideMs: number; dispatchMs: number; verifyMs: number; totalMs: number;
  }[];
  totals: {
    costUsd: number; stepCostUsd: number; overheadUsd: number;
    byKind: Record<string, { usd: number; tokens: number; calls: number }>;
    decideMs: number; dispatchMs: number; verifyMs: number; stepMs: number; wallClockMs: number;
  };
  decideShare: number | null;
  /** Every model call the task made, by feature — planning and extraction alike. */
  aiByFeature?: { feature: string | null; calls: number; tokens_in: number; tokens_out: number; cost_usd: number }[];
  counters?: { modelCalls: number; webRequests: number; externalActions: number };
}

export interface TaskBudget {
  caps: { usd: number; tokens: number; wallClockMs: number; steps: number; modelCalls?: number; webRequests?: number; externalActions?: number };
  used: {
    usd: number; tokensIn: number; tokensOut: number; calls: number; estimated?: boolean;
    /** Phase 0 counters: pages and searches fetched, and actions taken outside. */
    webRequests?: number; externalActions?: number;
  };
}

/**
 * One rung of the recovery ladder a step went down (P2-08).
 *
 * Retries and escalations share the trail because "it succeeded on the third
 * try" and "it succeeded at the browser level" are both things a reader needs
 * to see, and a trail with only one of them would imply the other never
 * happened.
 */
export interface RecoveryEntry {
  kind: 'retry' | 'escalate';
  at: string;
  attempt?: number;
  reason?: string;
  from?: number;
  to?: number;
}

export interface Step {
  id: string;
  key: string;
  title: string;
  /** What the planner said this step must achieve (P2-01); null on reactive steps. */
  goal: string | null;
  capability: string;
  status: StepStatus;
  runtime: string | null;
  depends_on: string[];
  attempt: number;
  escalations: RecoveryEntry[];
  plan_version: number;
  observation: Observation | null;
  verification: Verification | null;
  cost_usd: number | null;
  timings: StepTimings | null;
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
  budget: TaskBudget;
  error: { code?: string; message?: string } | null;
  /** Where its result is sent when it finishes. */
  delivery?: { endpoint_id: string; when: 'done' | 'finished' } | null;
  /** Stops after planning for its owner to review (migration 054). */
  review_plan?: boolean;
  plan_approved_at?: string | null;
  /** The schedule its reviewed plan becomes, once approved. */
  pending_schedule?: { name: string | null; times: string[]; days: number[]; timezone: string } | null;
  schedule_id?: string | null;
  /** Files attached when it was created (migration 056). */
  attachments?: TaskAttachment[];
  /** Paused by the runtime to wait for the AI service, until then (migration 057). */
  resume_at?: string | null;
  pause_reason?: string | null;
  ai_waits?: number;
  /** Times a restart cut this task off mid-run. */
  interruptions?: number;
  /** Set when the admin Simulator created it. */
  sim_run_id?: string | null;
  /** What it must hand back, agreed before planning (phase 1). */
  contract?: OutputContract | null;
  contract_approved_at?: string | null;
  /** What code measured against the contract — the status comes from this. */
  measured?: MeasuredOutcome | null;
  /** Content it read tried to give orders: it asks before acting outside. */
  flags?: { injection?: { at: string; sources: { source_id: string; locator: string; kind: string; signals: { signal: string; excerpt: string }[] }[] } };
  /** What a finished task came to, in words (detail only; null until done). */
  outcome?: { summary: string | null; steps_run: number | null; steps_failed: number; steps_skipped: number } | null;
  /** 1 for an original; 2+ for a retry. */
  attempt?: number;
  /** The attempt this one retried, if it is a retry. */
  retry_of?: string | null;
  /** What a retry carried: the user's note, and which attempts it learned from. */
  retry?: { note: string | null; learned_from: number[]; objective_changed: boolean };
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * `GET /tasks` — a task with its step counts.
 *
 * Its own type rather than fields on `Task`, because `TaskDetail.steps` is the
 * full step rows and the two cannot share a name. Declared once here rather
 * than re-invented locally in each view, which is what was happening.
 */
export interface TaskListItem extends Task {
  steps: { total: number; done: number; failed: number };
}

/** `GET /tasks/:id` — the task plus its current plan. */
export interface TaskDetail extends Task {
  state?: Record<string, unknown>;
  steps: Step[];
  artifacts: Artifact[];
  /** Later attempts made from this one, oldest first. */
  retries?: { id: string; attempt: number; status: TaskStatus; created_at: string }[];
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

/**
 * A durable extracted value (P2-05, §5.4).
 *
 * `found: false` is a real state, not an error: the step asked for a path that
 * was not in what it got back. Recorded rather than dropped, because a silently
 * missing fact looks exactly like one nobody asked for.
 */
export interface Fact {
  key: string;
  path: string;
  found: boolean;
  value: unknown;
  note?: string;
  clipped?: boolean;
  step: string;
  at: string;
}

export interface TaskState {
  objective: string;
  status: string;
  planVersion: number;
  plan: { key: string; title: string; goal: string | null; capability: string; status: string; dependsOn: string[] }[];
  completed: unknown[];
  failures: unknown[];
  artifacts: unknown[];
  facts: Fact[];
  connections: string[];
  devices: unknown[];
  budget: { usdSpent: number; wallClockMs: number | null; caps: Record<string, unknown> };
}

export interface TaskStateResponse {
  state: TaskState | null;
  built_at: string | null;
  fresh: boolean;
}

/**
 * What changed between two plan versions (P2-04).
 *
 * `changed` is the one a set difference would miss: a step that kept its key
 * but was re-pointed, swapped onto a different capability or given a new goal
 * is neither added nor removed, and showing it as unchanged is how a plan
 * quietly stops meaning what the user read.
 */
export interface PlanDiff {
  added: string[];
  removed: string[];
  changed: { key: string; fields: string[] }[];
  unchanged: string[];
}

export interface PlanVersion {
  version: number;
  kind: 'created' | 'amended' | 'replanned';
  at: string;
  seq: number;
  reason: string | null;
  steps: { key: string; title: string; capability: string; depends_on: string[] }[];
  immediate: string[];
  carriedForward: string[] | null;
  diff: PlanDiff | null;
  summary: string;
}

export interface PlanHistory {
  current_version: number;
  planned_at: string | null;
  versions: PlanVersion[];
}

/**
 * A question the policy engine put to a person (P3-06/07).
 *
 * `args_preview` is scrubbed and bounded — a copy of the arguments for reading,
 * not the arguments themselves (P3-08). `args_hash` is what makes a grant mean
 * the call that was SHOWN rather than the capability in general.
 */
export interface Approval {
  id: string;
  task_id: string;
  step_id: string | null;
  capability: string;
  summary: string;
  args_preview: Record<string, unknown>;
  args_hash: string;
  policy_reason: string | null;
  status: 'pending' | 'granted' | 'denied' | 'expired' | 'cancelled';
  scope: 'once' | 'task' | 'always' | null;
  decided_at: string | null;
  decision_note: string | null;
  expires_at: string | null;
  created_at: string;
  task_objective?: string;
  task_status?: TaskStatus;
}

export interface ApprovalGrant {
  id: string;
  task_id: string | null;
  capability: string;
  args_hash: string | null;
  created_at: string;
}

/**
 * A computer the user has enrolled (P4-01/08).
 *
 * `connected` is DERIVED by the API from `last_seen_at`, not stored — a socket
 * lives in one API process and a column saying `online` outlives it. Both are
 * carried so the console can show "offline, last seen 4h ago" rather than a
 * bare dot that says nothing about how stale it is.
 */
export interface Device {
  id: string;
  name: string;
  platform: string | null;
  agent_version: string | null;
  status: 'active' | 'revoked';
  connected: boolean;
  /** §8.3's manifest: what the machine says it CAN do. Not what it may do. */
  capabilities: Record<string, boolean | string[]>;
  capabilities_at: string | null;
  last_seen_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  key_fingerprint: string | null;
}

/** What a computer is ALLOWED to do (§8.5) — separate from what it can do. */
export interface DeviceGrant {
  id: string;
  device_id: string;
  device_name?: string;
  capability: string;
  /** The rule as stored, e.g. `{ root: { under: ['~/Documents'] } }`. */
  scope: Record<string, { under?: string[]; equals?: string | string[]; matches?: string }>;
  grant_scope: 'task' | 'always';
  task_id: string | null;
  approval_id: string | null;
  expires_at: string | null;
  created_at: string;
}

/** An enrolment code, as issued. The code itself is returned exactly once. */
export interface DeviceEnrolment {
  code: string;
  expires_at: string;
  expires_in: number;
  proposed_name: string | null;
}

export interface PendingEnrolment {
  id: string;
  proposed_name: string | null;
  expires_at: string;
  created_at: string;
}

/** One event as the audit returns it. */
export interface AuditEvent {
  seq: number;
  type: string;
  created_at: string;
  payload: Record<string, any>;
}

/**
 * The chain for one step (P3-09): proposal → policy → approval → execution.
 *
 * `approvalMatched` is the question the audit exists to answer — the
 * fingerprint the policy judged at execution against the one the person was
 * shown. `null` means it cannot be told, which is not the same as `false`.
 */
export interface AuditChain {
  stepKey: string;
  capability: string | null;
  title: string | null;
  proposed: AuditEvent | null;
  decided: AuditEvent | null;
  approval: { requested: AuditEvent | null; answered: AuditEvent | null };
  started: AuditEvent[];
  observations: AuditEvent[];
  verification: AuditEvent | null;
  recovery: AuditEvent[];
  repair: AuditEvent[];
  approvalMatched: boolean | null;
  approvedHash?: string | null;
  executedHash?: string | null;
}

export interface AuditTrailResponse {
  task: { id: string; objective: string; status: TaskStatus };
  steps: AuditChain[];
  task_events: AuditEvent[];
  approvals: Approval[];
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
  role?: string | null;
  roles?: string[];
  /** Emails (task needs you, approvals) are only sent to a verified address. */
  email_verified?: boolean;
}

/** `GET /notifications/preferences` — the email switches this console shows. */
export interface NotificationPreferences {
  tasks_email: boolean;
  approvals_email: boolean;
  devices_email: boolean;
  [key: string]: unknown;
}

/** Statuses from which nothing follows. Mirrors the orchestrator's own list. */
export const TERMINAL: TaskStatus[] = ['done', 'failed', 'cancelled'];

/** Alive, but waiting on something rather than working. */
export const SUSPENDED: TaskStatus[] = [
  'waiting_for_review', 'waiting_for_approval', 'waiting_for_device', 'waiting_for_budget', 'waiting_for_input', 'paused',
];

export const isTerminal = (s: TaskStatus) => TERMINAL.includes(s);
export const isSuspended = (s: TaskStatus) => SUSPENDED.includes(s);
export const isActive = (s: TaskStatus) => !isTerminal(s) && !isSuspended(s);

/** A search a task has handed to its owner (migration 050). */
export interface SearchRequest {
  id: string;
  task_id: string;
  step_id: string | null;
  query: string;
  max_results: number;
  status: 'pending' | 'answered' | 'declined' | 'expired' | 'cancelled';
  answer: { results: { url: string | null; title: string | null; content: string | null; file?: string }[]; notes: string | null } | null;
  created_at: string;
  answered_at: string | null;
  expires_at: string;
  /** Where to start: the query in the person's own browser. */
  search_url: string;
}

/** A file uploaded to answer a search: `file` is its text, in the task workspace. */
export interface SearchUpload {
  file: string;
  name: string;
  chars: number;
  preview: string;
}

/** `GET /search/settings` — which providers this account uses, and why. */
export interface SearchSettings {
  effective: string[];
  account: string[] | null;
  platform: string[];
  providers: {
    name: string;
    label: string;
    kind: 'paid' | 'free' | 'you';
    note: string;
    platformEnabled: boolean;
    installed: boolean;
  }[];
}

/** A file a task produced, with the task that made it (GET /artifacts). */
export interface ArtifactRow {
  id: string;
  task_id: string;
  step_id: string | null;
  kind: string;
  filename: string | null;
  mime: string | null;
  bytes: number;
  origin: 'cloud' | 'device';
  created_at: string;
  task_objective: string;
  task_status: TaskStatus;
}

/** A section the server could not check says so instead of failing the page. */
type Checked<T> = T | { error: string };

export interface RuntimeProvider {
  name: string;
  label: string;
  order: number;
  state: 'ready' | 'benched' | 'not set up';
  kind?: 'paid' | 'free' | 'you';
  reason?: string;
  until?: string;
}

/** What runs this account's tasks, right now (GET /runtime/status). */
export interface RuntimeStatus {
  checkedAt: string;
  ai: Checked<{ connection: string | null; gateway: string; providers: RuntimeProvider[]; model: string | null }>;
  search: Checked<{ chosenByAccount: boolean; providers: RuntimeProvider[] }>;
  python: Checked<{ executor: string; available: boolean; fallback: { executor: string; available: boolean } | null; files: boolean }>;
  browser: Checked<{ available: boolean }>;
  computers: Checked<{ total: number; connected: number }>;
  tasks: Checked<{ days: number; total: number; byStatus: Partial<Record<TaskStatus, number>> }>;
}

export const checked = <T extends object>(v: T | { error: string } | undefined): T | null =>
  v && !('error' in v) ? v as T : null;

/** A saved API a task can send its result to (secret values are never returned). */
/** An account API key, as listed — the secret itself is shown once, at creation. */
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked';
  last_used_at?: string | null;
  created_at: string;
}

export interface Endpoint {
  id: string;
  name: string;
  description: string | null;
  method: 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  /** Names only. */
  secret_headers: string[];
  body_template: unknown | null;
  approval: 'ask' | 'auto';
  timeout_ms: number;
  /** It treats a repeated Idempotency-Key as the same request, so an unknown send can be asked again safely. */
  honours_idempotency_key?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EndpointInput {
  name?: string;
  description?: string | null;
  method?: Endpoint['method'];
  url?: string;
  headers?: Record<string, string>;
  /** Replaces every stored secret when given; leave out to keep them. */
  secret_headers?: Record<string, string>;
  body_template?: unknown | string | null;
  approval?: 'ask' | 'auto';
  timeout_ms?: number;
  honours_idempotency_key?: boolean;
}

/** One send to an endpoint, and what came back. */
export interface Delivery {
  id: string;
  task_id: string;
  step_id: string | null;
  endpoint_id: string | null;
  endpoint_name: string | null;
  trigger: 'completion' | 'step' | 'resend' | 'test';
  status: 'pending' | 'waiting_approval' | 'sending' | 'sent' | 'failed' | 'denied' | 'expired' | 'unknown' | 'checking';
  approval_id: string | null;
  /** What decided the outcome: the endpoint's answer, a safe repeat, or you. */
  settled_by?: 'response' | 'repeat' | 'person' | null;
  /** The Idempotency-Key header the last send carried. */
  idempotency_key?: string | null;
  request: { method?: string; url?: string; headers?: string[]; body?: string; body_bytes?: number };
  response: { status?: number; content_type?: string | null; json?: unknown; body?: string; location?: string } | null;
  error: string | null;
  attempts: number;
  created_at: string;
  sent_at: string | null;
}

export interface SendResult {
  ok: boolean;
  request: Delivery['request'];
  response?: Delivery['response'];
  error?: string;
  durationMs?: number;
}

/** Data a `human.collect` step asked the task's owner to gather. */
export interface InputRequest {
  id: string;
  task_id: string;
  step_id: string | null;
  instructions: string;
  fields: { name: string; type: 'string' | 'number' | 'date' | 'boolean'; description?: string | null; example?: string | null }[];
  max_items: number;
  min_items?: number;
  /** How to do it: numbered steps, where to go, and a sample row. */
  guide?: { steps: string[]; where: string[]; examples: Record<string, string>[]; sample?: string } | null;
  /** `confirm`: "did it happen?" — a send whose outcome was unknown, or a step a restart cut off. */
  kind?: 'collect' | 'confirm';
  subject?: { type: 'delivery'; delivery_id: string } | { type: 'step'; step_id: string } | null;
  status: 'pending' | 'answered' | 'declined' | 'expired' | 'cancelled';
  answer: { records: Record<string, unknown>[]; text: string | null; files: { name: string; file: string; chars: number; rows?: number }[]; notes: string | null } | null;
  created_at: string;
  answered_at: string | null;
  expires_at: string;
}

export type ScheduleMode = 'reuse_plan' | 'review_each' | 'auto';

export interface Schedule {
  id: string;
  name: string;
  objective: string;
  mode: ScheduleMode;
  times: string[];
  /** 0 = Sunday … 6 = Saturday; empty = every day. */
  days: number[];
  timezone: string;
  steps: { key: string; title: string; capability: string }[] | null;
  deliver_to: { endpoint_id: string; when: 'done' | 'finished' } | null;
  enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_task_id: string | null;
  last_skip_reason: string | null;
  run_count: number;
  created_at: string;
  runs?: { id: string; status: TaskStatus; created_at: string; finished_at: string | null }[];
}

export interface Capability {
  name: string;
  description: string;
}

export interface PersonSites {
  sites: string[];
  custom: boolean;
  defaults: string[];
}

export interface TaskAttachment {
  name: string;
  path: string;
  text_path: string | null;
  mime: string;
  bytes: number;
  chars: number | null;
  columns?: string[];
  preview: string | null;
  /** The source version recorded for it (migration 060). */
  source?: SourceRef;
  /** Marked sensitive: kept for this task only; sending anything outside asks first. */
  sensitive?: boolean;
  /** No text could be read from it (a broken file), and why. */
  unreadable?: string;
  /** The skill that read it, and why that one (phase 4: chosen by its type). */
  read_by?: string;
  read_reason?: string;
  /** How well OCR read it (phase 5): `poor` is read again by a vision model in the task. */
  read_quality?: 'good' | 'poor';
  unclear?: number;
}

/** A registered source version: what a value's provenance points at. */
export interface SourceRef {
  source_id: string;
  version_id: string;
  version: number;
  hash: string;
}

/** Something a task worked from, with every version it saw (migration 060). */
export interface TaskSource {
  id: string;
  kind: 'web' | 'http' | 'attachment' | 'upload' | 'person';
  locator: string;
  title: string | null;
  classification: 'public' | 'user_file' | 'sensitive';
  created_at: string;
  /** Text in it that reads like orders to an AI (migration 061). */
  signals?: { signal: string; excerpt: string }[] | null;
  versions: { id: string; version: number; hash: string; bytes: number; retrieved_at: string; step_id: string | null; kept: boolean; passages?: number }[];
  /** Carried over from an earlier attempt's source (phase 2: reused, not fetched again). */
  carried_from?: string | null;
}

/** The output contract (phase 1): what a task must hand back. */
export interface OutputContract {
  summary: string;
  shape: 'value' | 'records' | 'table' | 'prose' | 'file' | 'action';
  fields: { name: string; type: 'string' | 'number' | 'date' | 'boolean' | 'url'; required: boolean; description?: string }[];
  completeness: { rule: 'exactly_one' | 'all' | 'up_to' | 'best_effort' | 'coverage'; n?: number; items?: string[] };
  exactness: 'exact' | 'approximate';
  sources?: { authoritative: string[]; note?: string };
  freshness?: { max_age_days?: number; note?: string };
  actions: { kind: string; target: string; description?: string }[];
  destination?: string;
  checks?: { check: string; said?: string; was?: string; now?: string; corrected: boolean }[];
  review?: { required: boolean; reasons: string[] };
}

/** What code counted against the contract (phase 1's completeness invariant). */
export interface MeasuredOutcome {
  status: 'done' | 'partial' | 'failed';
  rule: string;
  /** The step whose records were counted. */
  from_step?: string | null;
  expected: number | null;
  found: number;
  covered?: number;
  missing: string[];
  dropped: number;
  reason: string | null;
  attempted: number;
  succeeded: number;
  partial: number;
  failed: number;
  not_attempted: number;
  model_verdict?: 'finished' | 'failed';
}

/** One delivered value and its lineage (phase 3): "why this value?". */
export interface ValueProvenance {
  id: string;
  step_id: string | null;
  attempt: number;
  record_index: number;
  record_key: string | null;
  field: string;
  value: unknown;
  state: 'verified' | 'probable' | 'ambiguous' | 'stale' | 'conflicting' | 'missing';
  source_id: string | null;
  version_id: string | null;
  source_hash: string | null;
  locator: string | null;
  evidence: string | null;
  corroborated_by: { locator: string; source_id: string | null }[] | null;
  resolution: { rule: string; alternatives: { value: unknown; locator: string; state: string }[] } | null;
  extracted_by: string | null;
  check_result: string | null;
  created_at: string;
}
