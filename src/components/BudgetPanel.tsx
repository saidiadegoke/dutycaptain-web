'use client';

import { useState } from 'react';
import { WalletIcon } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { tasksApi, ApiError } from '@/lib/api';
import type { TaskBudget } from '@/lib/types';

/**
 * What this task is allowed to spend, and what it has (P2-07).
 *
 * THE NUMBERS ARE LABELLED AS ESTIMATES because they are: token counts
 * multiplied by a price table, not an invoice from the provider. A figure with
 * a dollar sign in front of it gets believed, and the gap between "about
 * $0.004" and "$0.004" is the difference between a useful signal and a claim
 * the runtime cannot support.
 *
 * Only the caps that are ON are shown. A cap of zero means uncapped, and a row
 * reading "0 of 0 tokens" would look like a limit that had already been hit.
 */

const money = (n: number) => (n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);

const READINGS: {
  key: keyof TaskBudget['caps'];
  label: string;
  read: (b: TaskBudget) => number;
  show: (n: number) => string;
}[] = [
{ key: 'usd', label: 'Spend', read: (b) => b.used.usd || 0, show: money },
{
  key: 'tokens',
  label: 'Tokens',
  read: (b) => (b.used.tokensIn || 0) + (b.used.tokensOut || 0),
  show: (n) => n.toLocaleString(),
},
{ key: 'steps', label: 'Steps', read: () => 0, show: (n) => String(n) }];


export function BudgetPanel({
  taskId,
  budget,
  suspended,
  onChanged




}: {taskId: string;budget: TaskBudget;suspended: boolean;onChanged: () => void;}) {
  const [raising, setRaising] = useState(false);
  const [value, setValue] = useState(String((budget.caps.usd || 1) * 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function raise() {
    setBusy(true);
    setError(null);
    try {
      const out = await tasksApi.setBudget(taskId, { usd: Number(value) });
      if (out.still_over) setError(`Still over: it ${out.still_over}`);
      else setRaising(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  }

  const rows = READINGS.
  filter((r) => (budget.caps[r.key] || 0) > 0).
  map((r) => {
    const cap = budget.caps[r.key];
    const used = r.read(budget);
    return { ...r, cap, used, pct: Math.min(100, Math.round((used / cap) * 100)) };
  });

  return (
    <div>
      {rows.length === 0 ?
      <p className="text-[12px] text-ink-500">No caps set — this task may run until it finishes.</p> :

      <dl className="space-y-3">
          {rows.map((r) =>
        <div key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-[12px]">
                <dt className="text-ink-500">{r.label}</dt>
                <dd className="tabular text-ink-900">
                  {r.show(r.used)}
                  <span className="text-ink-400"> of {r.key === 'usd' ? money(r.cap) : r.cap.toLocaleString()}</span>
                </dd>
              </div>
              <div className="mt-1">
                <ProgressBar
              value={r.pct}
              tone={r.pct >= 100 ? 'warn' : 'brand'}
              label={`${r.label} against its cap`} />

              </div>
            </div>
        )}
        </dl>
      }

      {budget.used.estimated !== false && (budget.used.calls || 0) > 0 &&
      <p className="mt-3 text-[11px] text-ink-400">
          Estimated from {budget.used.calls} model call{budget.used.calls === 1 ? '' : 's'} at
          list prices — the provider account is what actually bills.
        </p>
      }

      {suspended &&
      <div className="mt-3 rounded-md border border-warn-100 bg-warn-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-warn-700">
            <WalletIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            This task stopped because it reached its budget
          </p>
          <p className="mt-1 text-[12px] text-warn-700">
            It has not failed and nothing is lost. Raise the cap to let it carry on, or cancel it.
          </p>

          {raising ?
        <div className="mt-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-warn-700">New cap $</span>
                <input
              type="number"
              step="0.25"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24 rounded border border-line bg-panel px-2 py-1 text-[12px] text-ink-900" />

                <button
              type="button"
              disabled={busy}
              onClick={raise}
              className="rounded-md bg-brand-600 px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-60">

                  {busy ? 'Raising…' : 'Raise and resume'}
                </button>
                <button
              type="button"
              onClick={() => setRaising(false)}
              className="text-[12px] text-ink-500 hover:text-ink-900">

                  Cancel
                </button>
              </div>
              {/* Raising a cap does not reset the spend, so a raise that does not
                  clear the breach leaves the task where it was — said plainly,
                  because a 200 that changed nothing visible reads as a bug. */}
              {error && <p className="mt-1.5 text-[11px] text-danger-700">{error}</p>}
            </div> :

        <button
          type="button"
          onClick={() => setRaising(true)}
          className="mt-2 rounded-md border border-warn-100 bg-panel px-2.5 py-1.5 text-[12px] font-medium text-warn-700 transition-colors duration-150 ease-out hover:bg-warn-50">

              Raise the budget
            </button>
        }
        </div>
      }
    </div>);

}
