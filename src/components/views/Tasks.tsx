'use client';

import { useCallback, useEffect, useState } from 'react';
import { firstLine } from '@/components/MarkdownText';
import Link from 'next/link';
import { PlusIcon, SearchIcon, RefreshCwIcon } from 'lucide-react';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { tasksApi, ApiError } from '@/lib/api';
import type { Task, TaskListItem, TaskStatus } from '@/lib/types';
import { isActive } from '@/lib/types';
import { pct } from '@/utils/format';

// Declared once in `lib/types` now — this used to be re-invented here.
type Row = TaskListItem;

const filters: Array<{id: TaskStatus | 'all';label: string;}> = [
{ id: 'all', label: 'All' },
{ id: 'running', label: 'Running' },
{ id: 'waiting_for_approval', label: 'Needs approval' },
{ id: 'paused', label: 'Paused' },
{ id: 'done', label: 'Done' },
{ id: 'failed', label: 'Failed' },
{ id: 'queued', label: 'Queued' }];


/** Elapsed, in the units a person actually reads. */
function elapsed(task: Task): string {
  if (!task.started_at) return '—';
  const end = task.finished_at ? new Date(task.finished_at) : new Date();
  const ms = end.getTime() - new Date(task.started_at).getTime();
  if (ms < 1000) return '<1s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function Tasks() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState('loading');
    try {
      const res = await tasksApi.list({ status: filter === 'all' ? undefined : filter, limit: 50 });
      setRows(res.data as Row[]);
      setState('ready');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
      setState('error');
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // A task that is still working changes without anyone touching the page.
  // Refreshed quietly, so the list does not flash a loading state every few
  // seconds; the detail page is where per-event live updates belong (P1-16).
  useEffect(() => {
    if (!rows.some((t) => isActive(t.status))) return undefined;
    const timer = setInterval(() => load(true), 4000);
    return () => clearInterval(timer);
  }, [rows, load]);

  const visible = rows.filter((t) =>
  query.trim() === '' ||
  (t.objective + t.id).toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Tasks</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Every instruction given to the platform, and what the runtime did with it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            aria-label="Refresh"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-2 text-[13px] text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas">
            
            <RefreshCwIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <Link href="/app/tasks/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
            
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            New task
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-panel p-1">
          {filters.map((f) =>
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ease-out ${
            filter === f.id ?
            'bg-ink-900 text-white' :
            'text-ink-700 hover:bg-canvas'}`
            }>
            
              {f.label}
            </button>
          )}
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search objectives, task ids…"
            aria-label="Search tasks"
            className="w-full bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none" />
          
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Objective', 'Status', 'Steps', 'Elapsed', 'Created'].map((h) =>
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  
                    {h}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((task) => {
                const steps = task.steps ?? { total: 0, done: 0, failed: 0 };
                return (
                  <tr
                    key={task.id}
                    className="group transition-colors duration-150 ease-out hover:bg-canvas">
                    
                    <td className="max-w-[460px] px-5 py-3.5">
                      <Link href={`/app/tasks/${task.id}`} className="block">
                        <p className="truncate text-[13px] font-semibold tracking-tight text-ink-900 group-hover:text-brand-700">
                          {firstLine(task.objective)}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-ink-400">{task.id}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <TaskStatusBadge status={task.status} />
                      {task.error?.message &&
                      <p className="mt-1 max-w-[220px] truncate text-[11px] text-danger-700" title={task.error.message}>
                          {task.error.message}
                        </p>
                      }
                    </td>
                    <td className="w-[160px] px-5 py-3.5 align-top">
                      {steps.total === 0 ?
                      <p className="text-[12px] text-ink-400">—</p> :

                      <>
                          <p className="tabular text-[12px] font-medium text-ink-900">
                            {steps.done} / {steps.total}
                            {steps.failed > 0 &&
                          <span className="ml-1.5 text-danger-700">({steps.failed} failed)</span>
                          }
                          </p>
                          <div className="mt-1.5">
                            <ProgressBar
                            value={pct(steps.done, steps.total)}
                            size="sm"
                            tone={
                            task.status === 'failed' ?
                            'warn' :
                            task.status === 'done' ?
                            'ok' :
                            isActive(task.status) ?
                            'brand' :
                            'neutral'
                            }
                            label={`${firstLine(task.objective)} progress`} />
                          
                          </div>
                        </>
                      }
                    </td>
                    <td className="tabular px-5 py-3.5 align-top text-[12px] text-ink-700">
                      {elapsed(task)}
                    </td>
                    <td className="px-5 py-3.5 align-top text-[12px] text-ink-700">
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>

        {state === 'loading' &&
        <div className="px-5 py-14 text-center">
            <p className="text-[13px] text-ink-500">Loading tasks…</p>
          </div>
        }

        {state === 'error' &&
        <div className="px-5 py-14 text-center">
            <p className="text-[13px] font-medium text-danger-700">{error}</p>
            <button
            type="button"
            onClick={() => load()}
            className="mt-3 rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-700 hover:bg-canvas">
            
              Try again
            </button>
          </div>
        }

        {state === 'ready' && visible.length === 0 &&
        <div className="px-5 py-14 text-center">
            <p className="text-[13px] font-medium text-ink-900">
              {rows.length === 0 ? 'No tasks yet' : 'No tasks match this view'}
            </p>
            <p className="mt-1 text-[12px] text-ink-500">
              {rows.length === 0 ?
            'Start one and the runtime will plan, act and report back.' :
            'Clear the filter or the search to see the rest.'}
            </p>
          </div>
        }
      </div>
    </div>);

}
