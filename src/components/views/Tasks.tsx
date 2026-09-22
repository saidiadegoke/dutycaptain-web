'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { tasks } from '@/data/tasks';
import { TaskStatus } from '@/types';
import { count, pct } from '@/utils/format';

const filters: Array<{id: TaskStatus | 'all';label: string;}> = [
{ id: 'all', label: 'All' },
{ id: 'running', label: 'Running' },
{ id: 'awaiting_approval', label: 'Awaiting approval' },
{ id: 'completed', label: 'Completed' },
{ id: 'failed', label: 'Failed' },
{ id: 'paused', label: 'Paused' },
{ id: 'queued', label: 'Queued' }];


export function Tasks() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(
    () =>
    tasks.filter((j) => {
      const matchesFilter = filter === 'all' || j.status === filter;
      const matchesQuery =
      query.trim() === '' ||
      (j.name + j.goal + j.id).toLowerCase().includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    }),
    [filter, query]
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Tasks</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Every instruction given to the platform, and what the agents did with it.
          </p>
        </div>
        <Link href="/app/tasks/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
          
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          New task
        </Link>
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
            placeholder="Search goals, task ids…"
            aria-label="Search tasks"
            className="w-full bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none" />
          
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Task', 'Status', 'Progress', 'Workers', 'Elapsed', 'Owner', 'Connector'].map(
                  (h) =>
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
              {rows.map((task) =>
              <tr
                key={task.id}
                className="group transition-colors duration-150 ease-out hover:bg-canvas">
                
                  <td className="max-w-[340px] px-5 py-3.5">
                    <Link href={`/app/tasks/${task.id}`} className="block">
                      <p className="truncate text-[13px] font-semibold tracking-tight text-ink-900 group-hover:text-brand-700">
                        {task.name}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">{task.goal}</p>
                      <p className="mt-1 font-mono text-[10px] text-ink-400">
                        {task.id} · {task.trigger}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="w-[168px] px-5 py-3.5 align-top">
                    <p className="tabular text-[12px] font-medium text-ink-900">
                      {count(task.done)} / {count(task.total)}
                    </p>
                    <div className="mt-1.5">
                      <ProgressBar
                      value={pct(task.done, task.total)}
                      size="sm"
                      tone={
                      task.status === 'failed' ?
                      'warn' :
                      task.status === 'completed' ?
                      'ok' :
                      task.status === 'running' ?
                      'brand' :
                      'neutral'
                      }
                      label={`${task.name} progress`} />
                    
                    </div>
                  </td>
                  <td className="tabular px-5 py-3.5 align-top text-[12px] text-ink-700">
                    {task.workers}
                  </td>
                  <td className="tabular px-5 py-3.5 align-top text-[12px] text-ink-700">
                    {task.elapsed}
                  </td>
                  <td className="px-5 py-3.5 align-top text-[12px] text-ink-700">{task.owner}</td>
                  <td className="px-5 py-3.5 align-top text-[12px] text-ink-700">
                    {task.connector}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length === 0 &&
        <div className="px-5 py-14 text-center">
            <p className="text-[13px] font-medium text-ink-900">No tasks match this view</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Clear the filter or start a new task to see it here.
            </p>
          </div>
        }
      </div>
    </div>);

}