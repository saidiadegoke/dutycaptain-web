'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
  AlertTriangleIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { RetryDialog } from '@/components/views/RetryDialog';
import { SearchRequestCard } from '@/components/SearchRequestCard';
import { TaskTimeline } from '@/components/TaskTimeline';
import { PlanHistory } from '@/components/PlanHistory';
import { ModelContext } from '@/components/ModelContext';
import { BudgetPanel } from '@/components/BudgetPanel';
import { AuditChain } from '@/components/AuditChain';
import { CostPanel } from '@/components/CostPanel';
import { ProgressBar } from '@/components/ProgressBar';
import { CapabilityTag, TaskStatusBadge, StepStatusBadge } from '@/components/StatusBadge';
import { tasksApi, ApiError } from '@/lib/api';
import { useTaskTimeline } from '@/lib/useTaskTimeline';
import type { Observation, SearchRequest, Step, TaskDetail as TaskDetailType } from '@/lib/types';
import { ShieldCheckIcon, ShieldAlertIcon, RotateCwIcon, ArrowUpRightIcon,
  PencilIcon,
  RotateCcwIcon
} from 'lucide-react';
import { isActive, isSuspended, isTerminal } from '@/lib/types';
import { pct } from '@/utils/format';

/**
 * Task detail (P1-15).
 *
 * Shows the plan and each step's OBSERVATION, which is the whole point of §6's
 * typed contract: a step that reported `{ count: 412 }` can be rendered as a
 * fact, where "Success" could only ever be rendered as the word Success.
 *
 * THE PAGE IS DRIVEN BY THE EVENT LOG (P1-16), not by a timer. The timeline
 * panel renders the stream and nothing else; the rest of the page refetches
 * when the stream says something happened. A 3-second poll was what this did
 * before, and it was both slower to show a change and busier when nothing was
 * changing.
 *
 * A slow poll survives only for the case where the stream is NOT connected —
 * reconnecting, or ended while the task is still active. Without it a dropped
 * connection would freeze the page silently, which is worse than a poll.
 */
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
  MODEL_DECLARED_FAILURE: 'The AI judged the task could not be done'
};

function failureTitle(code?: string | null) {
  return (code && FAILURE_TITLES[code]) || 'The task failed';
}

export function TaskDetail() {
  const params = useParams();
  const taskId = String(params.taskId);

  const [task, setTask] = useState<TaskDetailType | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryMode, setRetryMode] = useState<'retry' | 'edit' | null>(null);
  const [searches, setSearches] = useState<SearchRequest[]>([]);
  const router = useRouter();

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

  // Searches waiting for the owner: read whenever the task is paused for one.
  const status = task?.status;
  useEffect(() => {
    if (status !== 'waiting_for_input') {
      setSearches([]);
      return;
    }
    tasksApi.searchRequests(taskId).
    then((all) => setSearches(all.filter((r) => r.status === 'pending'))).
    catch(() => setSearches([]));
  }, [status, taskId]);

  const { events, state: streamState, error: streamError } = useTaskTimeline(taskId);
  const lastSeq = events.length ? events[events.length - 1].seq : 0;
  const seenSeq = useRef(0);

  // Refetch when the log moves. Debounced, because a decision turn writes
  // several events in quick succession (`step.proposed`, `policy.decided`,
  // `step.started`, `observation`) and the task only needs reading once after
  // the burst — the useful state is the one at the end of it.
  useEffect(() => {
    if (lastSeq === 0 || lastSeq === seenSeq.current) return undefined;
    seenSeq.current = lastSeq;
    const timer = setTimeout(() => load(true), 250);
    return () => clearTimeout(timer);
  }, [lastSeq, load]);

  // The fallback, and only for a task that is still going with no stream on it.
  const streamLive = streamState === 'live' || streamState === 'loading';
  useEffect(() => {
    if (!task || !isActive(task.status) || streamLive) return undefined;
    const timer = setInterval(() => load(true), 10000);
    return () => clearInterval(timer);
  }, [task, streamLive, load]);

  async function control(verb: 'pause' | 'resume' | 'cancel') {
    setBusy(verb);
    setActionError(null);
    try {
      setTask({ ...(task as TaskDetailType), ...(await tasksApi.control(taskId, verb)) });
      // The status the API returns is the status now. The rest of the page
      // catches up when the control verb's own event reaches the stream — the
      // refetch below is so the button stops looking dead in the meantime.
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
  // How wide the graph actually got. A plan is a DAG from P2-01 on, and a flat
  // list of rows would render two steps that ran simultaneously exactly like
  // two that ran one after the other — which is the one thing the plan view
  // must not do now that the scheduler really does run them together.
  const concurrent = widestOverlap(task.steps);
  const progress = pct(done, task.steps.length);
  const canPause = isActive(task.status);
  // Neither an approval nor a budget is resumed past: one is decided, the other
  // is raised. Offering a Resume button that the API answers with a 409 is a
  // button that teaches people not to trust the buttons.
  const canResume = isSuspended(task.status)
  && task.status !== 'waiting_for_approval'
  && task.status !== 'waiting_for_budget';
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

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setRetryMode('retry')}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas disabled:opacity-60">
            
            <RotateCcwIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Retry
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setRetryMode('edit')}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas disabled:opacity-60">
            
            <PencilIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Edit and retry
          </button>
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

      {((task.attempt ?? 1) > 1 || (task.retries && task.retries.length > 0)) &&
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-line bg-canvas px-3 py-2 text-[12px] text-ink-700">
          {(task.attempt ?? 1) > 1 &&
        <span>
              <span className="font-medium text-ink-900">Attempt {task.attempt}</span>
              {task.retry_of &&
          <>
                  {' · retry of '}
                  <Link href={`/app/tasks/${task.retry_of}`} className="text-brand-700 hover:text-brand-500">
                    attempt {(task.attempt ?? 2) - 1}
                  </Link>
                </>
          }
              {task.retry &&
          <span className="text-ink-500">
                  {task.retry.learned_from.length ?
            ` · learned from attempt${task.retry.learned_from.length > 1 ? 's' : ''} ${[...task.retry.learned_from].sort((a, b) => a - b).join(', ')}` :
            ' · started fresh'}
                  {task.retry.objective_changed ? ' · task reworded' : ''}
                </span>
          }
            </span>
        }
          {task.retries && task.retries.length > 0 &&
        <span>
              Retried as{' '}
              {task.retries.map((r, i) =>
          <span key={r.id}>
                  {i > 0 && ', '}
                  <Link href={`/app/tasks/${r.id}`} className="font-medium text-brand-700 hover:text-brand-500">
                    attempt {r.attempt}
                  </Link>
                  <span className="text-ink-500"> ({r.status.replace(/_/g, ' ')})</span>
                </span>
          )}
            </span>
        }
          {task.retry?.note &&
        <span className="basis-full text-ink-500">
              <span className="font-medium text-ink-700">Note for this attempt:</span> {task.retry.note}
            </span>
        }
        </div>
      }

      {searches.map((r) =>
      <SearchRequestCard
        key={r.id}
        taskId={task.id}
        request={r}
        onDone={() => {
          setSearches((all) => all.filter((x) => x.id !== r.id));
          load(true);
        }} />
      )}

      {retryMode &&
      <RetryDialog
        taskId={task.id}
        objective={task.objective}
        active={!isTerminal(task.status)}
        edit={retryMode === 'edit'}
        onClose={() => setRetryMode(null)}
        onRetried={(id) => {
          setRetryMode(null);
          router.push(`/app/tasks/${id}`);
        }} />
      }

      {actionError &&
      <p role="alert" className="mt-3 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn-700">
          {actionError}
        </p>
      }

      {task.status === 'waiting_for_approval' &&
      <p className="mt-3 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn-700">
          This task is waiting for your approval.{' '}
          <Link href="/app/approvals" className="font-medium underline">Review it in Approvals</Link>.
        </p>
      }

      {task.error?.message &&
      <div className="mt-3 flex items-start gap-2 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5">
          <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-700" strokeWidth={2.2} />
          <div>
            <p className="text-[12px] font-medium text-danger-700">
              {failureTitle(task.error.code)}
              {task.error.code &&
            <span className="ml-2 font-mono text-[10px] font-normal text-danger-700/70">{task.error.code}</span>
            }
            </p>
            <p className="mt-0.5 text-[12px] text-danger-700">{task.error.message}</p>
          </div>
        </div>
      }

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel
            title={task.plan_version > 1 ? `Plan · v${task.plan_version}` : 'Plan'}
            description={
            task.steps.length ?
            `${done} of ${task.steps.length} steps complete${
              concurrent > 1 ? ` · ${concurrent} ran at the same time` : ''}` :
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

          <Panel
            title="Timeline"
            description="Every event the runtime recorded, as it recorded it">
            <TaskTimeline events={events} state={streamState} error={streamError} />
          </Panel>

          <Panel
            title="Audit"
            description="Proposal → policy → approval → execution, per step">
            {/* Not a second timeline. This answers the one question a log
                cannot: did what ran match what was approved (P3-09). */}
            <AuditChain taskId={task.id} revision={lastSeq} />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel
            title="Budget"
            description={
            task.status === 'waiting_for_budget' ?
            'Reached — raise it to continue' :
            'What it may spend, and what it has'
            }>
            
            <BudgetPanel
              taskId={task.id}
              budget={task.budget}
              suspended={task.status === 'waiting_for_budget'}
              onChanged={() => load(true)} />
            
          </Panel>

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
              
              {/* From the task, not re-summed from the steps: the steps do not
                  include planning, the conclusion or the triage, so summing
                  them here reported less than the task had actually spent. The
                  Cost and time panel breaks it down. */}
              <Row label="Spend, estimated" value={`$${(task.budget.used.usd || 0).toFixed(5)}`} />
              
            </dl>
          </Panel>

          <Panel
            title="Cost and time"
            description="Where this task's money and seconds actually went">
            <CostPanel taskId={task.id} revision={lastSeq} />
          </Panel>

          <Panel
            title="What the model is told"
            description="The projection it reasons from, as stored on the last turn">
            {/* Keyed on the event cursor so it refreshes as the task moves —
                the projection is rewritten every turn, and a stale panel here
                would be describing a decision two steps ago. */}
            <ModelContext taskId={task.id} revision={lastSeq} />
          </Panel>

          {/* Only when the plan actually changed. One version is not a history,
              and a panel reading "v1, no changes" would be noise on the great
              majority of tasks. */}
          {task.plan_version > 1 &&
          <Panel
            title="Plan changes"
            description={`${task.plan_version} versions — what changed mid-run`}>
              <PlanHistory taskId={task.id} planVersion={task.plan_version} />
            </Panel>
          }

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
                    {/* Downloadable from P2-09 on: tasks now produce real files,
                        and a list of names you cannot open is a list of names. */}
                    <button
                  type="button"
                  onClick={() => tasksApi.download(task.id, a.id, a.filename || a.kind)}
                  className="truncate text-left text-brand-700 transition-colors duration-150 ease-out hover:text-brand-600 hover:underline">
                  
                      {a.filename || a.kind}
                    </button>
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

/**
 * The largest number of steps whose run windows overlapped.
 *
 * Measured from the timestamps rather than inferred from the graph: a plan can
 * describe three independent steps and still have run them one at a time,
 * because the concurrency limit is a runtime setting and not a property of the
 * DAG. What the user wants to know is what actually happened.
 */
function widestOverlap(steps: Step[]): number {
  const spans = steps.
  filter((s) => s.started_at && s.finished_at).
  map((s) => ({ from: Date.parse(s.started_at as string), to: Date.parse(s.finished_at as string) }));

  let widest = 0;
  for (const span of spans) {
    const n = spans.filter((o) => o.from < span.to && span.from < o.to).length;
    if (n > widest) widest = n;
  }
  return widest;
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
  const trail = step.escalations || [];
  const retries = trail.filter((e) => e.kind === 'retry').length;
  const escalation = [...trail].reverse().find((e) => e.kind === 'escalate');

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
            {/* How it got here. A step that took three goes, or that only
                worked once it moved to another actuator, must not read like one
                that worked first time (P2-08). */}
            {retries > 0 &&
            <span className="inline-flex items-center gap-1 text-[10px] text-warn-700">
                <RotateCwIcon className="h-3 w-3" strokeWidth={2.4} />
                {retries} retr{retries === 1 ? 'y' : 'ies'}
              </span>
            }
            {escalation &&
            <span
              className="inline-flex items-center gap-1 text-[10px] text-warn-700"
              title={escalation.reason}>
              
                <ArrowUpRightIcon className="h-3 w-3" strokeWidth={2.4} />
                level {escalation.from} → {escalation.to}
              </span>
            }
            {step.attempt > 1 && retries === 0 && !escalation &&
            <span className="text-[10px] text-ink-400">attempt {step.attempt}</span>
            }
            {/* A step that ran and did not verify must not read like one that
                worked. §7.2: an unverified change is a guess, and a guess shown
                as a success is the one outcome worse than a visible failure. */}
            {step.verification &&
            <span
              className={`inline-flex items-center gap-1 text-[10px] ${
              step.verification.passed ? 'text-ok-700' : 'text-danger-700'}`
              }
              title={step.verification.reason || undefined}>
              
                {step.verification.passed ?
                <ShieldCheckIcon className="h-3 w-3" strokeWidth={2.4} /> :
                <ShieldAlertIcon className="h-3 w-3" strokeWidth={2.4} />}
                {step.verification.passed ? 'verified' : 'did not verify'}
                {step.verification.tier !== 'targeted' ? ` (${step.verification.tier})` : ''}
              </span>
            }
            {step.depends_on.length > 0 ?
            <span className="font-mono text-[10px] text-ink-400">
                after {step.depends_on.join(', ')}
              </span> :
            <span className="text-[10px] text-ink-400">starts immediately</span>
            }
          </div>
          <p className="mt-1.5 truncate text-[13px] font-medium text-ink-900">{step.title}</p>
          {/* Before a step runs its goal is all there is to read; after it runs
              the observation is the more useful of the two. */}
          {obs?.summary ?
          <p className="mt-0.5 truncate text-[12px] text-ink-500">{obs.summary}</p> :
          step.goal ?
          <p className="mt-0.5 truncate text-[12px] text-ink-500">{step.goal}</p> :
          null
          }
        </div>
        <span className="shrink-0 pt-1 text-[11px] text-ink-400">
          {obs ? (open ? 'Hide' : 'Detail') : ''}
        </span>
      </button>

      {open && obs &&
      <div className="border-t border-line px-3.5 py-3">
          {step.verification && !step.verification.passed &&
        <div className="mb-2 rounded border border-danger-100 bg-danger-50 px-2.5 py-2">
              <p className="text-[12px] font-medium text-danger-700">
                It ran without error and did not verify
              </p>
              <ul className="mt-1 space-y-0.5">
                {step.verification.checks.filter((c) => !c.passed).map((c) =>
            <li key={c.name} className="text-[11px] text-danger-700">
                    <span className="font-mono">{c.name}</span> — {c.detail}
                  </li>
            )}
              </ul>
            </div>
        }
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
            {step.cost_usd ? ` · $${step.cost_usd.toFixed(5)}` : ''}
          </p>
          {/* The breakdown the row's own timestamps cannot give: the clock on a
              step starts when it is claimed, which is after its arguments turn
              (P2-10). */}
          {step.timings &&
        <p className="mt-1 text-[11px] text-ink-400">
              {step.timings.decideMs}ms deciding · {step.timings.dispatchMs}ms running
              {step.timings.verifyMs ? ` · ${step.timings.verifyMs}ms verifying` : ''}
              {step.timings.attempts > 1 ? ` · ${step.timings.attempts} attempts` : ''}
            </p>
        }
        </div>
      }
    </li>);

}
