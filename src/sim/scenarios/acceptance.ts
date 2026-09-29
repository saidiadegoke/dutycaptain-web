import { approvalsApi, brandsApi, connectionsApi, draftsApi, platformActionsApi, simApi, tasksApi, triggersApi } from '@/lib/api';
import type { TaskDetail } from '@/lib/types';
import { expectEqual, expectTrue, fail, pass } from '../core/checks';
import { simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { receiverEndpoint, settled } from './_helpers';

/**
 * The acceptance set (reading & extraction plan §8): the twelve tasks of §3,
 * each with fixed inputs, the contract it should produce, and the outcome that
 * counts as correct — defined once, in the API (src/modules/sim/acceptance.js),
 * which also judges each run. The run is the real product with real AI.
 *
 * T11 and T12 are scripted flows here: several runs, with the owner acting in
 * between, judged step by step against the same outcomes (§3). Each task's
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

/* ---------------------------------------------------------------------------
 * T11 and T12: scripted — several runs, the owner acting between them
 * ------------------------------------------------------------------------ */

async function simConnection(ctx: RunContext) {
  const { connections } = await connectionsApi.list();
  if (connections.some((c) => c.platform === 'sim' && c.status === 'active')) return;
  const out = await simApi.allowConnection((await connectionsApi.start('sim')).authorize_url);
  if (!out.connected) throw new Error(`the sim platform did not connect: ${out.error}`);
  ctx.log('connected the sim platform as @sim_bakery');
}

/** Settled, approving what it asks as its owner would (the contract, a send). */
async function settleApproving(ctx: RunContext, taskId: string, label: string): Promise<TaskDetail> {
  let t = await settled(ctx, taskId, label);
  for (let i = 0; i < 5 && t.status === 'waiting_for_approval'; i += 1) {
    const pending = (await approvalsApi.list()).filter((a) => a.task_id === taskId && a.status === 'pending');
    for (const a of pending) {
      ctx.log(`approving, as you would: ${a.summary}`);
      await approvalsApi.decide(a.id, { granted: true, scope: 'once' });
    }
    t = await settled(ctx, taskId, label);
  }
  return t;
}

type Story = { url?: string; creator?: string; posted_at?: string; views?: number; what_happened?: string; why_trending?: string };

const t11: Scenario = {
  id: 'acceptance.t11',
  group: GROUP,
  title: 'T11 — What is trending, into NaijaReels',
  summary: 'Every hour (three runs, the sim platform\'s clock moved an hour between): find what is rising about Lagos, and send each story to NaijaReels (a receiver standing in for its tips endpoint). The first run is a baseline; the second sends only rising posts, each with what NaijaReels\' gate for agent stories needs; the third resends nothing. Failure variants: people.pool-partner, watches.rising, connections.read.',
  exercises: 'social.search → watch.track (rising) → api.send body_from → NaijaReels evidence (link, creator, time, numbers, the agent\'s account)',
  cost: ['ai', 'slow'],
  estimate: '~4 min',
  async run(ctx) {
    await simConnection(ctx);
    const ep = await receiverEndpoint(ctx, 'naijareels', ['ok']);
    const objective = `Every hour: find what is rising about Lagos on the connected sim platform (social.search), track it with watch.track (watch "trending-${ctx.token.toLowerCase()}", key "url", metric "views", only "rising", min_growth 50), and send the stories it hands on to the endpoint "${ep.name}" with api.send, as {"stories": [...]} — each story with url, creator (the post's author), platform, posted_at (the post's created_at), views, likes, what_happened and why_trending (two sentences each, written from the post's text and how fast its views grew). If the watch hands on nothing, send nothing. ${simMark(ctx.token)}`;
    const runs: TaskDetail[] = [];
    for (let i = 0; i < 3; i += 1) {
      if (i) { await simApi.platformControl({ advance_minutes: 60 }); ctx.log('the platform clock moves on an hour'); }
      const t = await tasksApi.create(objective, { budget: { caps: { usd: 0.08, steps: 8 } } });
      ctx.link(`Run ${i + 1}`, `/app/tasks/${t.id}`);
      runs.push(await settleApproving(ctx, t.id, `run ${i + 1}`));
    }
    const hits = (await simApi.receiver(ctx.runId, ep.name)).hits;
    const stories = hits.flatMap((h) => { const b = (typeof h.body === 'string' ? JSON.parse(h.body) : h.body) as { stories?: Story[] }; return Array.isArray(b?.stories) ? b.stories : []; });
    const sent = (t: TaskDetail) => t.steps.some((s) => s.capability === 'api.send' && s.status === 'done' && !(s.observation?.data as { skipped?: boolean })?.skipped);
    const urls = stories.map((s) => s.url);
    const complete = stories.filter((s) => s.url && s.creator && s.posted_at && Number(s.views) > 0 && `${s.what_happened || ''} ${s.why_trending || ''}`.trim().length >= 200);
    return [
      expectTrue('Run 1 is a baseline — nothing sent', !sent(runs[0]), 'nothing', runs[0].steps.map((s) => s.capability)),
      expectTrue('Run 2 sends the rising stories', stories.length > 0, 'stories', hits.length),
      expectTrue('The flat throwback is never sent', !stories.some((s) => /throwback|oldnews/i.test(`${s.url} ${s.creator}`)), 'not sent', 'sent'),
      expectTrue('Nothing sent twice; run 3 sends nothing', new Set(urls).size === urls.length && !sent(runs[2]), 'no repeats', urls),
      expectEqual('Every story carries what NaijaReels\' gate needs (link, creator, time, numbers, a 200-character account)', stories.length, complete.length),
    ];
  },
};

const t12: Scenario = {
  id: 'acceptance.t12',
  group: GROUP,
  title: 'T12 — A marketing assistant for a business',
  summary: 'Plan next week\'s posts for a bakery (drafts with times, checked against its facts); you approve them — they wait for their times, one goes now, once. A simple comment is answered by your reply rules from the facts; a complaint is left for you. A weekly report from the account\'s own numbers names the best post. Failure variants: publish.once, publish.scheduled, reply.auto, drafts.brand.',
  exercises: 'draft.write (planned) → approve → publish (ledger, exactly once) → mention → social.reply (reply rules) / escalate → social.insights report',
  cost: ['ai', 'slow'],
  estimate: '~4 min',
  async run(ctx) {
    await simConnection(ctx);
    const brand = await brandsApi.create({
      name: `Mama Tee ${ctx.token}`, voice: 'warm, short, playful; Nigerian English',
      facts: [{ name: 'meat pie', value: '₦1,500' }, { name: 'chin chin jar', value: '₦3,000' }, { name: 'opening hours', value: '7am to 8pm, Monday to Saturday' }],
      never_say: ['cheapest in Lagos'], reply_rules: { auto: true, max_per_hour: 5 },
    });
    const plan = await tasksApi.create(`Be our social media assistant: plan next week's posts for our bakery — use draft.write for the brand "${brand.name}" to write 3 posts for X, one a day next week at good times (planned times), about meat pies, chin chin and our hours. Drafts only; I will approve them. ${simMark(ctx.token)}`, { budget: { caps: { usd: 0.08, steps: 6 } } });
    ctx.link('The plan', `/app/tasks/${plan.id}`);
    await settleApproving(ctx, plan.id, 'the plan');
    const drafts = await draftsApi.list({ task_id: plan.id });
    const ok = drafts.filter((d) => d.checks.ok);
    for (const d of ok) await draftsApi.decide(d.id, 'approve');
    const [first, ...rest] = ok;
    for (const d of rest) await draftsApi.publish(d.id, { at: d.planned_for as string });
    const now = first ? await draftsApi.publish(first.id) : null;
    ctx.log('approved the drafts, as you would; one published now, the rest at their times');
    const queued = (await draftsApi.list({ status: 'approved' })).filter((d) => rest.some((r) => r.id === d.id));
    const posts = await simApi.platformPosts();
    const trig = await triggersApi.create({ name: `mentions-${ctx.token.toLowerCase()}`, mode: 'auto', source: 'sim', event_types: ['tweet_create'], objective: `Answer simple comments: use draft.write (kind "reply", brand "${brand.name}") to draft a reply to the mention in the event that started this task, then send it with social.reply using that draft's draft_id and the mention's id as in_reply_to. If the draft is marked for the owner, do not send it. ${simMark(ctx.token)}` });
    const q = await simApi.emitMention(trig.id, '@sim_bakery what time do you open on Saturday?');
    const qt = q.answer?.data?.received?.[0]?.task_id;
    if (qt) await settled(ctx, qt, 'the reply');
    const qa = qt ? await platformActionsApi.list(qt) : [];
    const c = await simApi.emitMention(trig.id, '@sim_bakery the cake I ordered was wrong and nobody picks up the phone.');
    const ct = c.answer?.data?.received?.[0]?.task_id;
    const cd = ct ? await settled(ctx, ct, 'the complaint') : null;
    const ca = ct ? await platformActionsApi.list(ct) : [];
    const rep = await tasksApi.create(`Write our weekly social media report from social.insights on the connected sim platform: the views and likes of our recent posts, which post did best, and one suggestion for next week. ${simMark(ctx.token)}`, { budget: { caps: { usd: 0.06, steps: 5 } } });
    ctx.link('The weekly report', `/app/tasks/${rep.id}`);
    const r = await settleApproving(ctx, rep.id, 'the report');
    const reportText = JSON.stringify(r.outcome || {}) + JSON.stringify(r.steps.map((s) => s.observation?.data || {}));
    return [
      expectTrue('Three drafts, each with a time next week', drafts.length === 3 && drafts.every((d) => d.planned_for && new Date(d.planned_for) > new Date()), '3 planned', drafts.map((d) => d.planned_for)),
      expectTrue('Every draft checked against the brand', drafts.every((d) => typeof d.checks.ok === 'boolean'), 'checked', drafts.map((d) => d.checks)),
      expectTrue('Approved posts wait for their times', queued.length === rest.length && queued.every((d) => d.publish_status === 'queued'), 'queued', queued.map((d) => d.publish_status)),
      expectTrue('One published now, once', now?.publish_status === 'published' && posts.filter((p) => p.text === now.text).length === 1, 'once', now?.publish_status),
      expectTrue('A simple comment answered by your reply rules, from the facts', qa.some((a) => a.kind === 'reply' && a.status === 'succeeded' && /reply rule/.test(a.authorised_by || '')), 'answered', qa.map((a) => [a.status, a.authorised_by])),
      expectTrue('A complaint is left for you — not answered, not sent to approval', !ca.some((a) => a.status === 'succeeded') && cd?.status !== 'waiting_for_approval', 'left for you', { status: cd?.status, ca }),
      expectTrue('The weekly report names the best post', /chin chin/i.test(reportText) && ['done', 'partial'].includes(r.status), 'chin chin jars', r.status),
    ];
  },
};

export const ACCEPTANCE_SCENARIOS: Scenario[] = [...TASKS.map(scenario), t11, t12];
