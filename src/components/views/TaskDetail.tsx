'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MarkdownText, firstLine } from '@/components/MarkdownText';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  BrainIcon,
  ChevronRightIcon,
  GitBranchIcon,
  HomeIcon,
  InfoIcon,
  ListIcon,
  PauseIcon,
  PaperclipIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TimerIcon,
  XIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { RetryDialog } from '@/components/views/RetryDialog';
import { SearchRequestCard } from '@/components/SearchRequestCard';
import { InputRequestCard } from '@/components/InputRequestCard';
import { ConfirmRequestCard } from '@/components/ConfirmRequestCard';
import { TaskSources } from '@/components/task/TaskSources';
import { TaskResults } from '@/components/task/TaskResults';
import { TaskTimeline } from '@/components/TaskTimeline';
import { PlanHistory } from '@/components/PlanHistory';
import { ModelContext } from '@/components/ModelContext';
import { BudgetPanel } from '@/components/BudgetPanel';
import { AuditChain } from '@/components/AuditChain';
import { CostPanel } from '@/components/CostPanel';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { TaskOutcome } from '@/components/task/TaskOutcome';
import { PlanReview } from '@/components/task/PlanReview';
import { ContractCard } from '@/components/task/ContractCard';
import { StepDetail, StepIcon, duration } from '@/components/task/StepParts';
import { endpointsApi, tasksApi, ApiError } from '@/lib/api';
import { useTaskTimeline } from '@/lib/useTaskTimeline';
import type { Delivery, InputRequest, Observation, SearchRequest, Step, TaskDetail as TaskDetailType } from '@/lib/types';
import { isActive, isSuspended, isTerminal } from '@/lib/types';
import { ago, bytes } from '@/utils/format';

/**
 * Task detail (P1-15), laid out like a CI run page: the OUTCOME first — the
 * result in words and the files, or why it did not finish — then the steps as
 * a list, and every supporting detail (a step's raw result, the timeline, the
 * audit chain, cost, what the model is told) one click away in the rail rather
 * than all on screen at once. The chosen view is in the URL (`?view=`), so a
 * step's detail can be linked to and Back works.
 *
 * THE PAGE IS DRIVEN BY THE EVENT LOG (P1-16), not by a timer: the page
 * refetches when the stream says something happened, and a slow poll survives
 * only for when the stream is not connected.
 */
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
  const [inputs, setInputs] = useState<InputRequest[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [endpointNames, setEndpointNames] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'summary';
  const show = useCallback((next: string) => {
    const q = next === 'summary' ? '' : `?view=${encodeURIComponent(next)}`;
    router.push(`/app/tasks/${taskId}${q}`, { scroll: false });
  }, [router, taskId]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState('loading');
    try {
      setTask(await tasksApi.get(taskId));
      setState('ready');
      // Where it sent its result. Separate, and never blocks the page.
      tasksApi.deliveries(taskId).then(setDeliveries).catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
      setState('error');
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  // The endpoint's name, for "will be sent to …" before anything was sent.
  useEffect(() => {
    endpointsApi.list().then((all) => setEndpointNames(Object.fromEntries(all.map((e) => [e.id, e.name])))).catch(() => {});
  }, []);

  const { events, state: streamState, error: streamError } = useTaskTimeline(taskId);
  const lastSeq = events.length ? events[events.length - 1].seq : 0;
  const seenSeq = useRef(0);
  // Requests change without the task's status changing (phase 6): a step
  // waits while others run, and answers arrive one by one.
  const PEOPLE_EVENTS = ['input.required', 'input.provided', 'people.asked', 'answer.received', 'gaps.filled'];
  const peopleSeq = [...events].reverse().find((e) => PEOPLE_EVENTS.includes(e.type))?.seq || 0;

  // Searches waiting for the owner: read whenever the task is paused for one.
  const status = task?.status;
  useEffect(() => {
    if (!status) return;
    // "Did it arrive?" can be asked after a task finished — its result was sent
    // and the answer was lost — so requests are read in every state.
    tasksApi.inputRequests(taskId).
    then((all) => setInputs(all.filter((r) => r.status === 'pending'))).
    catch(() => setInputs([]));
    if (status !== 'waiting_for_input') {
      setSearches([]);
      return;
    }
    tasksApi.searchRequests(taskId).
    then((all) => setSearches(all.filter((r) => r.status === 'pending'))).
    catch(() => setSearches([]));
  }, [status, taskId, peopleSeq]);

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

  const done = task.steps.filter((s) => s.status === 'done' || s.status === 'partial').length;
  const concurrent = widestOverlap(task.steps);
  const canPause = isActive(task.status);
  // Neither an approval nor a budget is resumed past: one is decided, the other
  // is raised. Offering a Resume button that the API answers with a 409 is a
  // button that teaches people not to trust the buttons.
  const canResume = isSuspended(task.status)
  && task.status !== 'waiting_for_approval'
  && task.status !== 'waiting_for_budget';
  const canCancel = !isTerminal(task.status);

  const selectedStep = view.startsWith('step:') ? task.steps.find((s) => s.id === view.slice(5)) || null : null;
  const current: View = selectedStep ? view : RUN_DETAILS.some((d) => d.id === view) ? view : 'summary';
  const details = RUN_DETAILS.filter((d) => d.id !== 'changes' || task.plan_version > 1);
  const took = duration(task.started_at, task.finished_at);

  const btn = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas disabled:opacity-60';

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
            {(task.attempt ?? 1) > 1 && <span className="text-[11px] text-ink-500">Attempt {task.attempt}</span>}
            {task.sim_run_id &&
            <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wide text-brand-700" title={`Created by the Simulator (${task.sim_run_id})`}>
                Simulated
              </span>
            }
            {task.flags?.injection &&
            <span className="rounded border border-warn-100 bg-warn-50 px-1.5 py-[1px] text-[10px] font-semibold text-warn-700"
            title={`Read as data, not obeyed: ${task.flags.injection.sources.map((x) => x.locator).join(', ')}`}>
                Read content that tried to give orders — actions need your approval
              </span>
            }
            {(task.interruptions ?? 0) > 0 &&
            <span className="text-[11px] text-ink-500">Picked up after {task.interruptions} restart{task.interruptions === 1 ? '' : 's'}</span>
            }
          </div>
          <h1 className="mt-2 max-w-3xl text-[22px] font-semibold leading-snug tracking-tight text-ink-900">
            {firstLine(task.objective)}
          </h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" disabled={busy !== null} onClick={() => setRetryMode('retry')} className={btn}>
            <RotateCcwIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Retry
          </button>
          <button type="button" disabled={busy !== null} onClick={() => setRetryMode('edit')} className={btn}>
            <PencilIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Edit and retry
          </button>
          {canPause &&
          <button type="button" disabled={busy !== null} onClick={() => control('pause')} className={btn}>
              <PauseIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {busy === 'pause' ? 'Pausing…' : 'Pause'}
            </button>
          }
          {canResume &&
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => control('resume')}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-60">
              <PlayIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {busy === 'resume' ? 'Resuming…' : 'Resume'}
            </button>
          }
          {canCancel &&
          <button type="button" disabled={busy !== null} onClick={() => control('cancel')} className={btn}>
              <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {busy === 'cancel' ? 'Cancelling…' : 'Cancel'}
            </button>
          }
        </div>
      </div>

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

      {/* On a phone the rail becomes one menu above the content. */}
      <label className="mt-5 block lg:hidden">
        <span className="sr-only">Show</span>
        <select
          value={current}
          onChange={(e) => show(e.target.value as View)}
          className="w-full cursor-pointer rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900">
          <option value="summary">Summary</option>
          <optgroup label="Steps">
            {task.steps.map((s) => <option key={s.id} value={`step:${s.id}`}>{s.title}</option>)}
          </optgroup>
          <optgroup label="Run details">
            {details.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </optgroup>
        </select>
      </label>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Task sections" className="hidden lg:block">
          <RailItem active={current === 'summary'} onClick={() => show('summary')}>
            <HomeIcon className="h-4 w-4 shrink-0 text-ink-500" strokeWidth={2} />
            <span className="font-medium">Summary</span>
          </RailItem>

          <p className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Steps{task.steps.length ? ` · ${done}/${task.steps.length}` : ''}
          </p>
          {task.steps.length === 0 ?
          <p className="px-3 py-2 text-[12px] text-ink-500">Not planned yet</p> :
          task.steps.map((s) =>
          <RailItem key={s.id} active={current === `step:${s.id}`} onClick={() => show(`step:${s.id}`)}>
                <StepIcon step={s} />
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <span className="shrink-0 text-[11px] text-ink-400">{duration(s.started_at, s.finished_at) || ''}</span>
              </RailItem>
          )}

          <p className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Run details</p>
          {details.map((d) =>
          <RailItem key={d.id} active={current === d.id} onClick={() => show(d.id)}>
              <d.icon className="h-4 w-4 shrink-0 text-ink-500" strokeWidth={2} />
              <span>{d.label}</span>
            </RailItem>
          )}
        </nav>

        <div className="min-w-0 space-y-5">
          {current === 'summary' &&
          <>
              {/* The run at a glance. */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-line bg-panel px-5 py-4 shadow-panel sm:grid-cols-5">
                <Fact label="Status" value={task.status.replace(/_/g, ' ')} />
                <Fact label="Started" value={task.started_at ? ago(task.started_at) : 'not yet'} title={task.started_at ? new Date(task.started_at).toLocaleString() : undefined} />
                <Fact label={task.finished_at ? 'Total duration' : 'Running for'} value={took || '—'} />
                <Fact label="Steps" value={task.steps.length ? `${done} of ${task.steps.length}` : '—'} />
                <Fact label="Files" value={task.artifacts.length ? String(task.artifacts.length) : '—'} />
              </dl>

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

              {/* What it must hand back (phase 1): a review card while the owner is asked, collapsed after. */}
              {task.contract && <ContractCard task={task} onChanged={() => load(true)} />}

              {task.status === 'waiting_for_review' && task.steps.length > 0 && <PlanReview task={task} onChanged={() => load(true)} />}

              {inputs.map((r) => {
              const done = () => {
                setInputs((all) => all.filter((x) => x.id !== r.id));
                load(true);
              };
              return r.kind === 'confirm' ?
              <ConfirmRequestCard key={r.id} taskId={task.id} request={r} onDone={done} /> :
              <InputRequestCard key={r.id} taskId={task.id} request={r} onDone={done} />;
            })}

              <TaskSources taskId={task.id} />

              {/* What was asked, in full — formatting and the files it came with. */}
              {(task.objective.trim().includes('\n') || /[*_`]/.test(task.objective) || (task.attachments || []).length > 0) &&
            <section className="rounded-xl border border-line bg-panel px-5 py-4 shadow-panel">
                  <h2 className="text-[12px] font-semibold text-ink-700">What you asked</h2>
                  <MarkdownText text={task.objective} className="mt-1.5 text-[13px] leading-relaxed text-ink-900" />
                  {(task.attachments || []).length > 0 &&
              <ul className="mt-3 flex flex-wrap gap-1.5">
                      {(task.attachments || []).map((a) =>
                <li key={a.name}>
                          <button type="button" onClick={() => tasksApi.downloadAttachment(task.id, a.name).catch(() => {})}
                    title={a.columns ? `Columns: ${a.columns.join(', ')}` : a.preview || a.name}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1 text-[12px] text-ink-900 hover:border-brand-200">
                            <PaperclipIcon className="h-3.5 w-3.5 text-ink-500" strokeWidth={2} />
                            {a.name}
                            <span className="text-ink-400">{bytes(a.bytes)}</span>
                            {/* Which skill read it (phase 4), or why nothing could. */}
                            {a.read_by && <span className="rounded bg-panel px-1 font-mono text-[10px] text-ink-500" title={a.read_reason || ''}>{a.read_by}</span>}
                            {a.unreadable && <span className="text-[11px] text-warn-700" title={a.unreadable}>unreadable</span>}
                            {a.read_quality === 'poor' && <span className="text-[11px] text-warn-700" title="OCR read it poorly; a vision model reads it again when the task runs">poor scan</span>}
                            {!!a.unclear && a.read_quality !== 'poor' && <span className="text-[11px] text-ink-500" title="words the reading was unsure of; values built from them are marked to confirm">{a.unclear} unclear</span>}
                            {a.sensitive && <span className="text-[11px] text-warn-700">sensitive</span>}
                          </button>
                        </li>
                )}
                    </ul>
              }
                </section>
            }

              <TaskOutcome
              task={task}
              onRetry={setRetryMode}
              deliveries={deliveries}
              deliveryTo={task.delivery ? endpointNames[task.delivery.endpoint_id] || 'your endpoint' : null}
              onDeliveriesChanged={() => tasksApi.deliveries(taskId).then(setDeliveries).catch(() => {})} />

              {/* The result as a table; each value answers "why this value?" (phase 3). */}
              <TaskResults task={task} />

              {((task.attempt ?? 1) > 1 || (task.retries && task.retries.length > 0)) &&
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-line bg-canvas px-3 py-2 text-[12px] text-ink-700">
                  {(task.attempt ?? 1) > 1 && task.retry_of &&
              <span>
                      Attempt {task.attempt} · retry of{' '}
                      <Link href={`/app/tasks/${task.retry_of}`} className="text-brand-700 hover:text-brand-500">attempt {(task.attempt ?? 2) - 1}</Link>
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
                          <Link href={`/app/tasks/${r.id}`} className="font-medium text-brand-700 hover:text-brand-500">attempt {r.attempt}</Link>
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

              <Panel
              title="How it got there"
              description={task.steps.length ?
              `${task.steps.length} step${task.steps.length === 1 ? '' : 's'}${concurrent > 1 ? ` · ${concurrent} ran at the same time` : ''}${task.plan_version > 1 ? ` · plan revised ${task.plan_version - 1}×` : ''} — click one for its detail` :
              'The runtime has not proposed a step yet'}
              padded={false}>
                {task.steps.length === 0 ?
              <p className="px-5 py-6 text-center text-[12px] text-ink-500">Nothing yet — the first decision is on its way.</p> :
              <ol className="divide-y divide-line">
                    {task.steps.map((s) =>
                <li key={s.id}>
                        <button
                    type="button"
                    onClick={() => show(`step:${s.id}`)}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors duration-150 ease-out hover:bg-canvas">
                          <StepIcon step={s} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-ink-900">{s.title}</span>
                            {(s.observation as Observation | null)?.summary &&
                      <span className="block truncate text-[12px] text-ink-500">{(s.observation as Observation).summary}</span>
                      }
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-400">{duration(s.started_at, s.finished_at) || ''}</span>
                          <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={2} />
                        </button>
                      </li>
                )}
                  </ol>
              }
              </Panel>
            </>
          }

          {selectedStep &&
          <section className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <button type="button" onClick={() => show('summary')} className="mb-4 inline-flex cursor-pointer items-center gap-1 text-[12px] text-ink-500 hover:text-ink-900">
                <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2} /> Summary
              </button>
              <StepDetail step={selectedStep} />
            </section>
          }

          {current === 'timeline' &&
          <Panel title="Timeline" description="Every event the runtime recorded, as it recorded it">
              <TaskTimeline events={events} state={streamState} error={streamError} />
            </Panel>
          }
          {current === 'audit' &&
          <Panel title="Audit" description="Proposal → policy → approval → execution, per step">
              <AuditChain taskId={task.id} revision={lastSeq} />
            </Panel>
          }
          {current === 'cost' &&
          <>
              <Panel title="Cost and time" description="Where this task's money and seconds actually went">
                <CostPanel taskId={task.id} revision={lastSeq} />
              </Panel>
              <Panel title="Budget" description={task.status === 'waiting_for_budget' ? 'Reached — raise it to continue' : 'What it may spend, and what it has'}>
                <BudgetPanel
                taskId={task.id}
                budget={task.budget}
                suspended={task.status === 'waiting_for_budget'}
                onChanged={() => load(true)} />
              </Panel>
            </>
          }
          {current === 'context' &&
          <Panel title="What the model is told" description="The projection it reasons from, as stored on the last turn">
              <ModelContext taskId={task.id} revision={lastSeq} />
            </Panel>
          }
          {current === 'changes' &&
          <Panel title="Plan changes" description={`${task.plan_version} versions — what changed mid-run`}>
              <PlanHistory taskId={task.id} planVersion={task.plan_version} />
            </Panel>
          }
          {current === 'info' &&
          <Panel title="Task information">
              <dl className="space-y-3 text-[12px]">
                <InfoRow label="Task ID" value={task.id} mono />
                <InfoRow label="Plan version" value={String(task.plan_version)} />
                <InfoRow label="Created" value={new Date(task.created_at).toLocaleString()} />
                <InfoRow label="Started" value={task.started_at ? new Date(task.started_at).toLocaleString() : 'not yet'} />
                <InfoRow label="Finished" value={task.finished_at ? new Date(task.finished_at).toLocaleString() : '—'} />
                <InfoRow label="Spend, estimated" value={`$${(task.budget.used.usd || 0).toFixed(5)}`} />
              </dl>
            </Panel>
          }
        </div>
      </div>
    </div>);

}

type View = string;

/** The run's supporting detail, one click away rather than all on screen. */
const RUN_DETAILS = [
{ id: 'timeline', label: 'Timeline', icon: ListIcon },
{ id: 'audit', label: 'Audit', icon: ShieldCheckIcon },
{ id: 'cost', label: 'Cost and budget', icon: TimerIcon },
{ id: 'context', label: 'What the model is told', icon: BrainIcon },
{ id: 'changes', label: 'Plan changes', icon: GitBranchIcon },
{ id: 'info', label: 'Task information', icon: InfoIcon }];


function RailItem({ active, onClick, children }: {active: boolean;onClick: () => void;children: React.ReactNode;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-out ${
      active ? 'bg-panel text-ink-900 shadow-panel before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-600' : 'text-ink-700 hover:bg-panel'}`}>
      {children}
    </button>);

}

function Fact({ label, value, title }: {label: string;value: string;title?: string;}) {
  return (
    <div title={title}>
      <dt className="text-[11px] text-ink-500">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold capitalize text-ink-900">{value}</dd>
    </div>);

}

function InfoRow({ label, value, mono = false }: {label: string;value: string;mono?: boolean;}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className={`text-right text-ink-900 ${mono ? 'font-mono text-[11px]' : 'tabular'}`}>{value}</dd>
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
