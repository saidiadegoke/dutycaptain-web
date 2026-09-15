export type JobStatus =
'running' |
'awaiting_approval' |
'completed' |
'failed' |
'queued' |
'paused';

export type TaskStatus = 'done' | 'running' | 'queued' | 'failed' | 'blocked';

export type AgentKind = 'planner' | 'browser' | 'vision' | 'search' | 'file' | 'api' | 'human';

export interface Job {
  id: string;
  name: string;
  goal: string;
  status: JobStatus;
  done: number;
  total: number;
  workers: number;
  startedAt: string;
  elapsed: string;
  eta: string;
  owner: string;
  trigger: 'manual' | 'schedule' | 'api';
  connector: string;
}

export interface TaskNode {
  id: string;
  label: string;
  agent: AgentKind;
  status: TaskStatus;
  detail: string;
  parallelism: number;
  retries: number;
}

export interface WorkflowStage {
  id: string;
  nodes: TaskNode[];
}

export interface TaskRun {
  id: string;
  node: string;
  agent: AgentKind;
  target: string;
  status: TaskStatus;
  model: string;
  duration: string;
  attempt: number;
}

export interface Worker {
  id: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  status: 'busy' | 'idle' | 'retrying' | 'error';
  sku: string;
  retailer: string;
  step: string;
}

export interface ApprovalChange {
  sku: string;
  product: string;
  current: number;
  proposed: number;
  source: string;
  confidence: number;
  flag?: 'outlier' | 'stale' | 'new';
}

export interface Approval {
  id: string;
  jobId: string;
  jobName: string;
  action: string;
  target: string;
  changes: number;
  risk: 'high' | 'medium' | 'low';
  requestedAt: string;
  requestedBy: AgentKind;
  summary: string;
  sample: ApprovalChange[];
}

export interface Artifact {
  id: string;
  name: string;
  kind: 'excel' | 'csv' | 'json' | 'pdf' | 'image';
  jobName: string;
  size: string;
  rows: number;
  createdAt: string;
}

export interface ModelService {
  id: string;
  name: string;
  role: string;
  gpu: string;
  vram: string;
  vramPct: number;
  status: 'loaded' | 'standby' | 'unloaded';
  latency: string;
  queue: number;
  phase: 1 | 2 | 3 | 4;
}

export interface AuditEntry {
  id: string;
  at: string;
  agent: AgentKind;
  model: string;
  action: string;
  target: string;
  outcome: 'ok' | 'retry' | 'blocked' | 'failed';
  tokens: number;
  jobId: string;
}