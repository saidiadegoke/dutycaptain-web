import { answerApi, peopleApi, simApi, tasksApi } from '@/lib/api';
import type { InputRequest, Step, TaskDetail } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { SIM_CAPS, receiver, receiverEndpoint, settled } from './_helpers';

/**
 * Phase 6 · people beyond the owner (plan §6.13, R25; migrations 068–069).
 * Colleagues answer through a private link (a sim never emails anyone: it
 * reads the link back and answers as the colleague would); a pool's partner
 * endpoint is the built-in receiver, and the sim answers for its scouts
 * through the reply link the partner was given. Deadlines are passed on
 * demand. Everything else is the real feature.
 */

const GROUP = 'Phase 6 · People';
const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const FIELDS = '(fields: product, a string; price, a number)';

async function colleague(ctx: RunContext, first: string) {
  const p = await peopleApi.add({ name: `${first} ${ctx.token}`, email: `${first.toLowerCase()}-${ctx.token.toLowerCase()}@sim.invalid` });
  ctx.log(`colleague ${p.name} added`);
  return p;
}

/** The request the task opened, once it is there. */
async function openRequest(ctx: RunContext, taskId: string, label = 'the request to people') {
  const all = await ctx.poll(label, () => tasksApi.inputRequests(taskId), (rs) => rs.some((r) => r.status === 'pending' && (r.audience || r.gaps)), { timeoutMs: 180_000 });
  return all.find((r) => r.status === 'pending' && (r.audience || r.gaps)) as InputRequest;
}

async function linkFor(requestId: string, name: string) {
  const links = await simApi.requestLinks(requestId);
  const l = links.find((x) => x.to.name === name);
  if (!l || !l.token) throw new Error(`no link for ${name}`);
  return l.token;
}

const collectStep = (t: TaskDetail) => t.steps.find((s: Step) => s.capability === 'human.collect');
type CollectData = { records?: { product?: string; price?: number }[]; credits?: { by: string; kind: string; pool?: string; id?: string }[]; deadline_passed?: boolean };

export const colleagueLink: Scenario = {
  id: 'people.colleague-link',
  group: GROUP,
  title: 'A colleague answers through their private link — no account',
  summary: 'The task asks a named colleague for a price. They open their link (the page shows the request and nothing else of the task), answer, and the task finishes with their row credited to them.',
  exercises: 'human.collect ask → assign (link) → GET/POST /answer/:token → close → step runs again → credits',
  cost: ['ai'],
  estimate: '~50s',
  async run(ctx) {
    const kemi = await colleague(ctx, 'Kemi');
    const pp = pricePoint(ctx.rng);
    const task = await tasksApi.create(`Use human.collect to ask ${kemi.name} for today's price of ${pp.product} at their market ${FIELDS}. That is the whole task. ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id);
    const token = await linkFor(req.id, kemi.name);
    const page = await answerApi.view(token);
    ctx.log(`${kemi.name} opens the link: "${page.request.instructions}"`);
    await answerApi.send(token, { records: [{ product: pp.product, price: pp.price_ngn }] });
    const done = await settled(ctx, task.id, 'the task to finish');
    const data = (collectStep(done)?.observation?.data || {}) as CollectData;
    return [
      expectTrue('Asked the colleague, not the owner', Boolean(req.audience?.people?.some((p) => p.name === kemi.name)), kemi.name, req.audience),
      expectEqual('The page names them and who asked', kemi.name, page.you.name),
      expectTrue('…and shows nothing else of the task', !JSON.stringify(page).includes(task.id), 'no task id', 'task id present'),
      expectEqual('Their row came back', pp.price_ngn, data.records?.[0]?.price),
      expectEqual('…credited to them', kemi.name, data.credits?.[0]?.by),
      expectEqual('The task finished', 'done', done.status),
    ];
  },
};

export const twoAnswers: Scenario = {
  id: 'people.two-answers',
  group: GROUP,
  title: 'Two colleagues, two answers: it waits for both, and credits each',
  summary: 'The task asks two colleagues and wants both answers. After the first it is still waiting; after the second it carries on, every row credited to whoever gave it.',
  exercises: 'max_answers 2 → recordAnswer → _enough → close → merged records + credits',
  cost: ['ai'],
  estimate: '~60s',
  async run(ctx) {
    const [a, b] = [await colleague(ctx, 'Ada'), await colleague(ctx, 'Bola')];
    const pp = pricePoint(ctx.rng);
    const task = await tasksApi.create(`Use human.collect to ask both ${a.name} and ${b.name} for the price of ${pp.product} where they are, taking both answers (max_answers 2) ${FIELDS}. That is the whole task. ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id);
    await answerApi.send(await linkFor(req.id, a.name), { records: [{ product: pp.product, price: pp.price_ngn }] });
    const between = (await tasksApi.inputRequests(task.id)).find((r) => r.id === req.id);
    await answerApi.send(await linkFor(req.id, b.name), { records: [{ product: pp.product, price: pp.price_ngn + 500 }] });
    const done = await settled(ctx, task.id, 'the task to finish');
    const data = (collectStep(done)?.observation?.data || {}) as CollectData;
    return [
      expectEqual('After one answer, still waiting', 'pending', between?.status),
      expectEqual('Both rows came back', 2, data.records?.length),
      expectEqual('…each credited', [a.name, b.name], (data.credits || []).map((c) => c.by)),
      expectEqual('The task finished', 'done', done.status),
    ];
  },
};

export const deadlineContinue: Scenario = {
  id: 'people.deadline-continue',
  group: GROUP,
  title: 'Nobody answers by the deadline: the task continues, partial — not failed',
  summary: 'A colleague is asked and does not answer. At the deadline (passed on demand here) the request closes with nothing, the step is partial, and the task finishes saying what is missing rather than failing.',
  exercises: 'deadline → close(on_deadline continue) → human.collect partial (deadline_passed) → outcome',
  cost: ['ai'],
  estimate: '~50s',
  async run(ctx) {
    const c = await colleague(ctx, 'Chidi');
    const pp = pricePoint(ctx.rng);
    const task = await tasksApi.create(`Use human.collect to ask ${c.name} for the price of ${pp.product} ${FIELDS}, then report it. ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id);
    const closed = await simApi.passDeadline(req.id);
    const done = await settled(ctx, task.id, 'the task to finish');
    const step = collectStep(done);
    return [
      expectEqual('The deadline closed it with nothing', 'expired', closed.status),
      expectEqual('The step is partial, not failed', 'partial', step?.status),
      expectTrue('…and says nobody answered', Boolean((step?.observation?.data as CollectData | undefined)?.deadline_passed), 'deadline_passed', step?.observation?.summary),
      expectTrue('The task did not fail', done.status !== 'failed', 'done or partial', done.status),
    ];
  },
};

export const poolPartner: Scenario = {
  id: 'people.pool-partner',
  group: GROUP,
  title: 'A pool in a partner\'s app: the request goes out, scouts\' answers come back credited',
  summary: 'The pool\'s endpoint (the built-in receiver, standing in for NaijaReels) receives the request with a reply link. Two scouts answer through it, each naming who they are; both rows come back with their scout ids.',
  exercises: 'pool → sender.send(envelope, Idempotency-Key) → reply link → POST /answer/:token answered_by → credits',
  cost: ['ai'],
  estimate: '~60s',
  async run(ctx) {
    const ep = await receiverEndpoint(ctx, 'scouts', ['ok']);
    const poolName = `Scouts ${ctx.token}`;
    await peopleApi.addPool({ name: poolName, endpoint: ep.id });
    const pp = pricePoint(ctx.rng);
    const task = await tasksApi.create(`Use human.collect to ask the "${poolName}" pool for the price of ${pp.product}, taking two answers (max_answers 2) ${FIELDS}. That is the whole task. ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id);
    const hits = await ctx.poll('the partner to receive the request', () => receiver(ctx, ep.name), (r) => r.hits.length > 0);
    const env = hits.hits[0].body as { type?: string; reply?: { url: string } };
    const token = String(env.reply?.url || '').split('/answer/')[1] || '';
    await answerApi.send(token, { answered_by: { id: 'scout-17', name: 'Musa' }, records: [{ product: pp.product, price: pp.price_ngn }] });
    await answerApi.send(token, { answered_by: { id: 'scout-4', name: 'Ngozi' }, records: [{ product: pp.product, price: pp.price_ngn + 200 }] });
    const done = await settled(ctx, task.id, 'the task to finish');
    const data = (collectStep(done)?.observation?.data || {}) as CollectData;
    return [
      expectTrue('Asked the pool', req.audience?.pool?.name === poolName, poolName, req.audience),
      expectEqual('The partner got a DutyCaptain request', 'dutycaptain.request', env.type),
      expectTrue('…with a reply link', Boolean(token), 'a reply url', env.reply),
      expectEqual('Both scouts credited, by their ids', ['scout-17', 'scout-4'], (data.credits || []).map((c) => c.id)),
      expectEqual('The task finished', 'done', done.status),
    ];
  },
};

export const nonBlocking: Scenario = {
  id: 'people.non-blocking',
  group: GROUP,
  title: 'While a colleague is asked, the rest of the task keeps running',
  summary: 'One branch asks a colleague; an independent branch fetches a page. The fetch finishes while the question is still open — the task waits only once nothing else can run.',
  exercises: 'handleNeedsInput (scheduler: step waits, task keeps running) → frontier → suspend when only waiting steps remain',
  cost: ['ai'],
  estimate: '~60s',
  async run(ctx) {
    const d = await colleague(ctx, 'Dayo');
    const pp = pricePoint(ctx.rng);
    const url = ctx.receiverUrl(`page-${ctx.token.toLowerCase()}`, ['ok']);
    const task = await tasksApi.create(`Two independent steps, neither depending on the other: (1) use http.request to fetch ${url} ; (2) use human.collect to ask ${d.name} for the price of ${pp.product} ${FIELDS}. ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id);
    const mid = await ctx.poll('the fetch to finish while the question is open', () => tasksApi.get(task.id), (t) => t.steps.some((s) => s.capability === 'http.request' && s.status === 'done'));
    const stillOpen = (await tasksApi.inputRequests(task.id)).find((r) => r.id === req.id)?.status;
    await answerApi.send(await linkFor(req.id, d.name), { records: [{ product: pp.product, price: pp.price_ngn }] });
    const done = await settled(ctx, task.id, 'the task to finish');
    return [
      expectTrue('The fetch finished while the colleague was asked', mid.steps.some((s) => s.capability === 'http.request' && s.status === 'done'), 'http.request done', mid.steps.map((s) => `${s.capability}:${s.status}`)),
      expectEqual('…and the question was still open then', 'pending', stillOpen),
      expectEqual('The task finished once they answered', 'done', done.status),
    ];
  },
};

export const gapsToOwner: Scenario = {
  id: 'gaps.partial-to-owner',
  group: GROUP,
  title: 'A partial result asks only for what is missing — and is completed from the answer',
  summary: 'A page lists three products, one without a price. The task is set to ask its owner about gaps: only that one item is asked for, pre-filled. The answer is merged into the step (confirmed, credited) and the task finishes complete.',
  exercises: 'text.extract partial → gaps.maybeAsk (tasks.gaps owner) → pre-filled rows → answer → gaps.merge → confirmed → done',
  cost: ['ai'],
  estimate: '~60s',
  async run(ctx) {
    const [a, b, c] = [pricePoint(ctx.rng), pricePoint(ctx.rng), pricePoint(ctx.rng)];
    const lines = [`${a.product}: ${naira(a.price_ngn)}`, `${b.product}: ${naira(b.price_ngn)}`, `${c.product}: price on request ${simMark(ctx.token)}`];
    const p = btoa(unescape(encodeURIComponent(JSON.stringify({ title: 'Shop list', lines })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `${ctx.health.self_url}/sim/receiver/${ctx.runId}/${encodeURIComponent(`shop-${ctx.token.toLowerCase()}`)}/page?p=${p}`;
    const task = await tasksApi.create(`Use http.request to fetch ${url} , then text.extract every product and its price in naira (fields: product as the key, price_ngn required — all three products). ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS }, gaps: { to: 'owner' } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id, 'the gap request');
    const pre = req.guide?.prefill || [];
    const row = pre.find((r) => String(r.product || '').includes(c.product.split(' ')[0]));
    ctx.log(`asked for ${pre.length} gap(s): ${pre.map((r) => r._about).join('; ')}`);
    if (!row) return [fail('Only the missing price is asked for', c.product, pre)];
    await tasksApi.answerInput(task.id, req.id, { records: [{ ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? '' : String(v)])), price_ngn: String(c.price_ngn) }] });
    const done = await settled(ctx, task.id, 'the task to finish');
    const values = await tasksApi.values(task.id);
    const given = values.find((v) => v.field === 'price_ngn' && Number(v.value) === c.price_ngn);
    return [
      expectEqual('Only the one gap was asked for', 1, pre.length),
      expectTrue('…pre-filled with what was found', String(row.product || '').length > 0 && (row.price_ngn === null || row.price_ngn === ''), 'product filled, price blank', row),
      expectEqual('The answer became a confirmed value', 'confirmed', given?.state),
      expectTrue('…credited to who gave it', Boolean(given?.locator?.startsWith('answered by')), 'answered by …', given?.locator),
      expectEqual('The task finished complete', 'done', done.status),
    ];
  },
};

export const linkFile: Scenario = {
  id: 'people.link-file',
  group: GROUP,
  title: 'A colleague sends a spreadsheet through their link: its rows come back, credited',
  summary: 'The colleague uploads a CSV on their answer page instead of typing rows. Its columns match the fields, so it becomes rows — each credited to them — and the file is kept with the answer.',
  exercises: 'POST /answer/:token/files → uploads (prefixed per link) → answer files → CSV rows → credits',
  cost: ['ai'],
  estimate: '~50s',
  async run(ctx) {
    const f = await colleague(ctx, 'Funke');
    const [a, b] = [pricePoint(ctx.rng), pricePoint(ctx.rng)];
    const task = await tasksApi.create(`Use human.collect to ask ${f.name} for today's prices at their market ${FIELDS}. That is the whole task. ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const req = await openRequest(ctx, task.id);
    const token = await linkFor(req.id, f.name);
    const csv = `product,price\n"${a.product}",${a.price_ngn}\n"${b.product}",${b.price_ngn}\n`;
    const up = await answerApi.upload(token, new File([csv], `market-${ctx.token.toLowerCase()}.csv`, { type: 'text/csv' }));
    await answerApi.send(token, { files: [up.file] });
    const done = await settled(ctx, task.id, 'the task to finish');
    const data = (collectStep(done)?.observation?.data || {}) as CollectData & { files?: { name: string; rows?: number }[] };
    return [
      expectEqual('The CSV became two rows', 2, data.records?.length),
      expectEqual('…both credited to the colleague', [f.name, f.name], (data.credits || []).map((c) => c.by)),
      expectTrue('The file is kept with the answer', Boolean(data.files?.some((x) => x.rows === 2)), 'a file with 2 rows', data.files),
      expectEqual('The task finished', 'done', done.status),
    ];
  },
};

export const gapsAfterFinish: Scenario = {
  id: 'gaps.after-finish',
  group: GROUP,
  title: 'A task that finished partial asks afterwards — and becomes done',
  summary: 'No gap route was set, so the task finishes partial with one price missing. Asked afterwards ("Ask me for only what is missing"), the answer completes it: measured again by code, the task is done.',
  exercises: 'POST /tasks/:id/gaps → gaps.maybeAsk (route given) → answer → merge → outcome.measure → partial → done (completeAfterGaps)',
  cost: ['ai'],
  estimate: '~60s',
  async run(ctx) {
    const [a, b, c] = [pricePoint(ctx.rng), pricePoint(ctx.rng), pricePoint(ctx.rng)];
    const lines = [`${a.product}: ${naira(a.price_ngn)}`, `${b.product}: ${naira(b.price_ngn)}`, `${c.product}: call for price ${simMark(ctx.token)}`];
    const p = btoa(unescape(encodeURIComponent(JSON.stringify({ title: 'Shop list', lines })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `${ctx.health.self_url}/sim/receiver/${ctx.runId}/${encodeURIComponent(`shop2-${ctx.token.toLowerCase()}`)}/page?p=${p}`;
    const task = await tasksApi.create(`Use http.request to fetch ${url} , then text.extract every product and its price in naira (fields: product as the key, price_ngn required — all three products). ${simMark(ctx.token)}`, { budget: { caps: SIM_CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const first = await settled(ctx, task.id, 'the task to finish partial');
    const asked = await tasksApi.askForGaps(task.id, { to: 'owner' });
    const req = asked.requests[0];
    const row = (req.guide?.prefill || [])[0] || {};
    ctx.log(`asked afterwards for: ${String(row._about || '')}`);
    await tasksApi.answerInput(task.id, req.id, { records: [{ ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === null ? '' : String(v)])), price_ngn: String(c.price_ngn) }] });
    const after = await ctx.poll('the task to be measured again', () => tasksApi.get(task.id), (t) => t.status !== 'partial', { timeoutMs: 30_000 }).catch(() => tasksApi.get(task.id));
    return [
      expectEqual('It finished partial first', 'partial', first.status),
      expectEqual('One gap was asked for, afterwards', 1, asked.requests.length),
      expectEqual('The answer completed it: done', 'done', after.status),
    ];
  },
};

export const PEOPLE_SCENARIOS = [colleagueLink, twoAnswers, deadlineContinue, poolPartner, nonBlocking, gapsToOwner, linkFile, gapsAfterFinish];
