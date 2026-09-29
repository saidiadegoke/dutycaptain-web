import { tasksApi } from '@/lib/api';
import type { Step } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { receiver, settled, startTask } from './_helpers';

/**
 * Phase 2 · the content store and reader (plan §6.2, R3, R4, R12; migration
 * 064): pages are kept whole as searchable passages; a reader takes the
 * relevant part, not the beginning; what the task already has is reused.
 */

const GROUP = 'Phase 2 · Content store & reader';

/** A listing page with `filler` lines of filters before the listings. */
function listing(ctx: RunContext, name: string, lines: string[], filler: number) {
  const p = btoa(unescape(encodeURIComponent(JSON.stringify({ title: 'Groceries — all items', lines, filler })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { url: `${ctx.health.self_url}/sim/receiver/${ctx.runId}/${encodeURIComponent(name)}/page?p=${p}`, name };
}
const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export const deepListingFound: Scenario = {
  id: 'content.deep-listing',
  group: GROUP,
  title: 'A price below 70,000 characters of filters is found',
  summary: 'The page opens with a wall of filters and the listing sits at the end — the NaijaPrices failure. The page is kept whole, and extraction reads the relevant passage instead of the first part.',
  exercises: 'http.request (large cap) → sources/passages → text.extract rankedFit',
  cost: ['ai'],
  estimate: '~35s',
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const page = listing(ctx, `deep-${ctx.token.toLowerCase()}`, [`${pp.product}: ${naira(pp.price_ngn)} ${simMark(ctx.token)}`], 1100);
    const task = await startTask(ctx, `Use http.request to fetch ${page.url} , then use text.extract to get the product and its price in naira (fields: product, price_ngn).`);
    const done = await settled(ctx, task.id, 'the task to fetch and extract');
    const extract = done.steps.find((s: Step) => s.capability === 'text.extract');
    const data = (extract?.observation?.data || {}) as { records?: { price_ngn?: number }[]; reading?: { mode?: string; passages_skipped?: number } };
    const src = (await tasksApi.sources(task.id)).find((s) => s.kind === 'http');
    return [
      expectEqual('The task finished', 'done', done.status),
      expectEqual('The price at the bottom was found', pp.price_ngn, data.records?.[0]?.price_ngn),
      expectTrue('The page was kept whole (well over the old 20,000 characters)', (src?.versions[0]?.bytes || 0) > 60000, '> 60,000 bytes', src?.versions[0]?.bytes),
      expectTrue('…as searchable passages', (src?.versions[0]?.passages || 0) > 20, '> 20 passages', src?.versions[0]?.passages),
      expectTrue('Extraction read the ranked passages, and says what it skipped', data.reading?.mode === 'ranked' && (data.reading?.passages_skipped || 0) > 0, 'reading: ranked, some skipped', data.reading),
    ];
  },
};

export const searchReuses: Scenario = {
  id: 'content.search-reuses',
  group: GROUP,
  title: 'A second question is answered from what was already read — no second fetch',
  summary: 'The task fetches a page once, then uses content.search to find a second product in it. The page is requested once.',
  exercises: 'content.search → passages.search · receiver request count',
  cost: ['ai'],
  estimate: '~35s',
  async run(ctx) {
    const [a, b] = [pricePoint(ctx.rng), pricePoint(ctx.rng)];
    const page = listing(ctx, `reuse-${ctx.token.toLowerCase()}`, [`${a.product}: ${naira(a.price_ngn)}`, `${b.product}: ${naira(b.price_ngn)} ${simMark(ctx.token)}`], 300);
    const task = await startTask(ctx, `Use http.request to fetch ${page.url} once. Then use content.search to find the passage about "${b.product}", and text.extract its price in naira (fields: product, price_ngn). Do not fetch the page a second time.`);
    const done = await settled(ctx, task.id, 'the task to finish');
    const search = done.steps.find((s: Step) => s.capability === 'content.search');
    const rcv = await receiver(ctx, page.name);
    return [
      expectEqual('The task finished', 'done', done.status),
      search ? expectEqual('content.search found the passage', 'done', search.status) : fail('It used content.search', 'a content.search step', done.steps.map((s) => s.capability)),
      expectEqual('The page was requested once', 1, rcv.requests),
    ];
  },
};

export const retryCarries: Scenario = {
  id: 'content.retry-carries',
  group: GROUP,
  title: 'A retry works from what the first attempt read',
  summary: 'A task reads a page; the sim retries it. The retry starts with the page already stored (carried over), and answers from it without fetching it again.',
  exercises: 'retry.service → sources.carryOver · context "stored" · receiver request count',
  cost: ['ai'],
  estimate: '~60s',
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const page = listing(ctx, `retry-${ctx.token.toLowerCase()}`, [`${pp.product}: ${naira(pp.price_ngn)} ${simMark(ctx.token)}`], 200);
    const first = await startTask(ctx, `Use http.request to fetch ${page.url} , then use text.extract to get the product and its price in naira (fields: product, price_ngn).`);
    await settled(ctx, first.id, 'the first attempt to finish');
    ctx.log('retrying the task');
    const retry = await tasksApi.retry(first.id, { learn: true });
    ctx.link('Open the retry', `/app/tasks/${retry.id}`);
    const carried = (await tasksApi.sources(retry.id)).find((s) => s.kind === 'http');
    const done = await settled(ctx, retry.id, 'the retry to finish');
    const extract = done.steps.find((s: Step) => s.capability === 'text.extract');
    const price = ((extract?.observation?.data as { records?: { price_ngn?: number }[] } | undefined)?.records || [])[0]?.price_ngn;
    return [
      expectTrue('The retry starts with the page already stored', Boolean(carried?.carried_from), 'a carried-over source', carried || 'none'),
      expectEqual('The retry finished', 'done', done.status),
      expectEqual('…with the right price', pp.price_ngn, price),
      expectEqual('The page was fetched once in all — the retry reused it', 1, (await receiver(ctx, page.name)).requests),
    ];
  },
};

export const CONTENT_SCENARIOS = [deepListingFound, searchReuses, retryCarries];
