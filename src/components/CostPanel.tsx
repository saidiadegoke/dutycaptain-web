'use client';

import { useEffect, useState } from 'react';
import { tasksApi, ApiError } from '@/lib/api';
import type { CostRollup } from '@/lib/types';

/**
 * Where the time and the money went (P2-10).
 *
 * THE NUMBER THIS PANEL EXISTS FOR is the share of a step's life spent waiting
 * for a model rather than doing the thing. Live runs put it around two thirds —
 * roughly two seconds of deciding against seven hundred milliseconds of HTTP —
 * which is not what anyone assumes when they look at a task taking fifteen
 * seconds and go looking for a slow API.
 *
 * DOING AGAINST DECIDING is the other one. A task's total always exceeds the
 * sum of its steps, because planning, the conclusion and the repair triage
 * belong to no step. That gap is not missing money and the panel says so by
 * name, which is the whole reason the runtime records a `kind` per charge.
 *
 * The figures are labelled estimated wherever they appear, for the reason
 * P2-07 gives: they are token counts multiplied by a price table, and a number
 * with a dollar sign in front of it gets believed.
 */

const money = (n: number) => (n < 0.01 ? `$${n.toFixed(5)}` : `$${n.toFixed(3)}`);
const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${Math.round(n)}ms`);

const KIND_LABEL: Record<string, string> = {
  step: 'Doing the work',
  planning: 'Planning',
  triage: 'Deciding what to do about failures',
  conclusion: 'Judging the result',
  overhead: 'Other',
};

/** One step's time, as three proportional segments. */
function Bar({ decide, dispatch, verify }: {decide: number;dispatch: number;verify: number;}) {
  const total = decide + dispatch + verify;
  if (total <= 0) return null;
  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-canvas" aria-hidden="true">
      <div className="bg-warn-600" style={{ width: pct(decide) }} title={`deciding ${ms(decide)}`} />
      <div className="bg-brand-500" style={{ width: pct(dispatch) }} title={`running ${ms(dispatch)}`} />
      <div className="bg-ok-600" style={{ width: pct(verify) }} title={`verifying ${ms(verify)}`} />
    </div>);

}

export function CostPanel({ taskId, revision }: {taskId: string;revision: number;}) {
  const [data, setData] = useState<CostRollup | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    tasksApi.cost(taskId).
    then((d) => { if (!cancelled) setData(d); }).
    catch((err) => {
      if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the cost breakdown.');
    });
    return () => { cancelled = true; };
  }, [taskId, revision]);

  if (error) return <p className="text-[12px] text-danger-700">{error}</p>;
  if (!data) return <p className="text-[12px] text-ink-500">Loading…</p>;

  const { totals, steps, decideShare } = data;
  if (!steps.length && totals.costUsd === 0) {
    return <p className="py-4 text-center text-[12px] text-ink-500">Nothing has run yet.</p>;
  }

  const kinds = Object.entries(totals.byKind || {}).
  filter(([, v]) => Number(v.usd) > 0).
  sort((a, b) => Number(b[1].usd) - Number(a[1].usd));

  return (
    <div>
      {decideShare !== null &&
      <p className="mb-3 rounded-md border border-line bg-canvas px-3 py-2 text-[12px] leading-snug text-ink-700">
          <span className="font-medium">{Math.round(decideShare * 100)}%</span> of step time went on
          waiting for a model to decide what to pass, not on doing the work —
          {' '}{ms(totals.decideMs)} deciding against {ms(totals.dispatchMs)} running.
        </p>
      }

      <dl className="space-y-2 text-[12px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">Total, estimated</dt>
          <dd className="tabular text-ink-900">{money(totals.costUsd)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">On the steps themselves</dt>
          <dd className="tabular text-ink-900">{money(totals.stepCostUsd)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          {/* Named, because a total that exceeds the sum of the steps otherwise
              reads as money going missing. */}
          <dt className="text-ink-500">On planning and judging</dt>
          <dd className="tabular text-ink-900">{money(totals.overheadUsd)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
          <dt className="text-ink-500">Wall clock</dt>
          <dd className="tabular text-ink-900">{ms(totals.wallClockMs)}</dd>
        </div>
      </dl>

      {kinds.length > 1 &&
      <ul className="mt-3 space-y-1 border-t border-line pt-2.5">
          {kinds.map(([kind, v]) =>
        <li key={kind} className="flex items-baseline justify-between gap-3 text-[11px]">
              <span className="truncate text-ink-500">{KIND_LABEL[kind] || kind}</span>
              <span className="tabular shrink-0 text-ink-700">
                {money(Number(v.usd))}
                <span className="text-ink-400"> · {v.calls} call{v.calls === 1 ? '' : 's'}</span>
              </span>
            </li>
        )}
        </ul>
      }

      {steps.length > 0 &&
      <div className="mt-3 border-t border-line pt-2.5">
          <p className="mb-2 text-[11px] text-ink-500">
            Per step — <span className="text-warn-700">deciding</span>,
            {' '}<span className="text-brand-700">running</span>,
            {' '}<span className="text-ok-700">verifying</span>
          </p>
          <ul className="space-y-2">
            {steps.map((s) =>
          <li key={s.key}>
                <div className="flex items-baseline justify-between gap-3 text-[11px]">
                  <span className="truncate font-mono text-ink-700">
                    {s.key}
                    {s.attempts > 1 && <span className="text-ink-400"> ×{s.attempts}</span>}
                  </span>
                  <span className="tabular shrink-0 text-ink-500">
                    {ms(s.totalMs)} · {money(s.costUsd)}
                  </span>
                </div>
                <div className="mt-1">
                  <Bar decide={s.decideMs} dispatch={s.dispatchMs} verify={s.verifyMs} />
                </div>
              </li>
          )}
          </ul>
        </div>
      }
    </div>);

}
