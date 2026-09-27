'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClockIcon, PauseIcon, PlayIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react';
import { ApiError, schedulesApi } from '@/lib/api';
import type { Schedule } from '@/lib/types';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { toolLabel } from '@/components/task/PlanReview';
import { ago } from '@/utils/format';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODE: Record<Schedule['mode'], string> = {
  reuse_plan: 'Runs the plan you reviewed',
  review_each: 'Plans each time, waits for your review',
  auto: 'Plans and runs automatically'
};

const when = (s: Schedule) => `${s.times.join(', ')} · ${s.days.length ? s.days.map((d) => DAY[d]).join(', ') : 'every day'} · ${s.timezone}`;

/** Tasks that run on their own at set times, and how each run went. */
export function Schedules() {
  const router = useRouter();
  const [list, setList] = useState<Schedule[] | null>(null);
  const [open, setOpen] = useState<Record<string, Schedule>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => schedulesApi.list().then(setList).catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your schedules.')), []);
  useEffect(() => { load(); }, [load]);

  async function act(s: Schedule, what: 'pause' | 'resume' | 'run' | 'delete') {
    setBusy(`${s.id}:${what}`);
    setError(null);
    try {
      if (what === 'run') {
        const out = await schedulesApi.runNow(s.id);
        router.push(`/app/tasks/${out.task_id}`);
        return;
      }
      if (what === 'delete') {
        if (!window.confirm(`Delete the schedule “${s.name}”? Past runs are kept.`)) return;
        await schedulesApi.remove(s.id);
      } else {
        await schedulesApi.update(s.id, { enabled: what === 'resume' });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That did not work.');
    } finally {
      setBusy(null);
    }
  }

  async function toggleRuns(s: Schedule) {
    if (open[s.id]) {
      setOpen(({ [s.id]: _, ...rest }) => rest);
      return;
    }
    try {
      const full = await schedulesApi.get(s.id);
      setOpen((all) => ({ ...all, [s.id]: full }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load its runs.');
    }
  }

  const btn = 'inline-flex cursor-pointer items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60';

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Schedules</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-500">Tasks that run on their own at set times. Each run is a normal task with its own result.</p>
        </div>
        <Link href="/app/tasks/new" className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500">
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> New scheduled task
        </Link>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">{error}</p>}

      {list === null ?
      <div className="mt-5 h-40 animate-pulse rounded-xl border border-line bg-panel shadow-panel" aria-label="Loading" /> :
      list.length === 0 ?
      <div className="mt-5 rounded-xl border border-line bg-panel px-6 py-16 text-center shadow-panel">
          <CalendarClockIcon className="mx-auto h-6 w-6 text-ink-400" strokeWidth={1.8} />
          <p className="mt-3 text-[13px] font-medium text-ink-900">No schedules yet</p>
          <p className="mt-1 text-[12px] text-ink-500">On the New task form, tick “Repeat on a schedule”.</p>
        </div> :

      <ul className="mt-5 space-y-3">
          {list.map((s) =>
        <li key={s.id} className={`rounded-xl border bg-panel p-5 shadow-panel ${s.enabled ? 'border-line' : 'border-dashed border-line-strong'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">{s.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink-500">{when(s)}</p>
                  <p className="mt-0.5 text-[12px] text-ink-500">{MODE[s.mode]}{s.deliver_to ? ' · sends its result to your API' : ''}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button type="button" disabled={busy !== null} onClick={() => act(s, 'run')} className={btn}>
                    <PlayIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Run now
                  </button>
                  <button type="button" disabled={busy !== null} onClick={() => act(s, s.enabled ? 'pause' : 'resume')} className={btn}>
                    {s.enabled ? <PauseIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> : <RotateCcwIcon className="h-3.5 w-3.5" strokeWidth={2.2} />}
                    {s.enabled ? 'Pause' : 'Resume'}
                  </button>
                  <button type="button" disabled={busy !== null} onClick={() => act(s, 'delete')} aria-label={`Delete ${s.name}`}
              className="cursor-pointer rounded-md p-1.5 text-ink-400 hover:bg-canvas hover:text-danger-700 disabled:opacity-60">
                    <Trash2Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-4">
                <div><dt className="text-ink-500">Next run</dt><dd className="text-ink-900">{s.enabled && s.next_run_at ? new Date(s.next_run_at).toLocaleString() : 'paused'}</dd></div>
                <div><dt className="text-ink-500">Last run</dt><dd className="text-ink-900">{s.last_run_at ? ago(s.last_run_at) : '—'}</dd></div>
                <div><dt className="text-ink-500">Runs</dt><dd className="text-ink-900">{s.run_count}</dd></div>
                <div><dt className="text-ink-500">Last task</dt><dd>{s.last_task_id ? <Link href={`/app/tasks/${s.last_task_id}`} className="text-brand-700 hover:text-brand-500">Open</Link> : '—'}</dd></div>
              </dl>
              {s.last_skip_reason && <p className="mt-2 text-[12px] text-warn-700">Skipped: {s.last_skip_reason.replace(/^[^:]+Z: /, '')}</p>}

              {s.steps &&
          <p className="mt-3 text-[12px] text-ink-500">
                  Plan: {s.steps.map((st, i) => <span key={st.key}>{i > 0 && ' → '}<span className="text-ink-900">{st.title}</span> <span className="text-ink-400">({toolLabel(st.capability)})</span></span>)}
                </p>
          }

              <button type="button" onClick={() => toggleRuns(s)} className="mt-3 cursor-pointer text-[12px] font-medium text-brand-700 hover:text-brand-500">
                {open[s.id] ? 'Hide runs' : 'Show runs'}
              </button>
              {open[s.id] &&
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
                  {(open[s.id].runs || []).length === 0 ?
            <li className="px-3 py-2 text-[12px] text-ink-500">No runs yet.</li> :
            (open[s.id].runs || []).map((r) =>
            <li key={r.id}>
                      <Link href={`/app/tasks/${r.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-canvas">
                        <TaskStatusBadge status={r.status} />
                        <span className="text-[12px] text-ink-700">{new Date(r.created_at).toLocaleString()}</span>
                      </Link>
                    </li>
            )}
                </ul>
          }
            </li>
        )}
        </ul>
      }
    </div>);

}
