import { tasksApi } from '@/lib/api';
import type { Step } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { Check, RunContext, Scenario } from '../core/types';
import { settled, startTask, waitForStatus } from './_helpers';

/**
 * Phase 0 · sources and provenance (plan §6.2, §6.14; migration 060): what a
 * task works from is recorded as hashed, immutable versions, and a value it
 * produces points at the exact version it came from.
 */

const GROUP = 'Phase 0 · Sources & provenance';

async function sha256(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** A page on the receiver that says exactly what the sim chose. */
function pageUrl(ctx: RunContext, name: string, page: { title: string; lines: string[] }) {
  const p = btoa(unescape(encodeURIComponent(JSON.stringify(page)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${ctx.health.self_url}/sim/receiver/${ctx.runId}/${encodeURIComponent(name)}/page?p=${p}`;
}

export const attachmentRecorded: Scenario = {
  id: 'provenance.attachment-recorded',
  group: GROUP,
  title: 'An attached file is recorded exactly as given',
  summary: 'A file is attached to a new task. It is recorded as a source whose hash matches the file byte for byte; taken back before the start, the record goes too.',
  exercises: 'POST /tasks/:id/attachments → sources.register (attachment) → GET /tasks/:id/sources',
  cost: ['free'],
  estimate: '~3s',
  async run(ctx) {
    const rows = Array.from({ length: 4 }, () => pricePoint(ctx.rng));
    const csv = `product,price_ngn,city\n${rows.map((r) => `"${r.product}",${r.price_ngn},${r.city}`).join('\n')}\n`;
    const name = `prices-${ctx.token.toLowerCase()}.csv`;
    const file = new File([csv], name, { type: 'text/csv' });
    // The New task form's own steps: create without starting, then attach.
    const task = await tasksApi.create(`Price the attached list ${simMark(ctx.token)}`, { start: false });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const { attachment } = await tasksApi.addAttachment(task.id, file);
    const expected = await sha256(await file.arrayBuffer());
    const list = await tasksApi.sources(task.id);
    const src = list.find((s) => s.kind === 'attachment' && s.locator === name);
    const checks: Check[] = [
      src ? expectEqual('Recorded as a source the person gave', ['attachment', 'user_file'], [src.kind, src.classification]) : fail('Recorded as a source', name, list),
      expectEqual('Its hash is the file\'s, byte for byte', expected, src?.versions[0]?.hash),
      expectEqual('The attachment carries the same version', expected, attachment.source?.hash),
    ];
    ctx.log('taking it back before the task starts');
    await tasksApi.removeAttachment(task.id, name);
    checks.push(expectEqual('Taken back, its record goes too', 0, (await tasksApi.sources(task.id)).length));
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const extractedValueTraced: Scenario = {
  id: 'provenance.extracted-value',
  group: GROUP,
  title: 'An extracted price points at the exact page version it came from',
  summary: 'A task fetches a market page and extracts a price. The price is right, the page is recorded as a hashed version, and the value\'s provenance names that version and the model.',
  exercises: 'http.request → sources.register · text.extract → ground() → sources[].source_id/version/hash',
  cost: ['ai'],
  estimate: '~30s',
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const url = pageUrl(ctx, `market-${ctx.token.toLowerCase()}`, {
      title: `${pp.city} market prices`,
      lines: [`Updated this morning ${simMark(ctx.token)}.`, `${pp.product}: ₦${pp.price_ngn.toLocaleString('en-NG')}`, 'Prices change daily.'],
    });
    const task = await startTask(ctx, `Use http.request to fetch ${url} , then use text.extract to get the product and its price in naira (fields: product, price_ngn). Two steps.`);
    const done = await settled(ctx, task.id, 'the task to fetch and extract');
    const list = await tasksApi.sources(task.id);
    const page = list.find((s) => s.kind === 'http');
    const extract = done.steps.find((s: Step) => s.capability === 'text.extract');
    const data = (extract?.observation?.data || {}) as {
      records?: { product?: string; price_ngn?: number }[];
      sources?: { field: string; source_id?: string; source_version?: number; source_hash?: string }[];
      provenance?: { extracted_by?: string | null; step_id?: string | null };
    };
    const cite = (data.sources || []).find((c) => c.field === 'price_ngn');
    return [
      expectEqual('The task finished', 'done', done.status),
      expectEqual('The price extracted is the one on the page', pp.price_ngn, data.records?.[0]?.price_ngn),
      page ? expectEqual('The page is recorded as one hashed version', 1, page.versions.length) : fail('The page is recorded as a source', 'an http source', list),
      expectTrue('The price names the page\'s source and version', Boolean(cite && page && cite.source_id === page.id && cite.source_hash === page.versions[0]?.hash),
        { source_id: page?.id, hash: page?.versions[0]?.hash }, cite),
      expectTrue('…and who extracted it', Boolean(data.provenance?.extracted_by) && data.provenance?.step_id === extract?.id, 'a model and this step', data.provenance),
      // Full cost accounting (phase 0): the extraction's own AI call is on the task's bill.
      expectTrue('The extraction\'s AI call is charged to the task', (await tasksApi.cost(task.id)).aiByFeature?.some((f) => f.feature === 'text.extract' && f.cost_usd > 0) === true,
        'a text.extract line with a cost', (await tasksApi.cost(task.id)).aiByFeature),
    ];
  },
};

export const personAnswerTraced: Scenario = {
  id: 'provenance.person-answer',
  group: GROUP,
  title: 'A person\'s answer is recorded as a source, with who and when',
  summary: 'A task asks you for a supplier\'s name; the sim answers. The answer is recorded as a source, and the step\'s values name it and you.',
  exercises: 'human.collect → desk.respond → sources.register (person) → data.provenance',
  cost: ['ai'],
  estimate: '~25s',
  async run(ctx) {
    const supplier = `${ctx.rng.pick(['Mama Put', 'Iya Basira', 'Chidi & Sons', 'Hausa Grains'])} Foods ${simMark(ctx.token)}`;
    const task = await startTask(ctx, 'Use human.collect to ask me for the name of our garri supplier (one field: supplier). That is the whole task.');
    const waiting = await settled(ctx, task.id, 'the task to ask you');
    const [ask] = (await tasksApi.inputRequests(task.id)).filter((r) => r.status === 'pending' && r.kind !== 'confirm');
    if (!ask) return [fail('The task asks you', 'a collect request', waiting.status)];
    const field = ask.fields[0]?.name || 'supplier';
    ctx.log(`answering: ${field} = ${supplier}`);
    await tasksApi.answerInput(task.id, ask.id, { records: [{ [field]: supplier }] });
    const done = await waitForStatus(ctx, task.id, ['done'], 'the task to finish');
    const step = done.steps.find((s: Step) => s.capability === 'human.collect');
    const prov = (step?.observation?.data as { provenance?: { kind?: string; source_id?: string; answered_by?: string } } | undefined)?.provenance;
    const person = (await tasksApi.sources(task.id)).find((s) => s.kind === 'person');
    return [
      expectEqual('The task finished', 'done', done.status),
      person ? expectEqual('Your answer is recorded as a source', `input_request:${ask.id}`, person.locator) : fail('Your answer is recorded as a source', 'a person source', 'none'),
      expectTrue('The step\'s values name that source and who answered', Boolean(prov && prov.kind === 'person' && prov.source_id === person?.id && prov.answered_by),
        { kind: 'person', source_id: person?.id }, prov),
    ];
  },
};

export const PROVENANCE_SCENARIOS = [attachmentRecorded, extractedValueTraced, personAnswerTraced];

/* ---- adversarial: a malformed source ------------------------------------ */

export const malformedFile: Scenario = {
  id: 'adversarial.malformed-file',
  group: 'Phase 0 · Adversarial',
  title: 'A broken PDF is kept, marked unreadable — nothing else breaks',
  summary: 'A corrupt PDF is attached. It is kept and recorded as a source, marked unreadable with the reason, instead of failing the upload or the task.',
  exercises: 'addAttachment → uploads.textOf (fails) → attachment.unreadable · sources',
  cost: ['free'],
  estimate: '~3s',
  async run(ctx) {
    const junk = new Uint8Array(512);
    for (let i = 0; i < junk.length; i++) junk[i] = ctx.rng.int(0, 255);
    const bytes = new Blob(['%PDF-1.4\n1 0 obj << /Type /Catalog >>\n', junk, '\n%%EOF-broken']);
    const name = `invoice-${ctx.token.toLowerCase()}.pdf`;
    const task = await tasksApi.create(`Read the attached invoice ${simMark(ctx.token)}`, { start: false });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const { attachment } = await tasksApi.addAttachment(task.id, new File([bytes], name, { type: 'application/pdf' }));
    const src = (await tasksApi.sources(task.id)).find((s) => s.locator === name);
    const checks: Check[] = [
      expectEqual('The file was kept', name, attachment.name),
      expectTrue('…marked unreadable, with the reason', Boolean(attachment.unreadable) && !attachment.text_path, 'unreadable: <reason>', { unreadable: attachment.unreadable, text_path: attachment.text_path }),
      expectTrue('…and still recorded as a source', Boolean(src), `a source for ${name}`, src || 'none'),
    ];
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

PROVENANCE_SCENARIOS.push(malformedFile);
