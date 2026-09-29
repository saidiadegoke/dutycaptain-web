'use client';

import { useState } from 'react';
import { ChevronRightIcon, ClipboardCheckIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { OutputContract, TaskDetail } from '@/lib/types';

const RULE: Record<OutputContract['completeness']['rule'], string> = {
  exactly_one: 'Exactly one',
  all: 'Every one',
  up_to: 'Up to',
  best_effort: 'As many as can be found',
  coverage: 'Every source checked',
};

function completenessText(c: OutputContract['completeness']) {
  if (c.rule === 'up_to') return `Up to ${c.n}`;
  if (c.rule === 'all' && c.items?.length) return `Every one of ${c.items.length}: ${c.items.slice(0, 6).join(', ')}${c.items.length > 6 ? ', …' : ''}`;
  if (c.rule === 'all' && c.n) return `Every one (${c.n})`;
  return RULE[c.rule];
}

/**
 * What the task will hand back (phase 1). While it waits for review — the task
 * is consequential — the owner can make fields optional or required and change
 * how many count as complete, then approve. After that it is read-only and
 * collapsed: the contract the task was judged against.
 */
export function ContractCard({ task, onChanged }: {task: TaskDetail;onChanged: () => void;}) {
  const contract = task.contract as OutputContract;
  const reviewing = task.status === 'waiting_for_review' && !!contract.review?.required && !task.contract_approved_at && task.steps.length === 0;
  const [open, setOpen] = useState(reviewing);
  const [fields, setFields] = useState(contract.fields);
  const [rule, setRule] = useState(contract.completeness.rule);
  const [n, setN] = useState<number | ''>(contract.completeness.n ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = JSON.stringify(fields) !== JSON.stringify(contract.fields) || rule !== contract.completeness.rule || (n || undefined) !== contract.completeness.n;

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      if (changed) {
        await tasksApi.editContract(task.id, {
          fields,
          completeness: { ...contract.completeness, rule, ...(n ? { n: Number(n) } : {}) },
        });
      }
      await tasksApi.approveContract(task.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve it.');
      setBusy(false);
    }
  }

  const body =
  <div className="space-y-3 text-[13px]">
      <p className="text-[14px] font-medium leading-snug text-ink-900">{contract.summary}</p>
      {reviewing && contract.review?.reasons?.length ?
    <p className="text-[12px] text-warn-700">Checking with you first because {contract.review.reasons.join('; ')}.</p> :
    null}
      {(contract.checks || []).filter((c) => c.corrected).map((c, i) =>
    <p key={i} className="text-[12px] text-ink-500">Corrected from {c.was} to {c.now}: the objective says {c.said}.</p>
    )}

      {fields.length > 0 &&
    <table className="w-full text-[12px]">
          <thead className="text-left text-ink-500">
            <tr><th className="py-1 pr-3 font-semibold">Field</th><th className="py-1 pr-3 font-semibold">Type</th><th className="py-1 font-semibold">Needed?</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {fields.map((f, i) =>
        <tr key={f.name}>
                <td className="py-1.5 pr-3"><span className="font-mono text-ink-900">{f.name}</span>{f.description && <span className="block text-[11px] text-ink-500">{f.description}</span>}</td>
                <td className="py-1.5 pr-3 text-ink-500">{f.type}</td>
                <td className="py-1.5">
                  {reviewing ?
            <label className="inline-flex cursor-pointer items-center gap-1.5">
                      <input type="checkbox" checked={f.required} className="cursor-pointer"
              onChange={(e) => setFields(fields.map((x, j) => j === i ? { ...x, required: e.target.checked } : x))} />
                      {f.required ? 'Required' : 'Optional'}
                    </label> :
            <span className={f.required ? 'text-ink-900' : 'text-ink-500'}>{f.required ? 'Required' : 'Optional'}</span>}
                </td>
              </tr>
        )}
          </tbody>
        </table>
    }

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-ink-500">Complete when:</span>
        {reviewing ?
      <>
            <select value={rule} onChange={(e) => setRule(e.target.value as OutputContract['completeness']['rule'])}
        className="rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-ink-900">
              {(Object.keys(RULE) as OutputContract['completeness']['rule'][]).map((r) => <option key={r} value={r}>{RULE[r]}</option>)}
            </select>
            {(rule === 'up_to' || rule === 'all') &&
        <input type="number" min={1} value={n} onChange={(e) => setN(e.target.value ? Number(e.target.value) : '')} placeholder="how many"
        className="w-24 rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-ink-900" />
        }
          </> :
      <span className="text-ink-900">{completenessText(contract.completeness)}</span>}
      </div>
      {contract.freshness?.max_age_days && <p className="text-[12px] text-ink-500">Values no older than {contract.freshness.max_age_days} day(s).</p>}
      {contract.actions.length > 0 &&
    <p className="text-[12px] text-ink-700">It will {contract.actions.map((a) => `${a.kind} to ${a.target}`).join(', ')}.</p>
    }

      {error && <p className="text-[12px] text-danger-700">{error}</p>}
      {reviewing &&
    <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" onClick={approve} disabled={busy}
      className="cursor-pointer rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-500 disabled:opacity-60">
            {busy ? 'Saving…' : changed ? 'Save and approve' : 'Approve'}
          </button>
          <span className="text-[12px] text-ink-500">Nothing is planned or run until you do.</span>
        </div>
    }
    </div>;


  if (reviewing) {
    return (
      <section className="rounded-xl border border-warn-100 bg-warn-50/50 p-5">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-warn-700">
          <ClipboardCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> I understand your request as
        </p>
        {body}
      </section>);

  }

  return (
    <section className="rounded-xl border border-line bg-panel shadow-panel">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-2 px-5 py-3 text-left">
        <ChevronRightIcon className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} strokeWidth={2.4} />
        <ClipboardCheckIcon className="h-3.5 w-3.5 text-ink-500" strokeWidth={2.2} />
        <span className="text-[12px] font-semibold text-ink-700">What it will hand back</span>
        <span className="min-w-0 truncate text-[12px] text-ink-400">{contract.summary}</span>
      </button>
      {open && <div className="border-t border-line px-5 py-3">{body}</div>}
    </section>);

}
