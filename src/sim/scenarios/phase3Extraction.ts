import { tasksApi } from '@/lib/api';
import type { Step } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { settled, startTask } from './_helpers';

/**
 * Phase 3 · extraction v2 (plan §6.3, §6.14, R16, R26, R27; migration 065):
 * pieces with small answers, values found by code, records merged across
 * sources, disagreements settled by rule, and every value's lineage kept.
 */

const GROUP = 'Phase 3 · Extraction v2';

function page(ctx: RunContext, name: string, title: string, lines: string[]) {
  const p = btoa(unescape(encodeURIComponent(JSON.stringify({ title, lines })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${ctx.health.self_url}/sim/receiver/${ctx.runId}/${encodeURIComponent(name)}/page?p=${p}`;
}
const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const extractStep = (steps: Step[]) => [...steps].reverse().find((s) => s.capability === 'text.extract');
const twoPages = (a: string, b: string, extra = '') => `Use http.request to fetch ${a} and ${b} , then one text.extract over both to get each product and its price in naira (fields: product as the key, price_ngn).${extra}`;

export const mergeCorroborated: Scenario = {
  id: 'extraction.merge-corroborated',
  group: GROUP,
  title: 'The same item on two pages is one record — and "why this value?" answers from records',
  summary: 'Two shops list the same product at the same price; one also lists another. The result has each product once, the shared price corroborated by the second shop, and the value\'s lineage: the passage, the page version, the model.',
  exercises: 'extraction.run → groundAndMerge (merge by key) → value_provenance → GET /tasks/:id/values',
  cost: ['ai'],
  estimate: '~40s',
  async run(ctx) {
    const [a, b] = [pricePoint(ctx.rng), pricePoint(ctx.rng)];
    const u1 = page(ctx, `shop1-${ctx.token.toLowerCase()}`, 'Shop one', [`${a.product}: ${naira(a.price_ngn)}`, `${b.product}: ${naira(b.price_ngn)} ${simMark(ctx.token)}`]);
    const u2 = page(ctx, `shop2-${ctx.token.toLowerCase()}`, 'Shop two', [`${a.product} — ${naira(a.price_ngn)} today`]);
    const task = await startTask(ctx, twoPages(u1, u2));
    const done = await settled(ctx, task.id, 'the task to finish');
    const records = ((extractStep(done.steps)?.observation?.data as { records?: { product?: string }[] } | undefined)?.records) || [];
    const values = await tasksApi.values(task.id);
    const price = values.find((v) => v.field === 'price_ngn' && v.value === a.price_ngn);
    const hashes = (await tasksApi.sources(task.id)).flatMap((s) => s.versions.map((v) => v.hash));
    return [
      expectEqual('The task finished', 'done', done.status),
      expectEqual('Each product once', 2, records.length),
      expectTrue('The shared price is corroborated by the second shop', Boolean(price?.corroborated_by?.some((c) => c.locator.includes('shop'))), 'corroborated_by: the other shop', price?.corroborated_by),
      expectTrue('Why this value: the passage it was found in', Boolean(price?.evidence && price.evidence.includes(a.price_ngn.toLocaleString('en-NG'))), `evidence containing ${naira(a.price_ngn)}`, price?.evidence),
      price ? expectTrue('…the exact page version it came from', Boolean(price.source_hash && hashes.includes(price.source_hash)), 'a stored source version', price.source_hash) : fail('The value is recorded', 'a value_provenance row', 'none'),
      expectTrue('…and who produced it', Boolean(price?.extracted_by), 'a model', price?.extracted_by),
    ];
  },
};

export const conflictUnresolved: Scenario = {
  id: 'extraction.conflict-unresolved',
  group: GROUP,
  title: 'Two equal sources disagree on a price: listed, not guessed',
  summary: 'Two shops give different prices for the same product and nothing says which to trust. The price is left open as "sources disagree", and the task does not claim it.',
  exercises: 'groundAndMerge → resolve (no rule separates) → conflicting → outcome',
  cost: ['ai'],
  estimate: '~40s',
  async run(ctx) {
    const a = pricePoint(ctx.rng);
    const other = a.price_ngn + 1500;
    const u1 = page(ctx, `left-${ctx.token.toLowerCase()}`, 'Shop left', [`${a.product}: ${naira(a.price_ngn)} ${simMark(ctx.token)}`]);
    const u2 = page(ctx, `right-${ctx.token.toLowerCase()}`, 'Shop right', [`${a.product}: ${naira(other)}`]);
    const task = await startTask(ctx, twoPages(u1, u2));
    const done = await settled(ctx, task.id, 'the task to finish');
    const conflicts = ((extractStep(done.steps)?.observation?.data as { conflicts?: { resolved: boolean; alternatives: { value: number }[] }[] } | undefined)?.conflicts) || [];
    const open = conflicts.find((c) => !c.resolved);
    return [
      expectTrue('The disagreement is listed', Boolean(open), 'an open conflict', conflicts),
      expectTrue('…with both prices', Boolean(open && [a.price_ngn, other].every((p) => open.alternatives.some((x) => Number(x.value) === p))), [a.price_ngn, other], open?.alternatives),
      expectTrue('The task does not claim a price it cannot settle', done.status !== 'done', 'partial or failed', done.status),
    ];
  },
};

export const conflictAuthoritative: Scenario = {
  id: 'extraction.conflict-authoritative',
  group: GROUP,
  title: 'An official source settles a disagreement — and the other price is kept as the alternative',
  summary: 'The official price list and a dealer disagree; the objective names the official list as authoritative. The official price is chosen by rule, with the dealer\'s price recorded as what it was chosen over.',
  exercises: 'contract.sources.authoritative → resolve (authoritative source) → resolution in provenance',
  cost: ['ai'],
  estimate: '~40s',
  async run(ctx) {
    const a = pricePoint(ctx.rng);
    const dealer = a.price_ngn + 2000;
    const u1 = page(ctx, `official-${ctx.token.toLowerCase()}`, 'Official price list', [`${a.product}: ${naira(a.price_ngn)} ${simMark(ctx.token)}`]);
    const u2 = page(ctx, `dealer-${ctx.token.toLowerCase()}`, 'Dealer offers', [`${a.product}: ${naira(dealer)}`]);
    const task = await startTask(ctx, twoPages(u1, u2, ' The official price list is the authoritative source; the dealer page may differ.'));
    const done = await settled(ctx, task.id, 'the task to finish');
    const values = await tasksApi.values(task.id);
    const price = values.find((v) => v.field === 'price_ngn');
    return [
      expectEqual('The task finished', 'done', done.status),
      expectEqual('The official price was chosen', a.price_ngn, price?.value),
      expectTrue('…by the authoritative-source rule', price?.resolution?.rule === 'authoritative source', 'rule: authoritative source', price?.resolution),
      expectTrue('…with the dealer\'s price kept as the alternative', Boolean(price?.resolution?.alternatives.some((x) => Number(x.value) === dealer)), dealer, price?.resolution?.alternatives),
    ];
  },
};

export const EXTRACTION_SCENARIOS = [mergeCorroborated, conflictUnresolved, conflictAuthoritative];
