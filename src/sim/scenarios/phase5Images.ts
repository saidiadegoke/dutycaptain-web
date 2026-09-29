import { simApi, tasksApi } from '@/lib/api';
import type { Step } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { SIM_CAPS, settled } from './_helpers';

/**
 * Phase 5 · images and scans (plan §6.7, R17; migration 067). A receipt photo
 * is a source: OCR reads it first; a poor reading is read again by a vision
 * model, the two compared number by number in code; a value neither reading
 * can vouch for is `ambiguous` — "unclear reading, confirm" — never verified.
 * The photos are made by the skills image and uploaded as a person would.
 *
 * On-device extraction (`document.extract` with `find`, R11) needs a file on
 * an enrolled computer, which a click can't place; it is proven by the
 * agent's and the API's tests.
 */

const GROUP = 'Phase 5 · Images & scans';
const noSkills = (ctx: RunContext) => (ctx.health.skills?.available ? undefined : 'the skills sandbox is not available here');
const extractStep = (steps: Step[]) => [...steps].reverse().find((s) => s.capability === 'text.extract');
type ExtractData = {
  records?: { amount?: number }[];
  states?: Record<string, string>[];
  ambiguous?: { field: string; why: string; alternatives: number[] }[];
  reread?: { name: string; by?: string; error?: string; agreement?: { numbers: number; agreed: number; disagreed: number; vision_only: number; unreadable: number } }[];
};

async function receiptTask(ctx: RunContext, total: number, degrade: boolean) {
  const photo = await simApi.sample({ kind: 'receipt', text: `TOTAL NGN ${total}`, degrade });
  const task = await tasksApi.create(`Use text.extract to get the total amount on the attached receipt (fields: item as the key — the word printed beside it — and amount, a number). ${simMark(ctx.token)}`, { start: false, budget: { caps: SIM_CAPS } });
  ctx.link('Open the task', `/app/tasks/${task.id}`);
  const { attachment } = await tasksApi.addAttachment(task.id, new File([photo.bytes], `receipt-${ctx.token.toLowerCase()}.png`, { type: photo.mime }));
  ctx.log(`attached: read by ${attachment.read_by}, quality ${attachment.read_quality}, ${attachment.unclear ?? 0} unclear word(s)`);
  await tasksApi.start(task.id);
  const done = await settled(ctx, task.id, 'the task to finish');
  const data = (extractStep(done.steps)?.observation?.data || {}) as ExtractData;
  return { attachment, done, data };
}

export const clearReceipt: Scenario = {
  id: 'images.clear-receipt',
  group: GROUP,
  title: 'A clear receipt photo: OCR alone, the total verified',
  summary: 'OCR reads the photo well, so no vision model is asked (no extra cost); the total is found by code beside "TOTAL" and verified.',
  exercises: 'attachment → ocr.read (good) → text.extract → grounding (no unclear words) → verified',
  cost: ['ai'],
  estimate: '~35s',
  skipIf: noSkills,
  async run(ctx) {
    const total = ctx.rng.int(12, 95) * 500;
    const { attachment, done, data } = await receiptTask(ctx, total, false);
    const i = (data.records || []).findIndex((r) => r.amount === total);
    return [
      expectEqual('OCR read it well', 'good', attachment.read_quality),
      expectTrue('No vision model was asked', !data.reread || data.reread.length === 0, 'no re-reading', data.reread),
      i >= 0 ? expectEqual('The total, verified', 'verified', data.states?.[i]?.amount) : fail('The total was found', total, data.records),
      expectEqual('The task finished', 'done', done.status),
    ];
  },
};

export const poorPhoto: Scenario = {
  id: 'images.poor-photo',
  group: GROUP,
  title: 'A bad photo: read again by a vision model; what OCR can\'t confirm is "unclear — confirm"',
  summary: 'A low-resolution, speckled receipt photo that OCR reads poorly. In the task a vision model reads it again; each number is compared with what OCR read. A total OCR did not also read is delivered as an unclear reading to confirm, with why — never as verified.',
  exercises: 'ocr.read (poor) → readings.readAgain → transcribe (vision) → compare with OCR → ambiguous → partial',
  cost: ['ai'],
  estimate: '~45s',
  skipIf: noSkills,
  async run(ctx) {
    const total = ctx.rng.int(12, 95) * 500;
    const { attachment, done, data } = await receiptTask(ctx, total, true);
    const re = (data.reread || [])[0];
    const i = (data.records || []).findIndex((r) => r.amount === total);
    const state = i >= 0 ? data.states?.[i]?.amount : undefined;
    const bothRead = Boolean(re?.agreement && re.agreement.agreed > 0);
    const after = (await tasksApi.get(done.id)).attachments?.[0];
    return [
      expectEqual('OCR read it poorly', 'poor', attachment.read_quality),
      expectTrue('It was read again by a vision model, in the task', Boolean(re?.by?.includes('vision')), 'reread by: …vision', re),
      expectTrue('…once: the attachment now says so', Boolean(after?.read_by?.includes('vision')), 'read_by …vision', after?.read_by),
      expectTrue('The vision model read the total', i >= 0, total, data.records),
      expectTrue('Verified only if OCR read the same number; otherwise "unclear — confirm"', state === (bothRead ? 'verified' : 'ambiguous'), bothRead ? 'verified (both readings agree)' : 'ambiguous', { state, agreement: re?.agreement }),
      bothRead ? expectEqual('The task finished', 'done', done.status) : expectTrue('…with why', Boolean(data.ambiguous?.[0]?.why), 'a reason, e.g. "read by the vision model only"', data.ambiguous),
    ];
  },
};

export const IMAGE_SCENARIOS = [clearReceipt, poorPhoto];
