import { expectEqual, expectTrue, pass, warn } from '../core/checks';
import type { Scenario } from '../core/types';
import { LEDGER_SCENARIOS } from './phase0Ledger';
import { DURABLE_SCENARIOS } from './phase0Durable';
import { PROVENANCE_SCENARIOS } from './phase0Provenance';
import { TRUST_SCENARIOS } from './phase0Trust';
import { BUDGET_SCENARIOS } from './phase0Budget';
import { OUTCOME_SCENARIOS } from './phase1Outcomes';
import { CONTENT_SCENARIOS } from './phase2Content';
import { EXTRACTION_SCENARIOS } from './phase3Extraction';
import { SKILL_SCENARIOS } from './phase4Skills';
import { IMAGE_SCENARIOS } from './phase5Images';
import { PEOPLE_SCENARIOS } from './phase6People';

/**
 * Every sim, in order. THE RULE: a feature ships with its sim — add it here in
 * the same change (docs/DUTYCAPTAIN_UI_SIMULATION.md). Grouped by plan phase.
 */

const environment: Scenario = {
  id: 'sim.environment',
  group: 'Environment',
  title: 'The simulator can run here',
  summary: 'Sims are on, tasks run on the queue, and the AI is configured — what every other sim relies on.',
  exercises: 'GET /sim/health',
  cost: ['free'],
  estimate: '~1s',
  async run(ctx) {
    const h = ctx.health;
    return [
      expectEqual('Simulations are switched on', true, h.enabled),
      h.queue === 'bullmq' ? pass('Tasks run on the queue (BullMQ)') : warn('Tasks run on the queue (BullMQ)', 'in-process: fine for one process, but a restart interrupts running tasks'),
      expectTrue('The AI is configured', Boolean(h.ai && (h.ai.model || h.ai.provider)), 'a provider and model', h.ai),
    ];
  },
};

export const SCENARIOS: Scenario[] = [environment, ...LEDGER_SCENARIOS, ...DURABLE_SCENARIOS, ...PROVENANCE_SCENARIOS, ...TRUST_SCENARIOS, ...BUDGET_SCENARIOS, ...OUTCOME_SCENARIOS, ...CONTENT_SCENARIOS, ...EXTRACTION_SCENARIOS, ...SKILL_SCENARIOS, ...IMAGE_SCENARIOS, ...PEOPLE_SCENARIOS];
export const GROUPS = Array.from(new Set(SCENARIOS.map((s) => s.group)));
