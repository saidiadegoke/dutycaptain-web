'use client';

import { useEffect, useState } from 'react';
import { AlertCircleIcon, BookmarkIcon } from 'lucide-react';
import { tasksApi, ApiError } from '@/lib/api';
import type { Fact, TaskStateResponse } from '@/lib/types';

/**
 * What the model was actually told (P2-05, §5.4).
 *
 * The first question anyone asks when a task does something strange is "what
 * did it know?", and until the projection was persisted that was unanswerable —
 * it was assembled, sent and discarded. This shows the stored copy, with the
 * time it was written, so the answer is about the moment being investigated
 * rather than about now.
 *
 * FACTS FIRST, because they are the part that is both new and hard to see
 * elsewhere. Everything else in the projection is derived from rows the console
 * already shows; a fact is a value lifted out of a response that has since been
 * clipped, and there is nowhere else to read it.
 */

const preview = (value: unknown) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

function FactRow({ fact }: {fact: Fact;}) {
  return (
    <li className="rounded border border-line bg-canvas px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[11px] text-ink-900">{fact.key}</span>
        <span className="shrink-0 font-mono text-[10px] text-ink-400">{fact.step}</span>
      </div>
      {fact.found ?
      <p className="mt-1 break-words font-mono text-[11px] leading-snug text-ink-700">
          {preview(fact.value)}
          {fact.clipped && <span className="text-ink-400"> (clipped)</span>}
        </p> :

      <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-warn-700">
          <AlertCircleIcon className="mt-px h-3 w-3 shrink-0" strokeWidth={2.4} />
          {/* Written down rather than hidden: the step asked for this and will
              go on believing it was remembered. */}
          {fact.note || `'${fact.path}' was not in the result`}
        </p>
      }
    </li>);

}

export function ModelContext({ taskId, revision }: {taskId: string;revision: number;}) {
  const [data, setData] = useState<TaskStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    tasksApi.state(taskId).
    then((d) => { if (!cancelled) setData(d); }).
    catch((err) => {
      if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the task state.');
    });
    return () => { cancelled = true; };
  }, [taskId, revision]);

  if (error) return <p className="text-[12px] text-danger-700">{error}</p>;
  if (!data) return <p className="text-[12px] text-ink-500">Loading…</p>;

  if (!data.state) {
    return (
      <p className="py-4 text-center text-[12px] text-ink-500">
        Nothing yet — the projection is written the first time the runtime builds a prompt.
      </p>);

  }

  const facts = data.state.facts || [];

  return (
    <div>
      {facts.length === 0 ?
      <p className="text-[12px] text-ink-500">
          No values kept yet. A step records one when it says a result will be needed later.
        </p> :

      <>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-500">
            <BookmarkIcon className="h-3 w-3" strokeWidth={2.4} />
            {facts.length} value{facts.length === 1 ? '' : 's'} kept from results that have since
            been shortened
          </p>
          <ul className="space-y-1.5">
            {facts.map((f) => <FactRow key={`${f.step}-${f.key}`} fact={f} />)}
          </ul>
        </>
      }

      <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-line pt-2.5">
        <button
          type="button"
          onClick={() => setRaw(!raw)}
          className="text-[11px] text-ink-500 transition-colors duration-150 ease-out hover:text-ink-900">

          {raw ? 'Hide' : 'Show'} the whole projection
        </button>
        {data.built_at &&
        <span className="tabular shrink-0 text-[10px] text-ink-400">
            as of {new Date(data.built_at).toLocaleTimeString()}
          </span>
        }
      </div>

      {raw &&
      <pre className="mt-2 max-h-80 overflow-auto rounded border border-line bg-canvas p-2.5 font-mono text-[10px] leading-relaxed text-ink-700">
          {JSON.stringify(data.state, null, 2)}
        </pre>
      }
    </div>);

}
