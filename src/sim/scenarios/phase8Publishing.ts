import { brandsApi, connectionsApi, draftsApi, platformActionsApi, simApi, tasksApi, triggersApi } from '@/lib/api';
import type { Brand, Connection, Draft } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { SIM_CAPS, settled, timeline } from './_helpers';

/**
 * Phase 8 · acting in public (plan §6.12, §6.18; R21, R23), on the sim
 * platform. Every post goes through the ledger: exactly once, read back; a
 * lost answer is reconciled by reading the account's posts, and goes to you
 * when it can't be; rules in code block what the brand can't say; replies go
 * by themselves only within the rules you set.
 */

const GROUP = 'Phase 8 · Acting in public';
const CAPS = { ...SIM_CAPS, steps: 6 };

async function simConnection(ctx: RunContext): Promise<Connection> {
  const { connections } = await connectionsApi.list();
  const have = connections.find((c) => c.platform === 'sim' && c.status === 'active');
  if (have) return have;
  const out = await simApi.allowConnection((await connectionsApi.start('sim')).authorize_url);
  if (!out.connected) throw new Error(`the sim platform did not connect: ${out.error}`);
  ctx.log('connected the sim platform as @sim_bakery');
  return (await connectionsApi.list()).connections.find((c) => c.id === out.connected) as Connection;
}

async function bakery(ctx: RunContext, extra: Partial<Brand> = {}): Promise<Brand> {
  return brandsApi.create({
    name: `Mama Tee ${ctx.token}`,
    facts: [{ name: 'meat pie', value: '₦1,500' }, { name: 'opening hours', value: '7am to 8pm, Monday to Saturday' }],
    never_say: ['cheapest in Lagos'],
    ...extra,
  });
}

/** A post you wrote and approved. */
async function approved(ctx: RunContext, brand: Brand, text: string, extra: { planned_for?: string } = {}): Promise<Draft> {
  const d = await draftsApi.create({ text: `${text} ${ctx.token}`, brand_id: brand.id, ...extra });
  return draftsApi.decide(d.id, 'approve');
}

const countOf = async (text: string) => (await simApi.platformPosts()).filter((p) => p.text === text).length;

export const draftOnce: Scenario = {
  id: 'publish.once',
  group: GROUP,
  title: 'An approved draft is published once, read back, and can be undone',
  summary: 'You approve a post and choose Publish now. It goes out once — publishing it again is refused — and is read back from the platform. Undo deletes it; nothing is ever undone by itself.',
  exercises: 'POST /drafts → approve → POST /drafts/:id/publish → ledger (submitting → succeeded → read back) → undo (delete on the ledger)',
  cost: ['free'],
  estimate: '~3s',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await bakery(ctx);
    const d = await approved(ctx, brand, 'Fresh meat pies, ₦1,500, from 7am.');
    const out = await draftsApi.publish(d.id);
    let second = 'accepted';
    try { await draftsApi.publish(d.id); } catch (err) { second = (err as Error).message; }
    const action = (await platformActionsApi.list()).find((a) => a.id === out.action_id);
    const before = await countOf(d.text as string);
    const undo = action ? await platformActionsApi.undo(action.id) : null;
    const after = await countOf(d.text as string);
    return [
      expectEqual('Published', 'published', out.publish_status),
      expectEqual('…once', 1, before),
      expectTrue('Publishing it again is refused', /already published/.test(second), 'refused', second),
      expectTrue('Read back from the platform: it matches', Boolean(action?.verified?.matches), 'matches', action?.verified),
      expectEqual('Undo deletes it (your choice)', 'succeeded', undo?.undo.status),
      expectEqual('…and it is gone', 0, after),
    ];
  },
};

export const lostAnswer: Scenario = {
  id: 'publish.lost-answer',
  group: GROUP,
  title: 'No answer from the platform: reconciled by reading back — never posted twice',
  summary: 'The platform posts, then the answer is lost: DutyCaptain reads the account back, finds the post, and records it — one post. Then a request is lost before the platform acts: not found, so you are asked; your "it didn\'t" lets it go out once.',
  exercises: 'post_mode drop → unknown → reconcile (ownRecent) → succeeded · post_mode lost → asked → confirm false → posted once',
  cost: ['free'],
  estimate: '~4s',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await bakery(ctx);
    const a = await approved(ctx, brand, 'Chin chin is back this Saturday, 7am to 8pm.');
    await simApi.platformControl({ post_mode: 'drop' });
    const first = await draftsApi.publish(a.id);
    const firstAction = (await platformActionsApi.list()).find((x) => x.id === first.action_id);
    const b = await approved(ctx, brand, 'Meat pies ₦1,500 — come early!');
    await simApi.platformControl({ post_mode: 'lost' });
    const second = await draftsApi.publish(b.id);
    await simApi.platformControl({ post_mode: 'ok' });
    const pendingBefore = await countOf(b.text as string);
    if (second.action_id) await platformActionsApi.confirm(second.action_id, false);
    const again = await draftsApi.publish(b.id);
    return [
      expectEqual('Answer lost after it posted: found by reading back', 'published', first.publish_status),
      expectTrue('…recorded as reconciled', Boolean(firstAction?.verified?.reconciled), 'reconciled', firstAction?.verified),
      expectEqual('…one post', 1, await countOf(a.text as string)),
      expectEqual('Lost before it posted: you are asked, nothing posted meanwhile', 'unknown', second.publish_status),
      expectEqual('…no post while it waits for you', 0, pendingBefore),
      expectEqual('Your "it didn\'t": it goes out once', 'published', again.publish_status),
      expectEqual('…exactly once', 1, await countOf(b.text as string)),
    ];
  },
};

export const rulesBlock: Scenario = {
  id: 'publish.rules',
  group: GROUP,
  title: 'The rules block what the brand can\'t say — checked again when it goes out',
  summary: 'A post with a price the brand never stated is flagged when written; even approved, publishing refuses it and nothing reaches the platform. A post naming someone the brand hasn\'t allowed is held for you.',
  exercises: 'brands.check → publishing rules (facts, never-say, credit, naming) → publisher re-checks → refused',
  cost: ['free'],
  estimate: '~2s',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await bakery(ctx);
    const d = await draftsApi.create({ text: `Meat pies only ₦900 today! ${ctx.token}`, brand_id: brand.id });
    const ok = await draftsApi.decide(d.id, 'approve');
    const out = await draftsApi.publish(ok.id);
    return [
      expectTrue('Flagged when written', (d.checks.problems || []).some((p) => /₦900/.test(p)), 'the ₦900 problem', d.checks.problems),
      expectEqual('Publishing refuses it', 'failed', out.publish_status),
      expectEqual('Nothing reached the platform', 0, await countOf(d.text as string)),
    ];
  },
};

export const scheduled: Scenario = {
  id: 'publish.scheduled',
  group: GROUP,
  title: 'Approved for later: it waits for its time, then goes out once',
  summary: 'A post approved for 20 seconds from now is queued; the publisher posts it when its time comes, exactly once.',
  exercises: 'POST /drafts/:id/publish { at } → queued → publisher sweep (SKIP LOCKED) → ledger → published',
  cost: ['free'],
  estimate: '~50s',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await bakery(ctx);
    const at = new Date(Date.now() + 20_000).toISOString();
    const d = await approved(ctx, brand, 'Birthday orders take 48 hours.', { planned_for: at });
    const queued = await draftsApi.publish(d.id, { at });
    const early = await countOf(d.text as string);
    const done = await ctx.poll('the post to go out', async () => (await draftsApi.list({ status: 'approved' })).find((x) => x.id === d.id), (x) => x?.publish_status === 'published' || x?.publish_status === 'failed', { timeoutMs: 90_000, everyMs: 3000 });
    return [
      expectEqual('Queued for its time', 'queued', queued.publish_status),
      expectEqual('Not before', 0, early),
      expectEqual('Then published', 'published', done?.publish_status),
      expectEqual('…once', 1, await countOf(d.text as string)),
    ];
  },
};

export const autoReply: Scenario = {
  id: 'reply.auto',
  group: GROUP,
  title: 'Automatic replies within your rules: a price question is answered; a complaint waits for you',
  summary: 'With automatic replies on for the bakery, a mention asking the price of meat pies gets a reply by itself, from the brand\'s facts. A complaint is not answered automatically.',
  exercises: 'trigger (platform webhook) → draft.write reply → social.reply → policy autoApprove (reply rules) → ledger → posted; escalated → not sent',
  cost: ['ai'],
  estimate: '~90s',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await bakery(ctx, { reply_rules: { auto: true, max_per_hour: 5 } });
    const trig = await triggersApi.create({
      name: `sim-replies-${ctx.token.toLowerCase()}`, mode: 'auto', source: 'sim', event_types: ['tweet_create'],
      objective: `Use draft.write (kind "reply", brand "${brand.name}") to draft a reply to the mention in the event that started this task, then send it with social.reply using that draft's draft_id and the mention's id as in_reply_to. If the draft is marked for the owner, do not send it. ${simMark(ctx.token)}`,
    });
    const ask = await simApi.emitMention(trig.id, '@sim_bakery how much are your meat pies?');
    const askTask = ask.answer?.data?.received?.[0]?.task_id;
    if (!askTask) return [fail('The mention started a task', 'a task', ask)];
    ctx.link('The price question', `/app/tasks/${askTask}`);
    const t1 = await settled(ctx, askTask, 'the reply to go out', { approveContract: true });
    const a1 = await platformActionsApi.list(askTask);
    const complaint = await simApi.emitMention(trig.id, '@sim_bakery my order was late and nobody answered my DM. Terrible.');
    const cTask = complaint.answer?.data?.received?.[0]?.task_id;
    if (!cTask) return [fail('The complaint started a task', 'a task', complaint)];
    ctx.link('The complaint', `/app/tasks/${cTask}`);
    const t2 = await settled(ctx, cTask, 'the complaint to be handled');
    const a2 = await platformActionsApi.list(cTask);
    const approvals = (await timeline(askTask)).filter((e) => e.type === 'approval.requested');
    return [
      expectTrue('The price question was answered', a1.some((a) => a.kind === 'reply' && a.status === 'succeeded'), 'a reply posted', { status: t1.status, actions: a1 }),
      expectTrue('…by your reply rule, without asking', a1.some((a) => /reply rule/.test(a.authorised_by || '')) && approvals.length === 0, 'reply rule', a1.map((a) => a.authorised_by)),
      expectTrue('…from the brand\'s facts', a1.some((a) => /1,500/.test(a.request.text || '')), '₦1,500', a1.map((a) => a.request.text)),
      expectTrue('The complaint was not answered automatically', !a2.some((a) => a.status === 'succeeded'), 'no reply posted', { status: t2.status, actions: a2 }),
    ];
  },
};

export const postInTask: Scenario = {
  id: 'publish.in-task',
  group: GROUP,
  title: 'A task posts the draft you approved — without asking again, and only once',
  summary: 'You approved a post; a task is asked to publish it. It goes out through social.post with the draft, authorised by your approval, read back, once.',
  exercises: 'social.post { draft_id } → policy autoApprove ("you approved this exact draft") → ledger → read back → verifier',
  cost: ['ai'],
  estimate: '~40s',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await bakery(ctx);
    const d = await approved(ctx, brand, 'Our new chocolate cake is here — order 48 hours ahead.');
    const task = await tasksApi.create(`Use social.post with draft_id ${d.id} to publish that approved draft. That is the whole task. ${simMark(ctx.token)}`, { budget: { caps: CAPS } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const done = await settled(ctx, task.id, 'the task to finish');
    const acts = await platformActionsApi.list(task.id);
    const approvals = (await timeline(task.id)).filter((e) => e.type === 'approval.requested');
    return [
      expectTrue('Posted through social.post', acts.some((a) => a.kind === 'post' && a.status === 'succeeded'), 'a post', acts),
      expectTrue('…authorised by your approval of the draft, not asked again', acts.some((a) => /approved this exact draft/.test(a.authorised_by || '')) && approvals.length === 0, 'no new approval', acts.map((a) => a.authorised_by)),
      expectEqual('…once', 1, await countOf(d.text as string)),
      expectTrue('The task finished', ['done', 'partial'].includes(done.status), 'done', done.status),
    ];
  },
};

export const PUBLISHING_SCENARIOS: Scenario[] = [draftOnce, lostAnswer, rulesBlock, scheduled, autoReply, postInTask];
