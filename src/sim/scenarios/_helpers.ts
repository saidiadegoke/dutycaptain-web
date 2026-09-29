import { endpointsApi, simApi, tasksApi } from '@/lib/api';
import type { Delivery, Endpoint, InputRequest, TaskDetail, TaskStatus, TimelineEvent } from '@/lib/types';
import { endpointName, simMark } from '../core/generators';
import type { RunContext } from '../core/types';

/**
 * Pieces every scenario uses. Each calls the SAME function a screen calls —
 * Settings creates endpoints with `endpointsApi.create`, the New task form
 * creates tasks with `tasksApi.create`, the confirm card answers with
 * `tasksApi.confirmInput` — so a sim exercises the screens' own requests.
 */

/** Tight caps on every sim task: real AI, minimum spend (and the budget feature enforces them). */
export const SIM_CAPS = { usd: 0.05, steps: 5 };

const WAITING: TaskStatus[] = ['waiting_for_input', 'waiting_for_approval', 'waiting_for_review', 'waiting_for_budget', 'waiting_for_device', 'paused'];
const FINAL: TaskStatus[] = ['done', 'failed', 'cancelled'];

/** An endpoint pointing at the built-in receiver, as Settings would save it. */
export async function receiverEndpoint(ctx: RunContext, what: string, script: string[], { honours = false } = {}): Promise<Endpoint> {
  const name = endpointName(ctx.token, what);
  const ep = await endpointsApi.create({
    name,
    description: `Simulator receiver ${simMark(ctx.token)} — behaves: ${script.join(' → ')}${honours ? ', honours Idempotency-Key' : ''}`,
    method: 'POST',
    url: ctx.receiverUrl(name, script, { honours }),
    approval: 'auto',
    // The shortest timeout Settings allows: the receiver's "slow" outlasts it.
    timeout_ms: 1000,
    honours_idempotency_key: honours,
  });
  ctx.log(`endpoint ${ep.name} → receiver (${script.join(', ')}${honours ? ', honours keys' : ''})`);
  return ep;
}

/** Create and start a task, as the New task form does. */
export async function startTask(ctx: RunContext, objective: string) {
  const task = await tasksApi.create(`${objective} ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
  ctx.link('Open the task', `/app/tasks/${task.id}`);
  ctx.log(`task ${task.id.slice(0, 8)} created`);
  return task;
}

/** A one-step send, worded so the planner makes exactly that — short, so it costs little. */
export function sendObjective(endpoint: string, payload: Record<string, unknown>) {
  return `Use api.send to send exactly this JSON to the endpoint "${endpoint}": ${JSON.stringify(payload)}. That single send is the whole task.`;
}

export async function waitForStatus(ctx: RunContext, taskId: string, statuses: TaskStatus[], label?: string, timeoutMs = 180_000): Promise<TaskDetail> {
  return ctx.poll(label || `task to be ${statuses.join(' or ')}`, () => tasksApi.get(taskId), (t) => statuses.includes(t.status) || (FINAL.includes(t.status) && !statuses.includes(t.status)), { timeoutMs });
}

/**
 * Wait for the task to finish or wait on something. A task whose contract is
 * waiting for review (phase 1: it acts outside) is approved on the way — the
 * click a person would make — unless the scenario is about that review.
 */
export async function settled(ctx: RunContext, taskId: string, label?: string, { approveContract = true } = {}): Promise<TaskDetail> {
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const t = await waitForStatus(ctx, taskId, [...FINAL, ...WAITING], label);
    const contractWaits = t.status === 'waiting_for_review' && !!t.contract?.review?.required && !t.contract_approved_at && t.steps.length === 0;
    if (!approveContract || !contractWaits) return t;
    ctx.log(`approving the contract, as you would: ${t.contract?.summary || ''}`);
    // eslint-disable-next-line no-await-in-loop
    await tasksApi.approveContract(taskId);
  }
}

export async function deliveriesOf(taskId: string): Promise<Delivery[]> {
  return tasksApi.deliveries(taskId);
}

export async function openConfirm(taskId: string): Promise<InputRequest | undefined> {
  const all = await tasksApi.inputRequests(taskId);
  return all.find((r) => r.kind === 'confirm' && r.status === 'pending');
}

export async function timeline(taskId: string): Promise<TimelineEvent[]> {
  return (await tasksApi.timeline(taskId)).events;
}

export const receiver = (ctx: RunContext, name: string) => simApi.receiver(ctx.runId, name);
