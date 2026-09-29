import { tasksApi } from '@/lib/api';
import { expectEqual, expectTrue } from '../core/checks';
import { simMark } from '../core/generators';
import type { Scenario } from '../core/types';
import { receiver, settled, timeline } from './_helpers';

/**
 * Phase 0 · budgets (plan §6.9, R31; migration 062): every AI call, web
 * request and action outside is counted, and a cap on any of them stops the
 * task — it waits for you, it doesn't burn on or fail.
 */

const GROUP = 'Phase 0 · Budgets';

export const modelCallCap: Scenario = {
  id: 'budget.model-call-cap',
  group: GROUP,
  title: 'A cap on AI calls stops the task after its first call',
  summary: 'A task allowed one AI call makes it (drafting what it must hand back), then waits for you instead of making another.',
  exercises: 'budget.check (modelCalls) → waiting_for_budget',
  cost: ['ai'],
  estimate: '~10s',
  async run(ctx) {
    const task = await tasksApi.create(`Write the word "hello" to notes/hello.txt with workspace.write. ${simMark(ctx.token)}`, { budget: { caps: { usd: 0.05, modelCalls: 1 } } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const stopped = await settled(ctx, task.id, 'the task to reach its cap');
    const ev = (await timeline(task.id)).find((e) => e.type === 'budget.exceeded');
    const checks = [
      expectEqual('The task waits for more budget', 'waiting_for_budget', stopped.status),
      expectEqual('It made exactly one AI call', 1, stopped.budget.used.calls),
      expectTrue('The reason is the AI-call cap', Boolean(ev && JSON.stringify(ev.payload).includes('modelCalls')), 'modelCalls breached', ev?.payload),
    ];
    ctx.log('cancelling the task');
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const webRequestCap: Scenario = {
  id: 'budget.web-request-cap',
  group: GROUP,
  title: 'A cap on web requests stops the task before the next fetch',
  summary: 'A task allowed one web request fetches the first page, then waits for you instead of fetching the second.',
  exercises: 'http.request → budget.count (webRequests) → budget.check → waiting_for_budget',
  cost: ['ai'],
  estimate: '~20s',
  async run(ctx) {
    const page = (n: number) => `${ctx.health.self_url}/sim/receiver/${ctx.runId}/web-${ctx.token.toLowerCase()}-${n}/page`;
    const task = await tasksApi.create(
      `Use http.request to fetch ${page(1)} . After that step has finished, use http.request to fetch ${page(2)} . Two steps, the second depending on the first. ${simMark(ctx.token)}`,
      { budget: { caps: { usd: 0.05, webRequests: 1 } } },
    );
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const stopped = await settled(ctx, task.id, 'the task to reach its cap');
    const checks = [
      expectEqual('The task waits for more budget', 'waiting_for_budget', stopped.status),
      expectEqual('One web request was made', 1, stopped.budget.used.webRequests),
      expectEqual('The first page was fetched', 1, (await receiver(ctx, `web-${ctx.token.toLowerCase()}-1`)).requests),
      expectEqual('The second was not', 0, (await receiver(ctx, `web-${ctx.token.toLowerCase()}-2`)).requests),
    ];
    ctx.log('cancelling the task');
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const BUDGET_SCENARIOS = [modelCallCap, webRequestCap];
