'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SearchIcon, ShieldCheckIcon, TriangleAlertIcon, UserCheckIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { tasksApi, approvalsApi, ApiError } from '@/lib/api';
import type { Approval, TaskListItem } from '@/lib/types';

/**
 * The audit index (P3-09).
 *
 * THE CHAIN ITSELF LIVES ON THE TASK, because that is what a chain is about —
 * proposal → policy → approval → execution for one step, and a step belongs to
 * a task. This page is the way in: which tasks are there, which of them asked
 * for something, and which are still waiting on an answer.
 *
 * IT SHOWS DECISIONS THAT ARE STILL OPEN FIRST. An audit is usually read for
 * one of two reasons — something went wrong, or somebody is waiting — and the
 * second is the one where looking at it changes the outcome.
 *
 * Previously sixteen rows of fixtures. The numbers here are the runtime's.
 */

const timeAgo = (iso: string) => {
  const secs = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

export function AuditTrail() {
  const [tasks, setTasks] = useState<TaskListItem[] | null>(null);
  const [pending, setPending] = useState<Approval[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, approvals] = await Promise.all([
        tasksApi.list({ limit: 50 }),
        approvalsApi.list(),
      ]);
      setTasks(list.data);
      setPending(approvals);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tasks || []).filter((t) => !q || t.objective.toLowerCase().includes(q));
  }, [tasks, query]);

  const waitingByTask = useMemo(() => {
    const map = new Map<string, Approval[]>();
    for (const a of pending) {
      map.set(a.task_id, [...(map.get(a.task_id) || []), a]);
    }
    return map;
  }, [pending]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Audit</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          Every action a task took, with the judgement that allowed it. Open a task to see the
          chain — what the model proposed, what the policy decided, who approved it, and whether
          what ran is what was approved.
        </p>
      </div>

      {error &&
      <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
          {error}
        </p>
      }

      {pending.length > 0 &&
      <div className="mt-5 rounded-lg border border-warn-100 bg-warn-50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-warn-700">
            <UserCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            {pending.length} decision{pending.length === 1 ? '' : 's'} still waiting on you
          </p>
          <p className="mt-1 text-[12px] text-warn-700">
            {/* The one part of an audit where reading it changes the outcome. */}
            Those tasks are suspended until you answer.{' '}
            <Link href="/app/approvals" className="underline">Go to approvals</Link>
          </p>
        </div>
      }

      <div className="mt-5">
        <div className="relative mb-3 max-w-md">
          <SearchIcon
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
            strokeWidth={2.2} />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search objectives"
            className="w-full rounded-md border border-line bg-panel py-2 pl-8 pr-3 text-[12px] text-ink-900 placeholder:text-ink-400" />

        </div>

        <Panel
          title="Tasks"
          description={tasks === null ? 'Loading…' : `${rows.length} shown`}
          padded={false}>

          {tasks !== null && rows.length === 0 ?
          <p className="px-4 py-10 text-center text-[12px] text-ink-500">
              {query ? 'Nothing matches that.' : 'No tasks yet.'}
            </p> :

          <ul className="divide-y divide-line">
              {rows.map((t) => {
              const waiting = waitingByTask.get(t.id) || [];
              return (
                <li key={t.id}>
                    <Link
                    href={`/app/tasks/${t.id}`}
                    className="block px-4 py-3 transition-colors duration-150 ease-out hover:bg-canvas">

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <TaskStatusBadge status={t.status} />
                          {waiting.length > 0 &&
                        <span className="inline-flex items-center gap-1 rounded border border-warn-100 bg-warn-50 px-1.5 py-0.5 text-[10px] text-warn-700">
                              <UserCheckIcon className="h-3 w-3" strokeWidth={2.4} />
                              waiting on you
                            </span>
                        }
                          {t.status === 'done' && waiting.length === 0 &&
                        <span className="inline-flex items-center gap-1 text-[10px] text-ok-700">
                              <ShieldCheckIcon className="h-3 w-3" strokeWidth={2.4} />
                              every step judged
                            </span>
                        }
                          {t.status === 'failed' &&
                        <span className="inline-flex items-center gap-1 text-[10px] text-danger-700">
                              <TriangleAlertIcon className="h-3 w-3" strokeWidth={2.4} />
                              did not finish
                            </span>
                        }
                        </div>
                        <span className="tabular shrink-0 text-[11px] text-ink-400">
                          {timeAgo(t.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-[13px] text-ink-900">{t.objective}</p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {t.steps.done} of {t.steps.total} steps
                        {t.steps.failed > 0 ? ` · ${t.steps.failed} failed` : ''}
                      </p>
                    </Link>
                  </li>);

            })}
            </ul>
          }
        </Panel>
      </div>
    </div>);

}
