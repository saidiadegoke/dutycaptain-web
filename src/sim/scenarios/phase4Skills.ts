import { simApi, tasksApi } from '@/lib/api';
import type { Step } from '@/lib/types';
import { expectEqual, expectTrue, fail } from '../core/checks';
import { pricePoint, simMark } from '../core/generators';
import type { RunContext, Scenario } from '../core/types';
import { settled } from './_helpers';

/**
 * Phase 4 · skills (plan §6.5): the right tool for a kind of job, found by
 * code where the file decides it — a workbook read by read.xlsx, a Word file
 * by read.docx, a photo by OCR — and by the planner where the job decides it
 * (reconciling two tables, summarising a report). Files are uploaded the way
 * a person uploads them; the samples are made by the skills image itself.
 */

const GROUP = 'Phase 4 · Skills';
const noSkills = (ctx: RunContext) => (ctx.health.skills?.available ? undefined : `the skills sandbox is not available here (${ctx.health.skills?.mode || 'docker'}: ${ctx.health.skills?.image || '?'})`);

async function attachSample(ctx: RunContext, objective: string, sample: Parameters<typeof simApi.sample>[0], name: string, start = false) {
  const file = await simApi.sample(sample);
  const task = await tasksApi.create(`${objective} ${simMark(ctx.token)}`, { start: false, budget: { caps: { usd: 0.05, steps: 6 } } });
  ctx.link('Open the task', `/app/tasks/${task.id}`);
  const out = await tasksApi.addAttachment(task.id, new File([file.bytes], name, { type: file.mime }));
  if (start) await tasksApi.start(task.id);
  return { task, attachment: out.attachment };
}

export const workbookRead: Scenario = {
  id: 'skills.workbook-read',
  group: GROUP,
  title: 'An attached workbook is read by read.xlsx — chosen by its type',
  summary: 'A price list workbook is attached. It is read at once by the spreadsheet skill (no model asked), its rows become searchable text, and the choice is recorded.',
  exercises: 'addAttachment → route.readerFor(.xlsx) → skills image read_xlsx.py → source passages',
  cost: ['free'],
  estimate: '~6s',
  skipIf: noSkills,
  async run(ctx) {
    const rows = Array.from({ length: 5 }, () => pricePoint(ctx.rng));
    const { task, attachment } = await attachSample(ctx, 'Check the attached price list', { kind: 'xlsx', rows }, `prices-${ctx.token.toLowerCase()}.xlsx`);
    const src = (await tasksApi.sources(task.id)).find((s) => s.kind === 'attachment');
    const checks = [
      expectEqual('Read by the spreadsheet skill', 'read.xlsx', attachment.read_by),
      expectTrue('…and it says why', Boolean(attachment.read_reason?.includes('.xlsx')), '".xlsx files are read by read.xlsx"', attachment.read_reason),
      expectTrue('Its text was kept, with the prices in it', Boolean(attachment.text_path) && Boolean(attachment.preview?.includes(String(rows[0].price_ngn))), `a preview containing ${rows[0].price_ngn}`, attachment.preview),
      expectTrue('…as searchable passages', (src?.versions[0]?.passages || 0) > 0, '> 0 passages', src?.versions[0]?.passages),
    ];
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const wordRead: Scenario = {
  id: 'skills.word-read',
  group: GROUP,
  title: 'An attached Word document is read with its headings and tables',
  summary: 'A brief in Word is attached; read.docx keeps its headings and its table rows.',
  exercises: 'addAttachment → read.docx (python-docx)',
  cost: ['free'],
  estimate: '~5s',
  skipIf: noSkills,
  async run(ctx) {
    const pp = pricePoint(ctx.rng);
    const md = `# Supply brief ${ctx.token}\n\nPlease check these prices.\n\n| item | price |\n|---|---|\n| ${pp.product} | ${pp.price_ngn} |`;
    const { task, attachment } = await attachSample(ctx, 'Read the attached brief', { kind: 'docx', markdown: md }, `brief-${ctx.token.toLowerCase()}.docx`);
    const checks = [
      expectEqual('Read by the Word skill', 'read.docx', attachment.read_by),
      expectTrue('The heading is kept', Boolean(attachment.preview?.includes(`## Supply brief ${ctx.token}`)), `## Supply brief ${ctx.token}`, attachment.preview),
      expectTrue('The table row is kept', Boolean(attachment.preview?.includes(String(pp.price_ngn))), `a row with ${pp.price_ngn}`, attachment.preview),
    ];
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const receiptOcr: Scenario = {
  id: 'skills.receipt-ocr',
  group: GROUP,
  title: 'A receipt photo is read by OCR',
  summary: 'A photo of a receipt is attached; it is read by the OCR skill, and its total is in the text.',
  exercises: 'addAttachment → route.readerFor(.png) → ocr.read (tesseract)',
  cost: ['free'],
  estimate: '~6s',
  skipIf: noSkills,
  async run(ctx) {
    const total = ctx.rng.int(12, 95) * 500;
    const { task, attachment } = await attachSample(ctx, 'Log the attached receipt', { kind: 'receipt', text: `TOTAL NGN ${total}` }, `receipt-${ctx.token.toLowerCase()}.png`);
    const digits = String(attachment.preview || '').replace(/\D/g, '');
    const checks = [
      expectEqual('Read by OCR', 'ocr.read', attachment.read_by),
      expectTrue('The total is in the text', digits.includes(String(total)), total, attachment.preview),
    ];
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const reconcileInTask: Scenario = {
  id: 'skills.reconcile',
  group: GROUP,
  title: 'A statement reconciled against a ledger — in code, with counts that add up',
  summary: 'Two CSVs are attached and the task is asked what does not match. The planner picks table.reconcile; the result lists what is only on each side and what differs, exactly.',
  exercises: 'planner → table.reconcile (pandas) → check: counts add up',
  cost: ['ai'],
  estimate: '~40s',
  skipIf: noSkills,
  async run(ctx) {
    const statement = 'ref,amount\nA1,5000\nA2,7000\nA3,900\nA5,4400\n';
    const ledger = 'ref,amount\nA1,5000\nA2,7500\nA4,1200\nA5,4400\n';
    const task = await tasksApi.create(`Compare the attached statement against the ledger on ref, comparing amount, and list what does not match. ${simMark(ctx.token)}`, { start: false, budget: { caps: { usd: 0.05, steps: 5 } } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    await tasksApi.addAttachment(task.id, new File([statement], 'statement.csv', { type: 'text/csv' }));
    await tasksApi.addAttachment(task.id, new File([ledger], 'ledger.csv', { type: 'text/csv' }));
    await tasksApi.start(task.id);
    const done = await settled(ctx, task.id, 'the task to finish');
    const step = done.steps.find((s: Step) => s.capability === 'table.reconcile');
    const counts = (step?.observation?.data as { counts?: Record<string, number> } | undefined)?.counts;
    return [
      step ? expectEqual('The planner chose the reconcile skill, and it ran', 'done', step.status) : fail('The planner chose table.reconcile', 'a table.reconcile step', done.steps.map((s) => s.capability)),
      expectEqual('Exact counts', { left: 4, right: 4, matched: 3, only_left: 1, only_right: 1, mismatched: 1 }, counts),
      expectEqual('The task finished', 'done', done.status),
    ];
  },
};

export const summarizeReport: Scenario = {
  id: 'skills.summarize',
  group: GROUP,
  title: 'A report summarised, every claim cited, with how much was read',
  summary: 'A Word report is attached and a short briefing asked for. text.summarize reads every passage, and each sentence cites the passages it rests on.',
  exercises: 'read.docx → text.summarize (map/reduce) → citations checked in code → coverage',
  cost: ['ai'],
  estimate: '~45s',
  skipIf: noSkills,
  async run(ctx) {
    const md = [
      `# Market report ${ctx.token}`,
      '## Findings', 'Garri prices rose twelve percent in Ibadan between June and September.',
      '## Causes', 'Transport costs doubled after the fuel price change in July.',
      '## Outlook', 'Traders expect prices to ease after the November harvest.',
    ].join('\n\n');
    const { task } = await attachSample(ctx, 'Use text.summarize to write an 80-word briefing of the attached report, citing it', { kind: 'docx', markdown: md }, `report-${ctx.token.toLowerCase()}.docx`, true);
    const done = await settled(ctx, task.id, 'the task to finish');
    const step = done.steps.find((s: Step) => s.capability === 'text.summarize');
    const data = (step?.observation?.data || {}) as { summary?: string; citations?: unknown[]; coverage?: { passages_read?: number; passages_total?: number }; uncited?: number };
    return [
      step ? pass2('It used text.summarize') : fail('It used text.summarize', 'a text.summarize step', done.steps.map((s) => s.capability)),
      expectTrue('A summary with citations', Boolean(data.summary) && (data.citations || []).length > 0, 'a summary and ≥1 citation', { citations: (data.citations || []).length }),
      expectTrue('Every passage was read', Boolean(data.coverage && data.coverage.passages_read === data.coverage.passages_total), 'passages_read = passages_total', data.coverage),
      expectEqual('No sentence without a checked citation', 0, data.uncited),
    ];
  },
};

function pass2(name: string) {
  return { name, status: 'pass' as const };
}

export const brokenWorkbook: Scenario = {
  id: 'skills.broken-workbook',
  group: GROUP,
  title: 'A broken workbook is marked unreadable, with the reason',
  summary: 'A file named .xlsx that is not a workbook is attached. The spreadsheet skill is chosen, fails, and the attachment is kept and marked unreadable with why; nothing else breaks.',
  exercises: 'addAttachment → read.xlsx fails → unreadable recorded',
  cost: ['free'],
  estimate: '~4s',
  skipIf: noSkills,
  async run(ctx) {
    const task = await tasksApi.create(`Check the attached workbook ${simMark(ctx.token)}`, { start: false, budget: { caps: { usd: 0.05, steps: 6 } } });
    ctx.link('Open the task', `/app/tasks/${task.id}`);
    const junk = new TextEncoder().encode(`not a workbook ${ctx.token} `.repeat(40));
    const out = await tasksApi.addAttachment(task.id, new File([junk], `broken-${ctx.token.toLowerCase()}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const checks = [
      expectTrue('Kept, and marked unreadable with a reason', Boolean(out.attachment.unreadable), 'a reason', out.attachment.unreadable),
      expectEqual('…the same size as uploaded', junk.length, out.attachment.bytes),
    ];
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const oldWorkbookRead: Scenario = {
  id: 'skills.old-xls-read',
  group: GROUP,
  title: 'An old Excel 97–2003 .xls is read like any workbook',
  summary: 'A ledger saved as .xls is attached. It is read by the spreadsheet skill (xlrd, in the skills image): three lines with their dates and amounts, ₦245,500 in all.',
  exercises: 'addAttachment → route.readerFor(.xls) → read_xlsx.py (xlrd) → source passages',
  cost: ['free'],
  estimate: '~6s',
  skipIf: noSkills,
  async run(ctx) {
    const { task, attachment } = await attachSample(ctx, 'Check the attached ledger', { kind: 'xls' }, `ledger-${ctx.token.toLowerCase()}.xls`);
    const checks = [
      expectEqual('Read by the spreadsheet skill', 'read.xlsx', attachment.read_by),
      expectTrue('Its lines were read, amounts and dates kept', Boolean(attachment.preview?.includes('185000') && attachment.preview?.includes('2026-09-01')), 'Flour 185000 on 2026-09-01', attachment.preview),
      expectTrue('…and a gas refill of 18000', Boolean(attachment.preview?.includes('18000')), '18000', attachment.preview),
    ];
    await tasksApi.control(task.id, 'cancel');
    return checks;
  },
};

export const SKILL_SCENARIOS = [workbookRead, oldWorkbookRead, wordRead, receiptOcr, brokenWorkbook, reconcileInTask, summarizeReport];
