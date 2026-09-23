'use client';

import { useEffect, useState } from 'react';
import { GitBranchIcon, MinusIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { tasksApi, ApiError } from '@/lib/api';
import type { PlanDiff, PlanVersion } from '@/lib/types';

/**
 * What changed about the plan, and when (P2-04).
 *
 * §5.2: *"every mutation is versioned on the task and shown in the UI
 * timeline."* A plan that is edited mid-run and shows only its latest state
 * asks the reader to trust that the current graph is the one the task set out
 * with — and after an amendment or a replan it is not. This is the part that
 * says so.
 *
 * READ FROM THE EVENT LOG, like everything else here. The steps table holds the
 * current plan only, by design, so the history comes from `plan.created` and
 * `plan.revised`, each of which carries its whole graph. The diffs are the ones
 * computed when the change was made, not recomputed here — a second
 * implementation of the same question would be free to disagree with what the
 * timeline already showed.
 *
 * Hidden entirely for a task whose plan never changed. One version is not a
 * history, and a panel saying "v1, no changes" is noise on the great majority
 * of tasks.
 */

const KIND: Record<PlanVersion['kind'], { label: string; tone: string }> = {
  created: { label: 'Planned', tone: 'text-ink-500' },
  amended: { label: 'Amended', tone: 'text-brand-700' },
  replanned: { label: 'Replanned', tone: 'text-warn-700' },
};

function Change({ diff }: {diff: PlanDiff;}) {
  const rows: { icon: typeof PlusIcon; tone: string; text: string }[] = [];

  for (const key of diff.added) {
    rows.push({ icon: PlusIcon, tone: 'text-ok-700', text: key });
  }
  for (const key of diff.removed) {
    rows.push({ icon: MinusIcon, tone: 'text-danger-700', text: key });
  }
  for (const c of diff.changed) {
    // Which fields, not just "changed": a re-pointed dependency and a swapped
    // capability are different events in the life of a plan, and collapsing
    // them loses the only part a reader can act on.
    rows.push({ icon: PencilIcon, tone: 'text-brand-700', text: `${c.key} · ${c.fields.join(', ')}` });
  }

  if (!rows.length) {
    return <p className="text-[11px] text-ink-400">no change to the graph</p>;
  }

  return (
    <ul className="space-y-1">
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <li key={`${r.text}-${i}`} className="flex items-center gap-1.5">
            <Icon className={`h-3 w-3 shrink-0 ${r.tone}`} strokeWidth={2.6} />
            <span className="truncate font-mono text-[11px] text-ink-700">{r.text}</span>
          </li>);

      })}
      {diff.unchanged.length > 0 &&
      <li className="pl-[18px] text-[11px] text-ink-400">
          {diff.unchanged.length} step{diff.unchanged.length === 1 ? '' : 's'} unchanged
        </li>
      }
    </ul>);

}

export function PlanHistory({ taskId, planVersion }: {taskId: string;planVersion: number;}) {
  const [versions, setVersions] = useState<PlanVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refetched when the version changes, which is the only thing that can add an
  // entry — so a plan amended mid-run updates without polling for it.
  useEffect(() => {
    let cancelled = false;
    tasksApi.plan(taskId).
    then((h) => { if (!cancelled) setVersions(h.versions); }).
    catch((err) => {
      if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the plan history.');
    });
    return () => { cancelled = true; };
  }, [taskId, planVersion]);

  if (error) return <p className="text-[12px] text-danger-700">{error}</p>;
  if (!versions) return <p className="text-[12px] text-ink-500">Loading…</p>;

  return (
    <ol className="space-y-3">
      {[...versions].reverse().map((v) => {
        const kind = KIND[v.kind];
        return (
          <li key={v.version} className="rounded-lg border border-line bg-canvas px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <GitBranchIcon className={`h-3 w-3 ${kind.tone}`} strokeWidth={2.4} />
                <span className={`text-[12px] font-medium ${kind.tone}`}>
                  {kind.label} · v{v.version}
                </span>
                {v.version === planVersion &&
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-700">current</span>
                }
              </div>
              <span className="tabular shrink-0 text-[11px] text-ink-400">
                {new Date(v.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {v.reason &&
            <p className="mt-1.5 text-[12px] leading-snug text-ink-700">{v.reason}</p>
            }

            <div className="mt-2">
              {v.diff ?
              <Change diff={v.diff} /> :
              <p className="text-[11px] text-ink-400">
                  {v.steps.length} step{v.steps.length === 1 ? '' : 's'}
                  {v.immediate.length ? `, ${v.immediate.length} able to start immediately` : ''}
                </p>
              }
            </div>

            {v.carriedForward && v.carriedForward.length > 0 &&
            <p className="mt-1.5 text-[11px] text-ink-400">
                kept from the previous plan: {v.carriedForward.join(', ')}
              </p>
            }
          </li>);

      })}
    </ol>);

}
