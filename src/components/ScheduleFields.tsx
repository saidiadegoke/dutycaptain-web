'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import type { ScheduleMode } from '@/lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODES: { value: ScheduleMode; label: string; note: string }[] = [
  {
    value: 'reuse_plan',
    label: 'Plan it now; I choose how each step runs; reuse that plan',
    note: 'It plans once, you review it, and every run follows that plan exactly.'
  },
  {
    value: 'review_each',
    label: 'Plan at each run, and email me to review before it runs',
    note: 'Each run plans fresh, then waits for you to check it and press Run.'
  },
  {
    value: 'auto',
    label: 'Plan and run automatically',
    note: 'Nothing waits for you (unless a step needs your approval or your input).'
  }];

const field = 'rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-ink-900';

/** When a task repeats, and how much of each run waits for you. */
export function ScheduleFields({
  times, setTimes, days, setDays, timezone, setTimezone, mode, setMode, runOnceNow, setRunOnceNow
}: {
  times: string[];setTimes: (t: string[]) => void;
  days: number[];setDays: (d: number[]) => void;
  timezone: string;setTimezone: (tz: string) => void;
  mode: ScheduleMode;setMode: (m: ScheduleMode) => void;
  runOnceNow: boolean;setRunOnceNow: (v: boolean) => void;
}) {
  const toggleDay = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());
  return (
    <div className="ml-6 space-y-3 rounded-lg border border-line bg-canvas p-3">
      <div>
        <p className="font-medium text-ink-700">At</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {times.map((t, i) =>
          <span key={i} className="inline-flex items-center gap-1">
              <input type="time" value={t} onChange={(e) => setTimes(times.map((x, j) => j === i ? e.target.value : x))} className={field} aria-label={`Time ${i + 1}`} />
              {times.length > 1 &&
            <button type="button" onClick={() => setTimes(times.filter((_, j) => j !== i))} aria-label={`Remove time ${i + 1}`} className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900">
                  <XIcon className="h-3 w-3" strokeWidth={2.4} />
                </button>
            }
            </span>
          )}
          <button type="button" onClick={() => setTimes([...times, '14:00'])} className="inline-flex cursor-pointer items-center gap-1 font-medium text-brand-700 hover:text-brand-500">
            <PlusIcon className="h-3 w-3" strokeWidth={2.4} /> Add a time
          </button>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={`${field} w-[170px] font-mono`} aria-label="Timezone" title="Timezone, e.g. Africa/Lagos" />
        </div>
      </div>
      <div>
        <p className="font-medium text-ink-700">On</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {DAYS.map((d, i) =>
          <button key={d} type="button" onClick={() => toggleDay(i)} aria-pressed={days.includes(i)}
          className={`cursor-pointer rounded-md border px-2 py-1 ${days.includes(i) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-panel text-ink-700 hover:bg-canvas'}`}>
              {d}
            </button>
          )}
          <span className="self-center text-ink-500">{days.length ? '' : 'every day'}</span>
        </div>
      </div>
      <fieldset>
        <legend className="font-medium text-ink-700">Each run</legend>
        <div className="mt-1 space-y-2">
          {MODES.map((m) =>
          <label key={m.value} className="flex cursor-pointer items-start gap-2">
              <input type="radio" name="schedule-mode" checked={mode === m.value} onChange={() => setMode(m.value)} className="mt-0.5 cursor-pointer" />
              <span>
                <span className="block text-ink-900">{m.label}</span>
                <span className="block text-ink-500">{m.note}</span>
              </span>
            </label>
          )}
        </div>
      </fieldset>
      {mode !== 'reuse_plan' &&
      <label className="flex cursor-pointer items-center gap-2 text-ink-700">
          <input type="checkbox" checked={runOnceNow} onChange={(e) => setRunOnceNow(e.target.checked)} className="cursor-pointer" />
          Also run it once now
        </label>
      }
    </div>);

}
