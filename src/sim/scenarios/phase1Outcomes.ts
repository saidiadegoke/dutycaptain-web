import { tasksApi } from '@/lib/api';
import type { Step } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { Check, RunContext, Scenario } from '../core/types';
import { receiver, receiverEndpoint, settled, startTask, waitForStatus } from './_helpers';

/**
 * Phase 1 · honest outcomes (plan §6.1, R1, R2, R9, R10, R29, R30; migration
 * 063): what the task must hand back is agreed first; the status is counted
 * against it; partial is a result, delivered and labelled.
 */

const GROUP = 'Phase 1 · Honest outcomes';

/** A page on the receiver that says exactly what the sim chose. */
function page(ctx: RunContext, name: string, lines: string[], title = 'Market prices') {
  const p = btoa(unescape(encodeURIComponent(JSON.stringify({ title, lines })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${ctx.health.self_url}/sim/receiver/${ctx.runId}/${encodeURIComponent(name)}/page?p=${p}`;
}
const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const extractStep = (steps: Step[]) => steps.find((s) => s.capability === 'text.extract');

export const contractRunsWithoutReview: Scenario = {
  id: 'contract.plain-task-runs',
  group: GROUP,
  title: 'A plain lookup states what it will hand back, and runs without asking',
  summary: 'The task drafts its contract (records: product, price), sees nothing consequential, and runs straight through; the status is counted against the contract.',
  exercises: 'contract.draft → checkAgainstObjective (no review) → plan → outcome.measure',
  cost: ['ai'],
  estimate: '~30s',
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const url = page(ctx, `plain-${ctx.token.toLowerCase()}`, [`${pp.product}: ${naira(pp.price_ngn)} ${simMark(ctx.token)}`]);
    const task = await startTask(ctx, `Use http.request to fetch ${url} , then use text.extract to get the product and its price in naira (fields: product, price_ngn).`);
    const done = await settled(ctx, task.id, 'the task to finish', { approveContract: false });
    return [
      expectEqual('The task finished without stopping for review', 'done', done.status),
      expectTrue('It stated what it would hand back', Boolean(done.contract?.summary) && done.contract?.shape === 'records', 'a records contract', done.contract),
      expectEqual('…and did not need your review', false, done.contract?.review?.required),
      expectEqual('The status was counted: one found', { status: 'done', found: 1 }, { status: done.measured?.status, found: done.measured?.found }),
    ];
  },
};

export const contractConsequentialAsks: Scenario = {
  id: 'contract.consequential-asks',
  group: GROUP,
  title: 'A task that sends something asks you first — "I understand your request as…"',
  summary: 'The task will send a price to an endpoint, so it stops before planning with its contract. The sim approves; it then plans, runs and sends once.',
  exercises: 'contract review (waiting_for_review, reason: contract) → approveContract → plan → api.send',
  cost: ['ai'],
  estimate: '~30s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'after-review', ['ok']);
    const pp = pricePoint(ctx.rng);
    const task = await startTask(ctx, `Use api.send to send exactly this JSON to the endpoint "${ep.name}": ${JSON.stringify(pp)}.`);
    const waiting = await waitForStatus(ctx, task.id, ['waiting_for_review'], 'the task to ask you to check its contract');
    const checks: Check[] = [
      expectEqual('It stops before planning, for you', 'waiting_for_review', waiting.status),
      expectEqual('Nothing is planned yet', 0, waiting.steps.length),
      expectTrue('It says why: it will send', Boolean(waiting.contract?.review?.reasons?.some((r) => /send/.test(r))), 'a reason naming the send', waiting.contract?.review),
      expectEqual('Nothing was sent yet', 0, (await receiver(ctx, ep.name)).requests),
    ];
    if (waiting.status !== 'waiting_for_review') return checks;
    ctx.log('approving the contract');
    await tasksApi.approveContract(task.id);
    const done = await settled(ctx, task.id, 'the task to plan, run and send');
    checks.push(
      expectEqual('Approved, it finished', 'done', done.status),
      expectEqual('…and sent once', 1, (await receiver(ctx, ep.name)).effects),
    );
    return checks;
  },
};

export const optionalFieldEmpty: Scenario = {
  id: 'outcome.optional-field-empty',
  group: GROUP,
  title: 'A price with no city is kept — an optional field never fails the task',
  summary: 'The page gives the price but not the city; the objective asks for the city only if stated. The price is kept and the task is done — the cement price the first NaijaPrices run threw away.',
  exercises: 'contract fields (city optional) → text.extract ground() → outcome.measure',
  cost: ['ai'],
  estimate: '~30s',
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const url = page(ctx, `nocity-${ctx.token.toLowerCase()}`, [`${pp.product} now sells for ${naira(pp.price_ngn)} ${simMark(ctx.token)}.`]);
    const task = await startTask(ctx, `Use http.request to fetch ${url} , then use text.extract to get the product, its price in naira, and the city only if the page states it (fields: product, price_ngn, city — city is optional).`);
    const done = await settled(ctx, task.id, 'the task to finish');
    const data = (extractStep(done.steps)?.observation?.data || {}) as { records?: Record<string, unknown>[]; states?: Record<string, string>[] };
    return [
      expectEqual('The task is done, not failed', 'done', done.status),
      expectEqual('The price was kept', pp.price_ngn, data.records?.[0]?.price_ngn),
      expectEqual('The contract calls city optional', false, done.contract?.fields.find((f) => f.name === 'city')?.required),
      expectTrue('The missing city is marked missing, not guessed', data.records?.[0]?.city === null || data.records?.[0]?.city === undefined, 'city: null', data.records?.[0]?.city),
    ];
  },
};

export const partialLabelledAndDelivered: Scenario = {
  id: 'outcome.partial-delivered',
  group: GROUP,
  title: 'Two of three found: partial, naming the missing one — and delivered, labelled',
  summary: 'The page lists two of the three products asked for. The task ends Partly done with "1 of 3 not found", and its result goes to the endpoint marked partial.',
  exercises: 'contract (all, items) → outcome.judge → completePartial → deliveries (partial) → envelope.outcome',
  cost: ['ai'],
  estimate: '~35s',
  async run(ctx) {
    const [a, b] = [pricePoint(ctx.rng), pricePoint(ctx.rng)];
    const missing = a.product === 'Yam (tuber, medium)' || b.product === 'Yam (tuber, medium)' ? 'Semovita (10kg)' : 'Yam (tuber, medium)';
    const ep = await receiverEndpoint(ctx, 'results', ['ok']);
    const url = page(ctx, `two-of-three-${ctx.token.toLowerCase()}`, [`${a.product}: ${naira(a.price_ngn)}`, `${b.product}: ${naira(b.price_ngn)}`, `Updated ${simMark(ctx.token)}`]);
    const task = await tasksApi.create(
      `Find the price in naira of each of these products: ${a.product}; ${b.product}; ${missing}. Use http.request to fetch ${url} , then text.extract (fields: product, price_ngn). ${simMark(ctx.token)}`,
      { budget: { caps: { usd: 0.05, steps: 5 } }, deliver_to: { endpoint_id: ep.id, when: 'done' } },
    );
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const done = await settled(ctx, task.id, 'the task to finish');
    // The delivery is sent as the task finishes; give it a moment.
    const rcv = await ctx.poll('the result to be delivered', () => receiver(ctx, ep.name), (r) => r.requests > 0, { timeoutMs: 20_000 }).catch(() => null);
    const body = (rcv?.hits[0]?.body || {}) as { event?: string; outcome?: { status?: string; missing?: string[] } };
    return [
      expectEqual('The task is Partly done, not done or failed', 'partial', done.status),
      expectEqual('Counted: 2 of 3', { found: 2, expected: 3 }, { found: done.measured?.found, expected: done.measured?.expected }),
      expectTrue('It names the one not found', Boolean(done.measured?.missing?.some((m) => m.toLowerCase().includes(missing.toLowerCase().split(' ')[0]))), missing, done.measured?.missing),
      rcv ? expectEqual('Delivered, labelled partial', ['task.partial', 'partial'], [body.event, body.outcome?.status]) : fail('Delivered to the endpoint', 'one delivery', 'none'),
    ];
  },
};

export const staleRejected: Scenario = {
  id: 'outcome.stale-rejected',
  group: GROUP,
  title: 'A price older than the task allows is not delivered as current',
  summary: 'The task wants today\'s price; the page\'s price is weeks old. The old value is marked stale and not counted, so the task does not claim it found a current price.',
  exercises: 'contract.freshness → text.extract isStale → dropped → outcome (not done)',
  cost: ['ai'],
  estimate: '~30s',
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const old = new Date(ctx.serverTime.getTime() - 40 * 86400000).toISOString().slice(0, 10);
    const url = page(ctx, `stale-${ctx.token.toLowerCase()}`, [`Price list dated ${old} ${simMark(ctx.token)}`, `${pp.product}: ${naira(pp.price_ngn)} as of ${old}`]);
    const task = await startTask(ctx, `Find today's price of ${pp.product} — no older than 1 day. Use http.request to fetch ${url} , then text.extract (fields: product, price_ngn, as_of as a date).`);
    const done = await settled(ctx, task.id, 'the task to finish');
    const data = (extractStep(done.steps)?.observation?.data || {}) as { dropped?: { reasons?: string[] }[] };
    return [
      expectTrue('It does not claim a current price', done.status !== 'done', 'partial or failed', done.status),
      expectEqual('The contract says how old a value may be', 1, done.contract?.freshness?.max_age_days),
      expectTrue('The old price was set aside as too old', JSON.stringify(data.dropped || []).includes('older than'), 'a dropped item: older than 1 day', data.dropped),
    ];
  },
};

export const OUTCOME_SCENARIOS = [contractRunsWithoutReview, contractConsequentialAsks, optionalFieldEmpty, partialLabelledAndDelivered, staleRejected];
