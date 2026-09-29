'use client';

import { useState } from 'react';
import { ChevronRightIcon, DatabaseIcon } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import type { TaskSource } from '@/lib/types';
import { ago } from '@/utils/format';

const KIND: Record<TaskSource['kind'], string> = {
  web: 'Web page', http: 'Fetched', attachment: 'Attached file', upload: 'Uploaded file', person: 'Your answer',
};

/**
 * What the task worked from (migration 060): every page, file and answer, with
 * each version it saw — the hash a value's provenance points at. Collapsed,
 * and read only when opened.
 */
export function TaskSources({ taskId }: {taskId: string;}) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<TaskSource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) tasksApi.sources(taskId).then(setList).catch(() => setError('Could not load the sources.'));
  }

  return (
    <section className="rounded-xl border border-line bg-panel shadow-panel">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-2 px-5 py-3 text-left">
        <ChevronRightIcon className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`} strokeWidth={2.4} />
        <DatabaseIcon className="h-3.5 w-3.5 text-ink-500" strokeWidth={2.2} />
        <span className="text-[12px] font-semibold text-ink-700">Sources</span>
        <span className="text-[12px] text-ink-400">what this task worked from</span>
      </button>
      {open &&
      <div className="border-t border-line px-5 py-3">
          {error && <p className="text-[12px] text-danger-700">{error}</p>}
          {!error && !list && <p className="text-[12px] text-ink-500">Loading…</p>}
          {list && list.length === 0 && <p className="text-[12px] text-ink-500">Nothing recorded yet.</p>}
          {list && list.length > 0 &&
        <ul className="space-y-2">
              {list.map((s) =>
          <li key={s.id} className="text-[12px]">
                  <p className="text-ink-900">
                    <span className="mr-1.5 rounded bg-canvas px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wide text-ink-500">{KIND[s.kind]}</span>
                    <span className="break-all">{s.title || s.locator}</span>
                  </p>
                  {s.title && s.kind !== 'person' && <p className="break-all font-mono text-[11px] text-ink-400">{s.locator}</p>}
                  {s.carried_from && <p className="text-[11px] text-ink-500">Carried over from the earlier attempt — reused, not fetched again.</p>}
                  {s.signals && s.signals.length > 0 &&
            <p className="mt-0.5 text-[11px] text-warn-700">
                      Tried to give orders — read as data, not obeyed: {s.signals.map((x) => `“${x.excerpt}”`).join(' · ')}
                    </p>
            }
                  <ul className="mt-1 space-y-0.5 pl-1">
                    {s.versions.map((v) =>
              <li key={v.id} className="font-mono text-[11px] text-ink-500" title={v.hash}>
                        v{v.version} · {v.hash.slice(0, 12)} · {v.bytes.toLocaleString()} bytes{v.passages ? ` · ${v.passages} passage${v.passages === 1 ? '' : 's'}` : ''} · {ago(v.retrieved_at)}
                        {!v.kept && <span className="text-ink-400"> · content deleted (retention), hash kept</span>}
                      </li>
              )}
                  </ul>
                </li>
          )}
            </ul>
        }
        </div>
      }
    </section>);

}
