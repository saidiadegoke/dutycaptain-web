import { simApi, tasksApi } from '@/lib/api';
import { expectEqual, expectTrue, fail, pass } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { Check, RunContext, Scenario } from '../core/types';
import {
  openConfirm, receiver, receiverEndpoint, sendObjective, settled, startTask, timeline, waitForStatus,
} from './_helpers';

/**
 * Phase 0 · durable runs (plan §6.17; migration 058): a task survives the
 * server stopping mid-step, and what the dead process left is settled by what
 * running it twice would do.
 *
 * A browser can't kill the server, so the fixture builds exactly the state a
 * dead process leaves — task running, a step `running`, nothing driving it —
 * and hands it to the real runner, the same call start-up makes. Everything
 * after that (recovery, the ledger, the scheduler, the real AI for the
 * conclusion) is the feature itself.
 */

const GROUP = 'Phase 0 · Durable runs';

async function interrupted(ctx: RunContext, input: Parameters<typeof simApi.interruptedTask>[0]) {
  const made = await simApi.interruptedTask({ ...input, objective: `${input.objective} ${simMark(ctx.token)}` });
  ctx.link('Open the task', `/app/tasks/${made.task_id}`);
  ctx.log(`task ${made.task_id.slice(0, 8)} left mid-step, as a stopped server leaves it`);
  return made;
}

const recoveredEvent = async (taskId: string) => (await timeline(taskId)).find((e) => e.type === 'task.recovered');

export const internalStepReruns: Scenario = {
  id: 'durable.internal-step-reruns',
  group: GROUP,
  title: 'A step that only writes the task\'s own files runs again',
  summary: 'The server stops while a step is saving a note. On restart the step runs again — harmless — and the task finishes.',
  exercises: 'runner.runNow → effects.recoverOrphans (effect: internal) → scheduler',
  cost: ['ai'],
  estimate: '~15s',
  async run(ctx) {
    const made = await interrupted(ctx, {
      capability: 'workspace.write', objective: 'Save a short note to the workspace.', title: 'Save the note',
      args: { path: `notes/sim-${ctx.token.toLowerCase()}.txt`, content: `Checked prices ${simMark(ctx.token)}` },
    });
    const done = await settled(ctx, made.task_id, 'the task to recover and finish');
    const ev = await recoveredEvent(made.task_id);
    const step = done.steps.find((s) => s.id === made.step_id);
    return [
      ev ? expectEqual('Recovery ran the cut-off step again', ['the_step'], ev.payload.reset) : fail('Recovery was recorded on the timeline', 'task.recovered', 'none'),
      expectEqual('The step finished on the rerun', 'done', step?.status),
      expectEqual('The task finished', 'done', done.status),
      expectEqual('One interruption counted', 1, done.interruptions),
    ];
  },
};

export const sendCutOff: Scenario = {
  id: 'durable.send-cut-off',
  group: GROUP,
  title: 'A send cut off mid-request is confirmed, not repeated blind',
  summary: 'The server stops while a step is sending. On restart nobody knows if it arrived, so you\'re asked; the sim says No and it is sent once.',
  exercises: 'effects.recoverOrphans → api.send settled() → settleUnknown → confirm → resend',
  cost: ['ai'],
  estimate: '~20s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'cutoff', ['ok']);
    const made = await interrupted(ctx, {
      capability: 'api.send', objective: `Send the price to ${ep.name}.`, title: `Send the price to ${ep.name}`,
      args: { endpoint: ep.name, body_json: JSON.stringify(pricePoint(ctx.rng)) }, mid_send: true,
    });
    const waiting = await settled(ctx, made.task_id, 'the task to ask whether the send arrived');
    const ask = await openConfirm(made.task_id);
    const checks: Check[] = [
      expectEqual('The task waits for a person instead of re-sending', 'waiting_for_input', waiting.status),
      ask ? pass('A "Did it arrive?" request is open') : fail('A "Did it arrive?" request is open', 'a confirm request', 'none'),
      expectEqual('Nothing was sent on restart', 0, (await receiver(ctx, ep.name)).requests),
    ];
    if (!ask) return checks;
    ctx.log('answering: no, it did not arrive');
    await tasksApi.confirmInput(made.task_id, ask.id, { happened: false });
    const done = await waitForStatus(ctx, made.task_id, ['done'], 'the task to finish');
    const rcv = await receiver(ctx, ep.name);
    checks.push(
      expectEqual('The task finished', 'done', done.status),
      expectEqual('Sent once, arrived once', { requests: 1, effects: 1 }, { requests: rcv.requests, effects: rcv.effects }),
    );
    return checks;
  },
};

export const clickCutOff: Scenario = {
  id: 'durable.click-cut-off',
  group: GROUP,
  title: 'A click on another system cut off: you confirm it happened',
  summary: 'The server stops while a step is clicking on a website. It can\'t be checked, so you\'re asked; the sim says Yes and the task carries on without clicking again.',
  exercises: 'effects.recoverOrphans (effect: external, no ledger) → confirm (subject: step) → step done on your word',
  cost: ['ai'],
  estimate: '~15s',
  async run(ctx) {
    const made = await interrupted(ctx, {
      capability: 'browser.click', objective: 'Submit the supplier order form.', title: 'Click "Submit order"', args: { selector: '#submit-order' },
    });
    const waiting = await settled(ctx, made.task_id, 'the task to ask whether the click happened');
    const ask = await openConfirm(made.task_id);
    const checks: Check[] = [
      expectEqual('The task waits for a person', 'waiting_for_input', waiting.status),
      expectTrue('It asks about the step, not a send', ask?.subject?.type === 'step', 'subject: step', ask?.subject),
    ];
    if (!ask) return checks;
    ctx.log('answering: yes, it happened');
    await tasksApi.confirmInput(made.task_id, ask.id, { happened: true, reference: `order ${ctx.token}` });
    const done = await settled(ctx, made.task_id, 'the task to finish');
    const step = done.steps.find((s) => s.id === made.step_id);
    checks.push(
      expectEqual('The step is done on your word, not clicked again', 'done', step?.status),
      expectEqual('The task finished', 'done', done.status),
    );
    return checks;
  },
};

export const interruptionLimit: Scenario = {
  id: 'durable.interruption-limit',
  group: GROUP,
  title: 'A task the server keeps dying on stops, with the reason',
  summary: 'A task already cut off three times is cut off again: it fails saying so, instead of looping.',
  exercises: 'runner.runNow (TASK_MAX_INTERRUPTIONS)',
  cost: ['free'],
  estimate: '~5s',
  async run(ctx) {
    const made = await interrupted(ctx, {
      capability: 'workspace.write', objective: 'Save a note.', args: { path: 'notes/x.txt', content: 'x' }, interruptions: 3,
    });
    const done = await settled(ctx, made.task_id, 'the task to stop');
    return [
      expectEqual('The task failed', 'failed', done.status),
      expectEqual('Because the server kept stopping', 'TASK_INTERRUPTED', done.error?.code),
      expectEqual('Four interruptions counted', 4, done.interruptions),
    ];
  },
};

export const cancelRecordsSends: Scenario = {
  id: 'durable.cancel-records-sends',
  group: GROUP,
  title: 'Cancelling records what was already sent',
  summary: 'A task sends a price, then waits for you. The sim cancels it; the cancellation lists the send that already happened.',
  exercises: 'orchestrator.cancel → effects.sideEffectsOf → deliveries.effectsOf',
  cost: ['ai'],
  estimate: '~25s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'before-cancel', ['ok']);
    const payload = pricePoint(ctx.rng);
    const task = await startTask(ctx, `${sendObjective(ep.name, payload).replace(' That single send is the whole task.', '')} After that, use human.collect to ask me for the supplier's name (one field, "supplier").`);
    const waiting = await settled(ctx, task.id, 'the task to send and then wait for you');
    const checks: Check[] = [expectEqual('It sent, then waited for you', 'waiting_for_input', waiting.status)];
    ctx.log('cancelling');
    await tasksApi.control(task.id, 'cancel');
    const ev = (await timeline(task.id)).find((e) => e.type === 'task.cancelled');
    const effects = (ev?.payload?.side_effects || []) as { what: string; status: string; reversible: boolean }[];
    checks.push(
      expectTrue('The cancellation lists the send', effects.some((e) => e.what === `sent to ${ep.name}` && e.status === 'happened'), `sent to ${ep.name}`, effects),
      expectTrue('…and says it can\'t be undone', effects.every((e) => e.reversible === false), 'reversible: false', effects),
      expectEqual('The endpoint got it once', 1, (await receiver(ctx, ep.name)).effects),
    );
    return checks;
  },
};

export const DURABLE_SCENARIOS = [internalStepReruns, sendCutOff, clickCutOff, interruptionLimit, cancelRecordsSends];
