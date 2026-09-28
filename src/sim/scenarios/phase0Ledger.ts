import { tasksApi } from '@/lib/api';
import { expectEqual, expectTrue, pass, fail } from '../core/checks';
import { pricePoint } from '../core/generators';
import type { Check, Scenario } from '../core/types';
import {
  deliveriesOf, openConfirm, receiver, receiverEndpoint, sendObjective, settled, startTask, waitForStatus,
} from './_helpers';

/**
 * Phase 0 · the action ledger (plan §6.18; migration 058): a result reaches
 * an endpoint once, however often the step runs, and an unknown outcome is
 * settled — by a safe repeat or by a person — never by sending again blind.
 *
 * Each runs a real task (real planner, real queue, real sender) against the
 * built-in receiver, which plays the endpoint and counts EFFECTS.
 */

const GROUP = 'Phase 0 · Action ledger';

export const sendOnce: Scenario = {
  id: 'ledger.send-once',
  group: GROUP,
  title: 'A send arrives once, with an Idempotency-Key',
  summary: 'A task sends a price to an endpoint; it arrives exactly once and the delivery records the key it carried.',
  exercises: 'POST /tasks → planner → api.send → deliveries.sendFromStep → sender',
  cost: ['ai'],
  estimate: '~20s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'orders', ['ok']);
    const payload = pricePoint(ctx.rng);
    const task = await startTask(ctx, sendObjective(ep.name, payload));
    const done = await settled(ctx, task.id, 'the task to finish');
    const [d] = await deliveriesOf(task.id);
    const rcv = await receiver(ctx, ep.name);
    const checks: Check[] = [
      expectEqual('The task finished', 'done', done.status),
      expectEqual('One delivery, sent', ['sent'], (await deliveriesOf(task.id)).map((x) => x.status)),
      expectEqual('It arrived exactly once (receiver effects)', 1, rcv.effects),
      expectTrue('The receiver got the price that was asked for', JSON.stringify(rcv.hits[0]?.body || {}).includes(String(payload.price_ngn)), payload, rcv.hits[0]?.body),
      expectTrue('It carried an Idempotency-Key, and the delivery records it',
        Boolean(d?.idempotency_key) && rcv.hits[0]?.idempotency_key === d?.idempotency_key, d?.idempotency_key, rcv.hits[0]?.idempotency_key),
      expectEqual('Settled by the endpoint\'s answer', 'response', d?.settled_by),
    ];
    return checks;
  },
};

export const definiteFailure: Scenario = {
  id: 'ledger.definite-failure',
  group: GROUP,
  title: 'A refused send is sent again, with a new key',
  summary: 'The endpoint answers 500 once, then accepts: the step retries, and the result arrives once.',
  exercises: 'api.send → recovery retry → deliveries (failed → resend on the same row)',
  cost: ['ai'],
  estimate: '~25s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'ledger', ['fail', 'ok']);
    const task = await startTask(ctx, sendObjective(ep.name, pricePoint(ctx.rng)));
    const done = await settled(ctx, task.id, 'the task to finish');
    const ds = await deliveriesOf(task.id);
    const rcv = await receiver(ctx, ep.name);
    const [k1, k2] = rcv.hits.map((h) => h.idempotency_key);
    return [
      expectEqual('The task finished', 'done', done.status),
      expectEqual('One delivery row, sent after two attempts', [['sent', 2]], ds.map((d) => [d.status, d.attempts])),
      expectEqual('Two requests, one effect', { requests: 2, effects: 1 }, { requests: rcv.requests, effects: rcv.effects }),
      expectTrue('The retry carried a new key (the first definitely did not arrive)', Boolean(k1 && k2 && k1 !== k2), 'two different keys', [k1, k2]),
    ];
  },
};

export const unknownPersonYes: Scenario = {
  id: 'ledger.unknown-person-yes',
  group: GROUP,
  title: 'A timed-out send: you confirm it arrived',
  summary: 'The endpoint acts but answers too late. The task asks "Did it arrive?"; the sim answers Yes, and nothing is sent again.',
  exercises: 'sender (reached: unknown) → askPerson → confirm request → desk.confirm → step reuses the send',
  cost: ['ai'],
  estimate: '~25s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'slow', ['slow']);
    const task = await startTask(ctx, sendObjective(ep.name, pricePoint(ctx.rng)));
    const waiting = await settled(ctx, task.id, 'the task to ask whether it arrived');
    const ask = await openConfirm(task.id);
    const before = await receiver(ctx, ep.name);
    const checks: Check[] = [
      expectEqual('The task waits for a person', 'waiting_for_input', waiting.status),
      ask ? pass('A "Did it arrive?" request is open', ask.instructions) : fail('A "Did it arrive?" request is open', 'a confirm request', 'none'),
      expectEqual('The delivery is being checked, not re-sent', 'checking', (await deliveriesOf(task.id))[0]?.status),
      expectEqual('One request so far (it acted on it)', { requests: 1, effects: 1 }, { requests: before.requests, effects: before.effects }),
    ];
    if (!ask) return checks;
    ctx.log('answering: yes, it arrived');
    await tasksApi.confirmInput(task.id, ask.id, { happened: true, reference: `sim ${ctx.token}` });
    const done = await waitForStatus(ctx, task.id, ['done'], 'the task to finish');
    const after = await receiver(ctx, ep.name);
    const [d] = await deliveriesOf(task.id);
    checks.push(
      expectEqual('The task finished', 'done', done.status),
      expectEqual('Still one request: nothing was sent again', 1, after.requests),
      expectEqual('Settled by you', ['sent', 'person'], [d?.status, d?.settled_by]),
    );
    return checks;
  },
};

export const unknownPersonNo: Scenario = {
  id: 'ledger.unknown-person-no',
  group: GROUP,
  title: 'A dropped send: you say it didn\'t arrive, so it is sent again',
  summary: 'The connection drops before the endpoint acts. The sim answers No; the send goes again and arrives once.',
  exercises: 'sender (unknown) → confirm request → desk.confirm(false) → deliveries.settleByPerson → resend',
  cost: ['ai'],
  estimate: '~25s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'drop', ['down', 'ok']);
    const task = await startTask(ctx, sendObjective(ep.name, pricePoint(ctx.rng)));
    await settled(ctx, task.id, 'the task to ask whether it arrived');
    const ask = await openConfirm(task.id);
    if (!ask) return [fail('A "Did it arrive?" request is open', 'a confirm request', 'none')];
    const before = await receiver(ctx, ep.name);
    ctx.log('answering: no, it did not arrive');
    await tasksApi.confirmInput(task.id, ask.id, { happened: false });
    const done = await waitForStatus(ctx, task.id, ['done'], 'the task to finish');
    const after = await receiver(ctx, ep.name);
    return [
      expectEqual('Before the answer: one request, no effect', { requests: 1, effects: 0 }, { requests: before.requests, effects: before.effects }),
      expectEqual('The task finished', 'done', done.status),
      expectEqual('After it: sent again, and it arrived once', { requests: 2, effects: 1 }, { requests: after.requests, effects: after.effects }),
    ];
  },
};

export const honoursRepeat: Scenario = {
  id: 'ledger.honours-repeat',
  group: GROUP,
  title: 'An endpoint that honours keys is asked again, safely',
  summary: 'The send times out; the endpoint is marked as honouring Idempotency-Key, so DutyCaptain repeats it with the same key. The endpoint sees a duplicate, not a second order.',
  exercises: 'deliveries.settleUnknown (repeat with sent_key) → endpoint.honours_idempotency_key',
  cost: ['ai', 'slow'],
  estimate: '~30s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'idem', ['slow'], { honours: true });
    const task = await startTask(ctx, sendObjective(ep.name, pricePoint(ctx.rng)));
    const done = await settled(ctx, task.id, 'the task to finish');
    const rcv = await receiver(ctx, ep.name);
    const [d] = await deliveriesOf(task.id);
    return [
      expectEqual('The task finished without asking anyone', 'done', done.status),
      expectEqual('Settled by the repeat', ['sent', 'repeat'], [d?.status, d?.settled_by]),
      expectEqual('Two requests, one effect, one duplicate', { requests: 2, effects: 1, duplicates: 1 }, { requests: rcv.requests, effects: rcv.effects, duplicates: rcv.duplicates }),
      expectTrue('Both carried the same key', rcv.hits.length === 2 && rcv.hits[0].idempotency_key === rcv.hits[1].idempotency_key, 'one key', rcv.hits.map((h) => h.idempotency_key)),
    ];
  },
};

export const honoursUnreachable: Scenario = {
  id: 'ledger.honours-unreachable',
  group: GROUP,
  title: 'An endpoint that stays unreachable goes to a person',
  summary: 'Even an endpoint that honours keys is only asked a few times; while it stays unreachable, the task asks you rather than keep trying or give up blind.',
  exercises: 'deliveries.settleUnknown (repeats exhausted) → askPerson',
  cost: ['ai', 'slow'],
  estimate: '~70s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'gone', ['down'], { honours: true });
    const task = await startTask(ctx, sendObjective(ep.name, pricePoint(ctx.rng)));
    const waiting = await settled(ctx, task.id, 'the task to ask a person (after the repeats)');
    const ask = await openConfirm(task.id);
    const rcv = await receiver(ctx, ep.name);
    const checks = [
      expectEqual('The task waits for a person', 'waiting_for_input', waiting.status),
      expectTrue('A "Did it arrive?" request is open', Boolean(ask), 'a confirm request', ask ? 'open' : 'none'),
      expectTrue('It was asked again with the same key before asking you', rcv.requests >= 2 && new Set(rcv.hits.map((h) => h.idempotency_key)).size === 1, '≥2 requests, one key', rcv.hits.map((h) => h.idempotency_key)),
      expectEqual('Nothing arrived', 0, rcv.effects),
    ];
    ctx.log('cancelling the task (nothing to deliver to)');
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const LEDGER_SCENARIOS = [sendOnce, definiteFailure, unknownPersonYes, unknownPersonNo, honoursRepeat, honoursUnreachable];
