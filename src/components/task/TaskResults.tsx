'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScaleIcon, TableIcon, XIcon } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import type { TaskDetail, ValueProvenance } from '@/lib/types';

const STATE: Record<ValueProvenance['state'], { label: string; cls: string }> = {
  verified: { label: 'Verified', cls: 'border-ok-100 bg-ok-50 text-ok-700' },
  confirmed: { label: 'Confirmed by a person', cls: 'border-ok-100 bg-ok-50 text-ok-700' },
  probable: { label: 'Probable', cls: 'border-warn-100 bg-warn-50 text-warn-700' },
  ambiguous: { label: 'Unclear reading — confirm', cls: 'border-warn-100 bg-warn-50 text-warn-700' },
  stale: { label: 'Too old', cls: 'border-warn-100 bg-warn-50 text-warn-700' },
  conflicting: { label: 'Sources disagree', cls: 'border-danger-100 bg-danger-50 text-danger-700' },
  missing: { label: 'Not stated', cls: 'border-line bg-canvas text-ink-500' },
};

const show = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString() : String(v));

/** The evidence window, with the value marked where it appears. */
function Evidence({ text, value }: {text: string;value: unknown;}) {
  const needle = String(value ?? '');
  const digits = typeof value === 'number' ? value.toLocaleString('en-NG') : null;
  const find = [needle, digits].filter(Boolean).map((n) => text.toLowerCase().indexOf(String(n).toLowerCase())).find((i) => i >= 0);
  if (find === undefined || find < 0) return <>{text}</>;
  const len = (text.toLowerCase().indexOf(needle.toLowerCase()) === find ? needle : String(digits)).length;
  return <>{text.slice(0, find)}<mark className="rounded bg-warn-100 px-0.5 text-ink-900">{text.slice(find, find + len)}</mark>{text.slice(find + len)}</>;
}

/**
 * The task's result as a table (phase 3). Every value opens "why this value?":
 * the passage it was found in, the source version it came from, who produced
 * it, other sources that agree, and — where sources disagreed — the rule that
 * chose and what it chose over. Answered from records, not by asking a model.
 */
export function TaskResults({ task }: {task: TaskDetail;}) {
  const [values, setValues] = useState<ValueProvenance[] | null>(null);
  const [open, setOpen] = useState<ValueProvenance | null>(null);
  const finished = ['done', 'partial', 'failed'].includes(task.status);

  useEffect(() => {
    if (!finished) return;
    tasksApi.values(task.id).then(setValues).catch(() => setValues([]));
  }, [task.id, finished, task.status]);

  // The step whose records the task was judged on, else the last extraction.
  const step = useMemo(() => {
    const byKey = task.measured?.from_step ? task.steps.find((s) => s.key === task.measured?.from_step) : null;
    return byKey || [...task.steps].reverse().find((s) => s.capability === 'text.extract' && (s.status === 'done' || s.status === 'partial')) || null;
  }, [task.steps, task.measured?.from_step]);

  if (!finished || !step || !values) return null;
  const mine = values.filter((v) => v.step_id === step.id);
  if (!mine.length) return null;
  const data = (step.observation?.data || {}) as { conflicts?: { field: string; resolved: boolean; alternatives: { value: unknown; locator: string }[] }[] };
  const fields = [...new Set(mine.map((v) => v.field))];
  const rows = [...new Set(mine.map((v) => v.record_index))].sort((a, b) => a - b);
  const cell = (r: number, f: string) => mine.find((v) => v.record_index === r && v.field === f);
  const open_conflicts = (data.conflicts || []).filter((c) => !c.resolved);

  return (
    <section className="rounded-xl border border-line bg-panel shadow-panel">
      <header className="flex items-center gap-2 border-b border-line px-5 py-3">
        <TableIcon className="h-3.5 w-3.5 text-ink-500" strokeWidth={2.2} />
        <h2 className="text-[12px] font-semibold text-ink-700">What it found</h2>
        <span className="text-[12px] text-ink-400">Click a value to see where it came from</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-canvas text-left text-[12px] text-ink-500">
            <tr>{fields.map((f) => <th key={f} className="px-4 py-2 font-semibold">{f.replace(/_/g, ' ')}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) =>
            <tr key={r}>
                {fields.map((f) => {
                const v = cell(r, f);
                if (!v) return <td key={f} className="px-4 py-2 text-ink-400">—</td>;
                return (
                  <td key={f} className="px-4 py-1.5">
                      <button type="button" onClick={() => setOpen(v)} title={STATE[v.state]?.label}
                    className={`cursor-pointer rounded px-1.5 py-0.5 text-left hover:bg-canvas ${v.state === 'probable' ? 'underline decoration-warn-500 decoration-dotted underline-offset-4' : v.state === 'ambiguous' ? 'underline decoration-warn-500 decoration-wavy underline-offset-4' : ''}`}>
                        {show(v.value)}
                      </button>
                    </td>);

              })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open_conflicts.length > 0 &&
      <div className="border-t border-line px-5 py-3 text-[12px]">
          <p className="flex items-center gap-1.5 font-semibold text-danger-700"><ScaleIcon className="h-3.5 w-3.5" /> Sources disagree — not guessed</p>
          <ul className="mt-1 space-y-0.5 text-ink-700">
            {open_conflicts.map((c, i) =>
          <li key={i}>{c.field.replace(/_/g, ' ')}: {c.alternatives.map((a) => `${show(a.value)} (${a.locator})`).join(' vs ')}</li>
          )}
          </ul>
        </div>
      }

      {open &&
      <div className="border-t border-line bg-canvas/60 px-5 py-4 text-[12px]" role="dialog" aria-label="Why this value">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Why this value</p>
              <p className="mt-0.5 text-[15px] font-semibold text-ink-900">{open.field.replace(/_/g, ' ')}: {show(open.value)}
                <span className={`ml-2 rounded border px-1.5 py-[1px] align-middle text-[10px] font-semibold ${STATE[open.state]?.cls}`}>{STATE[open.state]?.label}</span>
              </p>
            </div>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="cursor-pointer rounded p-1 text-ink-400 hover:bg-panel hover:text-ink-900"><XIcon className="h-4 w-4" /></button>
          </div>
          {open.evidence &&
        <div className="mt-3">
              <p className="font-semibold text-ink-700">Found in</p>
              <pre className="mt-1 whitespace-pre-wrap break-words rounded-md border border-line bg-panel p-2.5 font-sans text-[12px] leading-relaxed text-ink-800"><Evidence text={open.evidence} value={open.value} /></pre>
            </div>
        }
          <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
            <dt className="text-ink-500">Source</dt><dd className="break-all text-ink-900">{open.locator || '—'}</dd>
            <dt className="text-ink-500">Version</dt><dd className="font-mono text-ink-700" title={open.source_hash || ''}>{open.source_hash ? open.source_hash.slice(0, 16) : '—'}</dd>
            <dt className="text-ink-500">Produced by</dt><dd className="text-ink-700">{open.extracted_by || '—'} · attempt {open.attempt}</dd>
            <dt className="text-ink-500">Checked</dt><dd className="text-ink-700">{open.check_result || '—'}</dd>
            {open.corroborated_by && open.corroborated_by.length > 0 && <><dt className="text-ink-500">Also stated by</dt><dd className="break-all text-ink-700">{open.corroborated_by.map((c) => c.locator).join(', ')}</dd></>}
            {open.resolution && open.state === 'ambiguous' && <><dt className="text-ink-500">Could also be</dt><dd className="text-ink-700">{open.resolution.alternatives.length ? open.resolution.alternatives.map((a) => show(a.value)).join(', ') : 'no other reading suggested'} — {open.resolution.rule}</dd></>}
            {open.resolution && open.state === 'confirmed' && <><dt className="text-ink-500">Given by</dt><dd className="text-ink-700">{open.resolution.rule.replace(/^confirmed by /, '')}{open.resolution.alternatives.length ? ` — replacing ${open.resolution.alternatives.map((a) => show(a.value)).join(', ')}` : ''}</dd></>}
            {open.resolution && open.state !== 'ambiguous' && open.state !== 'confirmed' && <><dt className="text-ink-500">Chosen over</dt><dd className="text-ink-700">{open.resolution.alternatives.map((a) => `${show(a.value)} (${a.locator})`).join(', ')} — rule: {open.resolution.rule}</dd></>}
          </dl>
        </div>
      }
    </section>);

}
