'use client';

import { useEffect, useState } from 'react';
import { ListChecksIcon, PlayIcon, UserIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { Capability, Step, TaskDetail } from '@/lib/types';

/** What each tool does, in words — the name is kept beside it, small. */
export const TOOL_LABELS: Record<string, string> = {
  'human.collect': 'Ask me to collect it',
  'web.search': 'Search the web',
  'http.request': 'Fetch a web page',
  'text.extract': 'Read values out of text',
  'python.run': 'Run a script',
  'api.send': 'Send to one of my APIs',
  'workspace.write': 'Write a file',
  'workspace.read': 'Read a file',
  'workspace.list': 'List files',
  'pdf.generate': 'Make a PDF',
  'spreadsheet.write': 'Make a spreadsheet',
  'browser.navigate': 'Open a page in the browser',
  'browser.read': 'Read the browser page',
  'browser.click': 'Click in the browser',
  'browser.type': 'Type in the browser',
  'filesystem.search': 'Search files on my computer',
  'filesystem.read': 'Read a file on my computer',
  'computer.click': 'Click on my computer',
  'computer.type': 'Type on my computer'
};
export const toolLabel = (name: string) => TOOL_LABELS[name] || name;

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * The plan, before anything runs: every step, the tool the AI chose for it,
 * and the choice to change it — or do the step yourself. Then Run. A task
 * that will become a schedule saves its plan for every future run here too.
 */
export function PlanReview({ task, onChanged }: {task: TaskDetail;onChanged: () => void;}) {
  const [caps, setCaps] = useState<Capability[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => { tasksApi.capabilities().then(setCaps).catch(() => setCaps([])); }, []);

  async function setTool(step: Step, capability: string) {
    setBusy(step.id);
    setError(null);
    try {
      await tasksApi.setStepTool(task.id, step.id, capability);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change that step.');
    } finally {
      setBusy(null);
    }
  }

  async function approve(runNow: boolean) {
    setBusy(runNow ? 'run' : 'save');
    setError(null);
    try {
      const out = await tasksApi.approvePlan(task.id, runNow);
      setDone(out.schedule ?
      `Saved: it will run ${out.schedule.times.join(', ')} ${out.schedule.days.length ? out.schedule.days.map((d) => DAY[d]).join(', ') : 'every day'} (${out.schedule.timezone}) with this plan.${runNow ? ' Running now too.' : ''}` :
      'Running.');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start it.');
      setBusy(null);
    }
  }

  const schedule = task.pending_schedule;
  const options = (current: string) => {
    const names = caps.map((c) => c.name);
    return names.includes(current) ? caps : [{ name: current, description: '' }, ...caps];
  };

  return (
    <section className="rounded-xl border border-brand-100 bg-panel p-5 shadow-panel">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-brand-700">
        <ListChecksIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Review the plan before it runs
      </p>
      <p className="mt-1 text-[13px] text-ink-700">
        Nothing has run. Check each step and how it will be done — change the tool, or take a step yourself.
        {schedule && ' This plan will be used for every scheduled run.'}
      </p>

      <ol className="mt-4 divide-y divide-line rounded-lg border border-line">
        {task.steps.map((s, i) =>
        <li key={s.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas font-mono text-[11px] text-ink-500">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink-900">{s.title}</p>
              {s.goal && <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{s.goal}</p>}
              {s.depends_on.length > 0 && <p className="mt-0.5 font-mono text-[10px] text-ink-400">after {s.depends_on.join(', ')}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="sr-only" htmlFor={`tool-${s.id}`}>How step {i + 1} runs</label>
              <select
              id={`tool-${s.id}`}
              value={s.capability}
              disabled={busy !== null}
              onChange={(e) => setTool(s, e.target.value)}
              className="max-w-[220px] cursor-pointer rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-900 disabled:opacity-60"
              title={s.capability}>
                {options(s.capability).map((c) => <option key={c.name} value={c.name}>{toolLabel(c.name)}</option>)}
              </select>
              {s.capability !== 'human.collect' &&
            <button type="button" disabled={busy !== null} onClick={() => setTool(s, 'human.collect')}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line px-2 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60"
            title="Do this step yourself: the task will ask you for the data">
                  <UserIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> I’ll do it
                </button>
            }
            </div>
          </li>
        )}
      </ol>

      {error && <p role="alert" className="mt-3 text-[12px] text-danger-700">{error}</p>}
      {done && <p className="mt-3 rounded-md border border-ok-100 bg-ok-50 px-3 py-2 text-[12px] text-ok-700">{done}</p>}

      {!done &&
      <div className="mt-4 flex flex-wrap justify-end gap-2">
          {schedule &&
        <button type="button" disabled={busy !== null} onClick={() => approve(false)}
        className="cursor-pointer rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">
              {busy === 'save' ? 'Saving…' : 'Save the schedule, don’t run now'}
            </button>
        }
          <button type="button" disabled={busy !== null || !task.steps.length} onClick={() => approve(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
            <PlayIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            {busy === 'run' ? 'Starting…' : schedule ? 'Run now and save the schedule' : 'Run'}
          </button>
        </div>
      }
    </section>);

}
