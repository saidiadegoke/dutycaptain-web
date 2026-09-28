'use client';

import { useEffect, useState } from 'react';
import { firstLine } from '@/components/MarkdownText';
import Link from 'next/link';
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ProgressBar } from '@/components/ProgressBar';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { approvalsApi, artifactsApi, tasksApi } from '@/lib/api';
import type { Approval, ArtifactRow, Task } from '@/lib/types';
import { checked, isActive } from '@/lib/types';
import { ago, bytes, count, pct } from '@/utils/format';
import { iconFor, useDownload } from './Artifacts';
import { useRuntimeStatus } from './Models';

type Row = Task & {steps?: {total: number;done: number;failed: number;};};

const REFRESH_MS = 5000;
const RECENT = 6;

/**
 * The home screen, and every figure on it is real: the task in progress (or
 * the latest), your recent tasks, what is waiting for your decision, what the
 * runtime is running on, and the files your tasks produced.
 */
export function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { status: runtime } = useRuntimeStatus();
  const { download, busy, error: downloadError } = useDownload();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      // Each panel loads on its own: one failing does not blank the page.
      const [tasks, pending, files] = await Promise.allSettled([
        tasksApi.list({ limit: 20 }),
        approvalsApi.list(),
        artifactsApi.list({ limit: 3 }),
      ]);
      if (!alive) return;
      if (tasks.status === 'fulfilled') setRows(tasks.value.data as Row[]);
      if (pending.status === 'fulfilled') setApprovals(pending.value.filter((a) => a.status === 'pending'));
      if (files.status === 'fulfilled') setArtifacts(files.value.artifacts);
      setLoading(false);
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  // The newest task still working, else simply the newest.
  const active = rows.find((t) => isActive(t.status)) ?? rows[0] ?? null;
  const recent = rows.filter((t) => t.id !== active?.id).slice(0, RECENT);
  const steps = active?.steps ?? { total: 0, done: 0, failed: 0 };
  const progress = pct(steps.done, steps.total);

  const metrics = [
  { label: 'Steps', value: steps.total ? `${count(steps.done)} / ${count(steps.total)}` : '—' },
  { label: 'Failed steps', value: steps.failed ? String(steps.failed) : '0' },
  { label: 'Status', value: active ? active.status.replace(/_/g, ' ') : '—' },
  { label: 'Started', value: active?.started_at ? new Date(active.started_at).toLocaleTimeString() : '—' }];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Operations overview</h1>
        <div className="mt-5 h-48 animate-pulse rounded-xl border border-line bg-panel shadow-panel" aria-label="Loading" />
      </div>);

  }

  const ai = checked(runtime?.ai);
  const search = checked(runtime?.search);
  const python = checked(runtime?.python);
  const firstReady = (list: {label: string;state: string;}[] | undefined) => list?.find((p) => p.state === 'ready');
  const sittingOut = (list: {state: string;}[] | undefined) => (list || []).filter((p) => p.state === 'benched').length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
            Operations overview
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Your latest task, what is waiting for you, and what your tasks run on.
          </p>
        </div>
        <Link href="/app/tasks"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">

          All tasks
          <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {active ?
          <section className="rounded-xl border border-line bg-panel shadow-panel">
              <header className="px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <TaskStatusBadge status={active.status} />
                      <span className="font-mono text-[11px] text-ink-400">{active.id}</span>
                    </div>
                    <h2 className="mt-2 max-w-2xl text-[17px] font-semibold leading-snug tracking-tight text-ink-900">
                      “{firstLine(active.objective)}”
                    </h2>
                  </div>
                  <Link href={`/app/tasks/${active.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-ink-800">

                    Open task
                    <ChevronRightIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </Link>
                </div>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <p className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink-900">
                      {progress}%
                    </p>
                    <p className="text-[12px] text-ink-500">
                      {steps.total ? `${steps.done} of ${steps.total} steps` : 'no steps yet'}
                    </p>
                  </div>
                  <div className="mt-2.5">
                    <ProgressBar value={progress} label="Task progress" />
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                  {metrics.map((m) =>
                <div key={m.label}>
                      <dt className="text-[11px] text-ink-500">{m.label}</dt>
                      <dd className="tabular mt-1 text-[14px] font-semibold text-ink-900">{m.value}</dd>
                    </div>
                )}
                </dl>

                {/* Every step can finish and the task still fail: the final check
                    decides whether the objective was met. Say why, here. */}
                {active.status === 'failed' && active.error?.message &&
              <p className="mt-5 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5 text-[12px] leading-relaxed text-danger-700">
                    <span className="font-semibold">Why it failed: </span>{active.error.message}
                  </p>
              }
              </header>
            </section> :

          <div className="rounded-xl border border-line bg-panel px-6 py-16 text-center shadow-panel">
              <p className="text-[13px] font-medium text-ink-900">Nothing running yet</p>
              <p className="mt-1 text-[12px] text-ink-500">Start a task and this is where its progress appears.</p>
              <Link href="/app/tasks/new"
            className="mt-4 inline-flex rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500">

                New task
              </Link>
            </div>
          }

          <Panel
            title="Recent tasks"
            padded={false}
            action={
            <Link href="/app/tasks" className="text-[12px] font-medium text-brand-700 hover:text-brand-500">View all</Link>
            }>

            {recent.length ?
            <ul className="divide-y divide-line">
                {recent.map((t) =>
              <li key={t.id}>
                    <Link href={`/app/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 ease-out hover:bg-canvas">
                      <TaskStatusBadge status={t.status} />
                      <p className="min-w-0 flex-1 truncate text-[13px] text-ink-900">{firstLine(t.objective)}</p>
                      <span className="hidden shrink-0 text-[11px] text-ink-500 sm:block">
                        {t.steps?.total ? `${t.steps.done}/${t.steps.total} steps · ` : ''}{ago(t.created_at)}
                      </span>
                    </Link>
                  </li>
              )}
              </ul> :
            <p className="px-5 py-4 text-[12px] text-ink-500">{active ? 'No other tasks yet.' : 'No tasks yet.'}</p>}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel
            title="Needs your decision"
            description="Actions that change something pause until you approve them."
            padded={false}
            action={
            <Link href="/app/approvals"
              className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">

                Review all
              </Link>
            }>

            {approvals === null ?
            <p className="px-5 py-4 text-[12px] text-ink-500">Could not load approvals.</p> :
            approvals.length ?
            <ul className="divide-y divide-line">
                {approvals.slice(0, 3).map((a) =>
              <li key={a.id}>
                    <Link href="/app/approvals" className="block px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-canvas">
                      <p className="truncate text-[13px] font-semibold tracking-tight text-ink-900">{a.summary}</p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">
                        <span className="font-mono">{a.capability}</span>{a.task_objective ? ` · ${a.task_objective}` : ''}
                      </p>
                      <p className="mt-1.5 font-mono text-[10px] text-ink-400">{ago(a.created_at)}</p>
                    </Link>
                  </li>
              )}
                {approvals.length > 3 &&
              <li className="px-5 py-2.5 text-[12px] text-ink-500">and {approvals.length - 3} more</li>
              }
              </ul> :
            <p className="px-5 py-4 text-[12px] text-ink-500">Nothing is waiting for you.</p>}
          </Panel>

          <Panel
            title="Runtime"
            description="What your tasks run on right now."
            action={
            <Link href="/app/models"
              className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">

                Details
              </Link>
            }>

            {!runtime ?
            <p className="text-[12px] text-ink-500">Checking…</p> :
            <ul className="space-y-3 text-[12px]">
                <li className="flex justify-between gap-3">
                  <span className="text-ink-500">AI</span>
                  <span className="text-right text-ink-900">
                    {ai ? ai.connection ? 'your own model' : firstReady(ai.providers)?.label || 'none available' : 'not checked'}
                    {ai && sittingOut(ai.providers) ? <span className="text-warn-700"> · {sittingOut(ai.providers)} sitting out</span> : null}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-ink-500">Web search</span>
                  <span className="text-right text-ink-900">
                    {search ? firstReady(search.providers)?.label || 'none available' : 'not checked'}
                    {search && sittingOut(search.providers) ? <span className="text-warn-700"> · {sittingOut(search.providers)} sitting out</span> : null}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-ink-500">Code sandbox</span>
                  <span className={python?.available ? 'text-ink-900' : 'text-danger-700'}>
                    {python ? python.available ? `ready (${python.executor})` : 'unavailable' : 'not checked'}
                  </span>
                </li>
              </ul>
            }
          </Panel>

          <Panel
            title="Latest artifacts"
            padded={false}
            action={<Link href="/app/artifacts" className="text-[12px] font-medium text-brand-700 hover:text-brand-500">All files</Link>}>

            {downloadError && <p role="alert" className="px-5 pt-3 text-[12px] text-danger-700">{downloadError}</p>}
            {artifacts === null ?
            <p className="px-5 py-4 text-[12px] text-ink-500">Could not load files.</p> :
            artifacts.length ?
            <ul className="divide-y divide-line">
                {artifacts.map((a) => {
                const Icon = iconFor(a);
                return (
                  <li key={a.id}>
                      <button
                      type="button"
                      disabled={busy === a.id}
                      onClick={() => download(a)}
                      title={`Download ${a.filename || a.kind}`}
                      className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors duration-150 ease-out hover:bg-canvas disabled:cursor-wait">

                        <Icon className="h-4 w-4 shrink-0 text-ink-400" strokeWidth={1.9} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-[12px] text-ink-900">{a.filename || a.kind}</p>
                          <p className="truncate text-[11px] text-ink-500">
                            {busy === a.id ? 'Downloading…' : `${ago(a.created_at)} · ${bytes(a.bytes)}`}
                          </p>
                        </div>
                      </button>
                    </li>);

              })}
              </ul> :
            <p className="px-5 py-4 text-[12px] text-ink-500">Files your tasks write appear here.</p>}
          </Panel>
        </div>
      </div>
    </div>);

}
