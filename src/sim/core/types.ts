/**
 * The UI simulator's types (docs/DUTYCAPTAIN_UI_SIMULATION.md).
 *
 * A scenario is one feature, run for real: it drives the same API functions
 * the screens call (src/lib/api.ts), with content it generates, and checks what
 * happened through the same reads the screens use. Nothing is mocked; the only
 * extra piece is the built-in receiver, which plays the other system a send
 * goes to.
 */

import type { SimExchange, SimHealth } from '@/lib/api';
import type { Rng } from './rng';

/** What a scenario costs, shown on its card. */
export type Cost = 'free' | 'ai' | 'slow';
export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip';
export type Outcome = 'PASS' | 'FAIL' | 'WARN' | 'SKIPPED' | 'ERROR';

export interface Check {
  name: string;
  status: CheckStatus;
  expected?: unknown;
  actual?: unknown;
  note?: string;
}

export interface SimLink {
  label: string;
  href: string;
}

export interface RunContext {
  runId: string;
  seed: number;
  /** Unique per scenario execution, e.g. "K3F9"; every generated name carries [SIM-<token>]. */
  token: string;
  rng: Rng;
  health: SimHealth;
  serverTime: Date;
  /** A line in the scenario's live log. */
  log(line: string): void;
  /** A link shown with the result — e.g. the task, on the real task page. */
  link(label: string, href: string): void;
  /** Wait for something the feature does in the background. */
  poll<T>(label: string, read: () => Promise<T>, until: (value: T) => boolean, options?: { timeoutMs?: number; everyMs?: number }): Promise<T>;
  /** A URL on the built-in receiver that behaves as `script` says, request by request. */
  receiverUrl(name: string, script: string[], options?: { honours?: boolean }): string;
}

export interface Scenario {
  id: string;
  /** The plan phase and feature area, e.g. "Phase 0 · Action ledger". */
  group: string;
  title: string;
  /** What the user would see, in a sentence. */
  summary: string;
  /** The real code this exercises, e.g. "api.send → deliveries.sendFromStep". */
  exercises: string;
  cost: Cost[];
  /** Roughly how long it takes. */
  estimate: string;
  skipIf?(ctx: RunContext): string | undefined;
  run(ctx: RunContext): Promise<Check[]>;
}

export interface ScenarioResult {
  scenarioId: string;
  title: string;
  outcome: Outcome;
  token: string;
  checks: Check[];
  exchanges: SimExchange[];
  log: string[];
  links: SimLink[];
  startedAt: string;
  durationMs: number;
  error?: string;
}
