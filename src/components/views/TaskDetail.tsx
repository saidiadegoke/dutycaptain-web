'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
  AlertTriangleIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { ProgressBar } from '@/components/ProgressBar';
import { CapabilityTag, TaskStatusBadge, StepStatusBadge } from '@/components/StatusBadge';
import { tasksApi, ApiError } from '@/lib/api';
import type { Observation, Step, TaskDetail as TaskDetailType } from '@/lib/types';
import { isActive, isSuspended, isTerminal } from '@/lib/types';
import { pct } from '@/utils/format';

/**
 * Task detail (P1-15).
 *
 * Shows the plan and each step's OBSERVATION, which is the whole point of §6's
 * typed contract: a step that reported `{ count: 412 }` can be rendered as a
 * fact, where "Success" could only ever be rendered as the word Success.
 *
 * The live event timeline is P1-16; this page polls while a task is working so
 * it is not stale in the meantime.
 */
export function TaskDetail() {
  const params = useParams();
  const taskId = String(params.taskId);

  const [task, setTask] = useState<TaskDetailType | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState('loading');
    try {
      setTask(await tasksApi.get(taskId));
      setState('ready');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
      setState('error');
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!task || !isActive(task.status)) return undefined;
    const timer = setInterval(() => load(true), 3000);
    return () => clearInterval(timer);
  }, [task, load]);

  async function control(verb: 'pause' | 'resume' | 'cancel') {
    setBusy(verb);
    setActionError(null);
    try {
      setTask({ ...(task as TaskDetailType), ...(await tasksApi.control(taskId, verb)) });
      // The status the API returns is the status now; the rest of the page
      // catches up on the next poll.
      load(true);
    } catch (err) {
      // A 409 here is informative, not a bug — the orchestrator's message says
      // which moves are legal from where the task actually is.
      setActionError(err instanceof ApiError ? err.message : 'That did not work.');
    } finally {
      setBusy(null);
    }
  }

  if (state === 'loading') {
    return <p className="mx-auto max-w-[1400px] text-[13px] text-ink-500">Loading task…</p>;
  }
  if (state === 'error' || !task) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Link href="/app/tasks" className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-900">
          <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2} /> All tasks
        </Link>
        <p className="mt-6 text-[13px] font-medium text-danger-700">{error}</p>
      </div>);

  }

  const done = task.steps.filter((s) => s.status === 'done').length;
  const progress = pct(done, task.steps.length);
  const canPause = isActive(task.status);
  const canResume = isSuspended(task.status) && task.status !== 'waiting_for_approval';
  const canCancel = !isTerminal(task.status);

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link href="/app/tasks" className="inline-flex items-center gap-1 text-[12px] text-ink-500 transition-colors duration-150 ease-out hover:text-ink-900">
        <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2} />
        All tasks
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <TaskStatusBadge status={task.status} />
            <span className="font-mono text-[11px] text-ink-400">{task.id}</span>
          </div>
          <h1 className="mt-2 max-w-3xl text-[22px] font-semibold leading-snug tracking-tight text-ink-900">
            “{task.objective}”
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canPause &&
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => control('pause')}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas disabled:opacity-60">
            
              <PauseIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {busy === 'pause' ? 'Pausing…' : 'Pause'}
            </button>
          }
          {canResume &&
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => control('resume')}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-60">
            
              <PlayIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {busy === 'resume' ? 'Resuming…' : 'Resume'}
            </button>
          }
          {canCancel &&
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => control('cancel')}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas disabled:opacity-60">
            
              <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {busy === 'cancel' ? 'Cancelling…' : 'Cancel'}
            </button>
          }
        </div>
      </div>

      {actionError &&
      <p role="alert" className="mt-3 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn-700">
          {actionError}
        </p>
      }

      {task.status === 'waiting_for_approval' &&
      <p className="mt-3 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn-700">
          This task is waiting for an approval. Approvals arrive in Phase 3 — until then it
          can only be cancelled.
        </p>
      }

      {task.error?.message &&
      <div className="mt-3 flex items-start gap-2 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5">
          <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-700" strokeWidth={2.2} />
          <div>
            <p className="text-[12px] font-medium text-danger-700">
              {task.error.code || 'Failed'}
            </p>
            <p className="mt-0.5 text-[12px] text-danger-700">{task.error.message}</p>
          </div>
        </div>
      }

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel
            title="Plan"
            description={
            task.steps.length ?
            `${done} of ${task.steps.length} steps complete` :
            'The runtime has not proposed a step yet'
            }>
            
            {task.steps.length > 0 &&
            <div className="mb-4">
                <ProgressBar
                value={progress}
                tone={task.status === 'failed' ? 'warn' : task.status === 'done' ? 'ok' : 'brand'}
                label="Task progress" />
              
              </div>
            }

            {task.steps.length === 0 ?
            <p className="py-6 text-center text-[12px] text-ink-500">
                Nothing yet — the first decision turn is on its way.
              </p> :

            <ol className="space-y-2.5">
                {task.steps.map((step) =>
              <StepRow key={step.id} step={step} />
              )}
              </ol>
            }
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Summary" description="What the runtime recorded">
            <dl className="space-y-3 text-[12px]">
              <Row label="Plan version" value={String(task.plan_version)} />
              <Row label="Created" value={new Date(task.created_at).toLocaleString()} />
              <Row
                label="Started"
                value={task.started_at ? new Date(task.started_at).toLocaleString() : 'not yet'} />
              
              <Row
                label="Finished"
                value={task.finished_at ? new Date(task.finished_at).toLocaleString() : '—'} />
              
              <Row
                label="Spend"
                value={`$${task.steps.
                reduce((sum, s) => sum + (s.cost_usd || 0), 0).
                toFixed(4)}`} />
              
            </dl>
          </Panel>

          <Panel
            title="Artifacts"
            description={task.artifacts.length ? `${task.artifacts.length} produced` : 'None yet'}>
            
            {task.artifacts.length === 0 ?
            <p className="py-4 text-center text-[12px] text-ink-500">
                Files a step produces appear here.
              </p> :

            <ul className="space-y-2">
                {task.artifacts.map((a) =>
              <li key={a.id} className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="truncate text-ink-900">{a.filename || a.kind}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-400">
                      {a.bytes ? `${Math.round(a.bytes / 1024)} KB` : a.kind}
                    </span>
                  </li>
              )}
              </ul>
            }
          </Panel>
        </div>
      </div>
    </div>);

}

function Row({ label, value }: {label: string;value: string;}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="tabular text-right text-ink-900">{value}</dd>
    </div>);

}

/**
 * One step, with what it actually observed.
 *
 * The observation is rendered rather than summarised away: §6's whole argument
 * is that the structured object — not a prose summary — is what the task
 * learned, and a UI that shows only the one-line summary throws away the part
 * the verifier and the next decision turn both rely on.
 */
function StepRow({ step }: {step: Step;}) {
  const [open, setOpen] = useState(false);
  const obs = step.observation as Observation | null;

  return (
    <li className="rounded-lg border border-line bg-canvas">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left">
        
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StepStatusBadge status={step.status} />
            <CapabilityTag capability={step.capability} runtime={step.runtime} />
            {step.attempt > 1 &&
            <span className="text-[10px] text-ink-400">attempt {step.attempt}</span>
            }
          </div>
          <p className="mt-1.5 truncate text-[13px] font-medium text-ink-900">{step.title}</p>
          {obs?.summary &&
          <p className="mt-0.5 truncate text-[12px] text-ink-500">{obs.summary}</p>
          }
        </div>
        <span className="shrink-0 pt-1 text-[11px] text-ink-400">
          {obs ? (open ? 'Hide' : 'Detail') : ''}
        </span>
      </button>

      {open && obs &&
      <div className="border-t border-line px-3.5 py-3">
          {obs.error &&
        <p className="mb-2 text-[12px] text-danger-700">
              <span className="font-medium">{obs.error.code}</span> — {obs.error.message}
              {obs.error.retryable && <span className="text-ink-500"> (retryable)</span>}
            </p>
        }
          <pre className="max-h-72 overflow-auto rounded bg-panel p-3 font-mono text-[11px] leading-relaxed text-ink-700">
            {JSON.stringify(obs.data, null, 2)}
          </pre>
          <p className="mt-2 text-[11px] text-ink-400">
            {obs.runtime} · {obs.durationMs}ms
            {step.cost_usd ? ` · $${step.cost_usd.toFixed(4)}` : ''}
          </p>
        </div>
      }
    </li>);

}
