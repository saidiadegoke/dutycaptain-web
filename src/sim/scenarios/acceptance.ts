import { approvalsApi, simApi, tasksApi } from '@/lib/api';
import { fail, pass } from '../core/checks';
import { simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { settled } from './_helpers';

/**
 * The acceptance set (reading & extraction plan §8): the twelve tasks of §3,
 * each with fixed inputs, the contract it should produce, and the outcome that
 * counts as correct — defined once, in the API (src/modules/sim/acceptance.js),
 * which also judges each run. The run is the real product with real AI.
 *
 * T11 and T12 need phases 7–8 and are skipped with the reason. Each task's
 * adversarial variants are the sims named in its summary.
 */

const GROUP = 'Acceptance · the twelve tasks';

const TASKS: { id: string; title: string; skills?: boolean; needs?: string; variants: string[] }[] = [
  { id: 'T1', title: 'Current prices for a list of products', variants: ['outcome.optional-field-empty', 'outcome.partial-delivered', 'extraction.merge-corroborated'] },
  { id: 'T2', title: 'One authoritative figure', variants: ['outcome.stale-rejected', 'extraction.conflict-authoritative'] },
  { id: 'T3', title: 'Unpaid invoices, totalled by customer', variants: ['adversarial.malformed-file', 'gaps.partial-to-owner'] },
  { id: 'T4', title: 'Reconcile a bank statement', skills: true, variants: ['skills.reconcile'] },
  { id: 'T5', title: 'A briefing from long reports', variants: ['skills.summarize'] },
  { id: 'T6', title: 'Contracts renewing next quarter', variants: ['outcome.partial-delivered'] },
  { id: 'T7', title: 'Every line item from a tender', variants: ['content.deep-listing', 'budget.web-request-cap'] },
  { id: 'T8', title: 'Current job vacancies', variants: ['extraction.merge-corroborated', 'outcome.stale-rejected'] },
  { id: 'T9', title: 'Supplier figures into an existing workbook', skills: true, variants: ['outcome.partial-delivered'] },
  { id: 'T10', title: 'Expense receipts from photos', skills: true, variants: ['images.clear-receipt', 'images.poor-photo'] },
  { id: 'T11', title: 'What is trending, into NaijaReels', needs: 'phase 7 (watches, connections) and phase 8 (the NaijaReels auto-publish rule); the pool half is people.pool-partner', variants: ['people.pool-partner'] },
  { id: 'T12', title: 'A marketing assistant for a business', needs: 'phase 7 (connections, brand memory, event triggers) and phase 8 (social.post and replies)', variants: [] },
];

function scenario(t: (typeof TASKS)[number]): Scenario {
  return {
    id: `acceptance.${t.id.toLowerCase()}`,
    group: GROUP,
    title: `${t.id} — ${t.title}`,
    summary: `The plan's ${t.id} on fixed inputs, judged against the contract it should produce and the outcome that counts as correct.${t.variants.length ? ` Its failure variants: ${t.variants.join(', ')}.` : ''}`,
    exercises: 'fixed inputs → the real task (contract, plan, steps) → judged in code (sim/acceptance.js)',
    cost: ['ai', 'slow'],
    estimate: '~2 min',
    skipIf: (ctx: RunContext) => (t.needs ? `needs ${t.needs}` : t.skills && !ctx.health.skills?.available ? 'the skills sandbox is not available here' : undefined),
    async run(ctx) {
      const prep = await simApi.acceptancePrepare(t.id);
      const task = await tasksApi.create(`${prep.objective} ${simMark(ctx.token)}`, { start: false, budget: { caps: { usd: 0.15, steps: 10 } } });
      ctx.link('Open the task', `/app/tasks/${task.id}`);
      for (const f of prep.files) {
        const bin = atob(f.base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        // eslint-disable-next-line no-await-in-loop
        await tasksApi.addAttachment(task.id, new File([bytes], f.name, { type: f.mime }));
      }
      await tasksApi.start(task.id);
      // Approve what the task asks to do, as its owner would (a workbook to
      // write, a file to make) — the acceptance set judges the outcome, not the asking.
      let done = await settled(ctx, task.id, 'the task to finish');
      for (let i = 0; i < 5 && done.status === 'waiting_for_approval'; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const pending = (await approvalsApi.list()).filter((a) => a.task_id === task.id && a.status === 'pending');
        for (const a of pending) {
          ctx.log(`approving, as you would: ${a.summary}`);
          // eslint-disable-next-line no-await-in-loop
          await approvalsApi.decide(a.id, { granted: true, scope: 'once' });
        }
        // eslint-disable-next-line no-await-in-loop
        done = await settled(ctx, task.id, 'the task to finish');
      }
      ctx.log(`${t.id} finished ${done.status}`);
      const judged = await simApi.acceptanceEvaluate(t.id, task.id);
      return judged.checks.map((c) => (c.status === 'pass' ? pass(c.name, c.detail) : fail(c.name, 'as the acceptance set expects', c.detail)));
    },
  };
}

export const ACCEPTANCE_SCENARIOS: Scenario[] = TASKS.map(scenario);
