'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  DownloadIcon,
  PencilIcon,
  RotateCcwIcon,
  XCircleIcon } from
'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { Artifact, Delivery, TaskDetail } from '@/lib/types';
import { Deliveries } from './Deliveries';
import { isTerminal } from '@/lib/types';
import { bytes } from '@/utils/format';
import { iconFor } from '@/components/views/Artifacts';

/**
 * A heading a person can read. The code stays beside it, small, for whoever
 * has to look it up.
 */
const FAILURE_TITLES: Record<string, string> = {
  AI_PROVIDER_UNAVAILABLE: 'The AI service is unavailable',
  AI_GATEWAY_UNREACHABLE: 'The AI service could not be reached',
  AI_GATEWAY_UNCONFIGURED: 'The AI service is not set up',
  AI_PROVIDER_ERROR: 'The AI provider refused the request',
  AI_GATEWAY_REJECTED: 'The AI service refused the request',
  RUNNER_CRASHED: 'Something went wrong on our side',
  NO_USABLE_PROPOSAL: 'The AI could not decide on a next step',
  MODEL_DECLARED_FAILURE: 'The AI judged the task could not be done',
  OBJECTIVE_NOT_MET: 'It did not achieve what you asked'
};

export const failureTitle = (code?: string | null) => code && FAILURE_TITLES[code] || 'The task did not finish';

const WAITING: Partial<Record<TaskDetail['status'], string>> = {
  waiting_for_review: 'The plan is ready. Review it above — choose how each step runs — then press Run.',
  waiting_for_approval: 'It is waiting for you to approve an action.',
  waiting_for_input: 'It is waiting for you — see the request above.',
  waiting_for_device: 'It is waiting for your computer to come online.',
  waiting_for_event: 'It is waiting for an event to arrive at one of your triggers — or stop waiting on the step to go on without it.',
  waiting_for_budget: 'It reached its spending limit. Raise the budget to let it continue.',
  paused: 'It is paused. Resume it to carry on.',
  queued: 'It is queued and will start shortly.',
  planning: 'It is working out a plan.'
};

/* ---------------------------------------------------------------------------
 * Previews
 * ------------------------------------------------------------------------ */

const PREVIEW_ROWS = 20;
const previewable = (a: Artifact) => {
  const name = (a.filename || '').toLowerCase();
  const mime = (a.mime || '').toLowerCase();
  return (a.bytes ?? 0) <= 2 * 1024 * 1024 && (
  /^text\/|json|csv|markdown/.test(mime) || /\.(csv|txt|md|json)$/.test(name));
};
const isCsv = (a: Artifact) => /csv/.test(a.mime || '') || /\.csv$/i.test(a.filename || '');

/** CSV, quotes and embedded commas included. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else
      if (c === '"') quoted = false;else
      cell += c;
    } else if (c === '"') quoted = true;else
    if (c === ',') { row.push(cell); cell = ''; } else
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

function FilePreview({ taskId, artifact }: {taskId: string;artifact: Artifact;}) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    tasksApi.artifactText(taskId, artifact.id).
    then((r) => { if (alive) setText(r.text); }).
    catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [taskId, artifact.id]);

  if (failed) return <p className="px-4 py-3 text-[12px] text-ink-500">The preview could not be loaded — download the file instead.</p>;
  if (text === null) return <div className="h-20 animate-pulse bg-canvas" aria-label="Loading preview" />;

  if (isCsv(artifact)) {
    const [head, ...body] = parseCsv(text);
    if (!head) return <p className="px-4 py-3 text-[12px] text-ink-500">The file is empty.</p>;
    const shown = body.slice(0, PREVIEW_ROWS);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-canvas">
            <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2 font-semibold text-ink-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((r, i) =>
            <tr key={i}>{head.map((_, j) =>
              <td key={j} className={`whitespace-nowrap px-4 py-2 text-ink-900 ${/^-?[\d,.]+$/.test(r[j] || '') ? 'tabular text-right' : ''}`}>{r[j] ?? ''}</td>)}
              </tr>
            )}
          </tbody>
        </table>
        {body.length > shown.length &&
        <p className="border-t border-line px-4 py-2 text-[11px] text-ink-500">Showing {shown.length} of {body.length} rows.</p>
        }
      </div>);

  }
  return (
    <pre className="max-h-64 overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-700">
      {text.length > 4000 ? `${text.slice(0, 4000)}\n…` : text}
    </pre>);

}

/* ---------------------------------------------------------------------------
 * The card
 * ------------------------------------------------------------------------ */

function Files({ task }: {task: TaskDetail;}) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(() => task.artifacts.find(previewable)?.id ?? null);
  if (!task.artifacts.length) return null;

  const download = async (a: Artifact) => {
    setError(null);
    try {
      await tasksApi.download(task.id, a.id, a.filename || a.kind);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not download that file.');
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-[12px] font-semibold text-ink-700">
        {task.artifacts.length === 1 ? 'The file it produced' : `The ${task.artifacts.length} files it produced`}
      </h3>
      {error && <p role="alert" className="mt-2 text-[12px] text-danger-700">{error}</p>}
      <ul className="mt-2 space-y-2">
        {task.artifacts.map((a) => {
          const Icon = iconFor(a);
          const canPreview = previewable(a);
          return (
            <li key={a.id} className="overflow-hidden rounded-lg border border-line bg-panel">
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="h-4 w-4 shrink-0 text-ink-500" strokeWidth={1.9} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12px] font-medium text-ink-900">{a.filename || a.kind}</p>
                  <p className="text-[11px] text-ink-500">{a.bytes !== null ? bytes(Number(a.bytes)) : a.kind}</p>
                </div>
                {canPreview &&
                <button
                  type="button"
                  onClick={() => setOpen(open === a.id ? null : a.id)}
                  aria-expanded={open === a.id}
                  className="cursor-pointer rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">

                    {open === a.id ? 'Hide preview' : 'Preview'}
                  </button>
                }
                <button
                  type="button"
                  onClick={() => download(a)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-ink-800">

                  <DownloadIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Download
                </button>
              </div>
              {open === a.id && <div className="border-t border-line"><FilePreview taskId={task.id} artifact={a} /></div>}
            </li>);

        })}
      </ul>
    </div>);

}

/**
 * What the task came to — the first thing on the page, because it is the
 * reason the task exists. Done: the result in words and the files. Failed:
 * why, and the way to try again. Running: where it is, and what it waits for.
 */
export function TaskOutcome({ task, onRetry, deliveries = [], deliveryTo = null, onDeliveriesChanged = () => {} }: {
  task: TaskDetail;
  onRetry: (mode: 'retry' | 'edit') => void;
  deliveries?: Delivery[];
  /** The endpoint's name, when the task sends its result on finishing. */
  deliveryTo?: string | null;
  onDeliveriesChanged?: () => void;
}) {
  const sent = <Deliveries taskId={task.id} deliveries={deliveries} pendingTo={deliveryTo} onChanged={onDeliveriesChanged} />;
  const retryButtons =
  <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => onRetry('retry')}
    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-[13px] font-medium text-white hover:bg-ink-800">
        <RotateCcwIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Retry
      </button>
      <button type="button" onClick={() => onRetry('edit')}
    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas">
        <PencilIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Edit and retry
      </button>
    </div>;


  // What code counted against the contract (phase 1) — shown with the result,
  // because the status came from it.
  const m = task.measured;
  const counted = m ?
  <div className="mt-3 rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] text-ink-700">
      <p>
        <span className="font-semibold text-ink-900">{m.found}{m.expected ? ` of ${m.expected}` : ''}</span> found
        {m.dropped ? ` · ${m.dropped} dropped for a missing required value` : ''}
        {` · ${m.succeeded} step${m.succeeded === 1 ? '' : 's'} done`}{m.partial ? `, ${m.partial} partly` : ''}{m.failed ? `, ${m.failed} failed` : ''}{m.not_attempted ? `, ${m.not_attempted} not run` : ''}
      </p>
      {m.missing.length > 0 && <p className="mt-0.5">Not found: {m.missing.join(', ')}</p>}
      {m.reason && m.status !== 'done' && <p className="mt-0.5 text-ink-500">{m.reason}</p>}
    </div> :
  null;

  if (task.status === 'partial') {
    return (
      <section className="rounded-xl border border-warn-100 bg-panel p-5 shadow-panel">
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-warn-600" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink-900">Partly done</h2>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ink-800">
              {task.outcome?.summary || 'It found some of what was asked. What it found is kept below.'}
            </p>
            {counted}
            <Files task={task} />
            {sent}
            {retryButtons}
          </div>
        </div>
      </section>);

  }

  if (task.status === 'done') {
    return (
      <section className="rounded-xl border border-ok-100 bg-panel p-5 shadow-panel">
        <div className="flex items-start gap-3">
          <CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-ok-600" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink-900">Result</h2>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ink-800">
              {task.outcome?.summary || 'Finished. No summary was recorded for this task.'}
            </p>
            {counted}
            <Files task={task} />
            {sent}
          </div>
        </div>
      </section>);

  }

  if (task.status === 'failed' || task.status === 'cancelled') {
    const cancelled = task.status === 'cancelled';
    return (
      <section className={`rounded-xl border bg-panel p-5 shadow-panel ${cancelled ? 'border-line' : 'border-danger-100'}`}>
        <div className="flex items-start gap-3">
          {cancelled ?
          <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" strokeWidth={2} /> :
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" strokeWidth={2} />}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink-900">
              {cancelled ? 'Cancelled' : failureTitle(task.error?.code)}
              {!cancelled && task.error?.code &&
              <span className="ml-2 font-mono text-[10px] font-normal text-ink-400">{task.error.code}</span>
              }
            </h2>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-800">
              {task.error?.message || (cancelled ? 'It was stopped before it finished.' : 'It stopped without saying why.')}
            </p>
            {!cancelled && counted}
            <Files task={task} />
            {sent}
            {retryButtons}
          </div>
        </div>
      </section>);

  }

  // Still going, or waiting on something.
  const running = task.steps.filter((s) => s.status === 'running');
  const doneCount = task.steps.filter((s) => s.status === 'done').length;
  return (
    <section className="rounded-xl border border-brand-100 bg-panel p-5 shadow-panel">
      <div className="flex items-start gap-3">
        <CircleDashedIcon className={`mt-0.5 h-5 w-5 shrink-0 text-brand-600 ${isTerminal(task.status) ? '' : 'animate-spin [animation-duration:3s]'}`} strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-ink-900">
            {task.steps.length ? `In progress — ${doneCount} of ${task.steps.length} steps done` : 'Getting started'}
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-800">
            {task.status === 'paused' && task.resume_at ?
            `The AI service isn’t answering right now, so it’s waiting rather than failing. It will try again at ${new Date(task.resume_at).toLocaleTimeString()}${task.ai_waits && task.ai_waits > 1 ? ` (wait ${task.ai_waits})` : ''} — or press Resume to try now.` :
            WAITING[task.status] || (running.length ?
            `Now: ${running.map((s) => s.title).join('; ')}.` :
            'Deciding the next step.')}
          </p>
          {task.status === 'waiting_for_approval' &&
          <Link href="/app/approvals" className="mt-3 inline-block text-[13px] font-medium text-brand-700 hover:text-brand-500">Review it in Approvals →</Link>
          }
          <Files task={task} />
            {sent}
        </div>
      </div>
    </section>);

}
