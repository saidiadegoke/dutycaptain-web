'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel } from '@/components/Panel';
import { watchesApi } from '@/lib/api';
import type { Watch, WatchDetail } from '@/lib/types';
import { ago } from '@/utils/format';

const n = (v: number) => v.toLocaleString();

/**
 * What standing tasks remember across runs (phase 7): each item a watch has
 * seen, when first, its latest numbers, how they grew since the run before,
 * and whether it was sent. Computed in code; reset starts a new baseline.
 */
export function WatchesPanel() {
  const [list, setList] = useState<Watch[] | null>(null);
  const [open, setOpen] = useState<WatchDetail | null>(null);
  const load = () => watchesApi.list().then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  if (list && list.length === 0) return null;

  return (
    <div className="mt-8">
      <Panel title="What runs remember" description="Watches: what each run of a standing task saw, how it grew since the last run, and what was already sent — so nothing is sent twice.">
        <ul className="divide-y divide-line rounded-md border border-line">
          {(list || []).map((w) =>
          <li key={w.id} className="px-3 py-2 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => (open?.id === w.id ? setOpen(null) : watchesApi.get(w.id).then(setOpen).catch(() => {}))} className="cursor-pointer text-left">
                  <span className="font-medium text-ink-900">{w.name}</span>
                  <span className="text-ink-500"> · {w.runs} run{w.runs === 1 ? '' : 's'} · {w.items ?? 0} seen · {w.sent ?? 0} sent{w.last_run_at ? ` · last ${ago(w.last_run_at)}` : ''}</span>
                </button>
                <button type="button" onClick={() => watchesApi.reset(w.id).then(() => { setOpen(null); load(); }).catch(() => {})} className="cursor-pointer text-[12px] font-medium text-ink-600 hover:text-ink-900">Reset</button>
              </div>
              {open?.id === w.id &&
            <table className="mt-2 w-full text-[12px]">
                  <thead><tr className="text-left text-ink-500"><th className="py-1 pr-2 font-medium">Item</th><th className="pr-2 font-medium">Latest</th><th className="pr-2 font-medium">Since last run</th><th className="font-medium">Sent</th></tr></thead>
                  <tbody>
                    {open.items.map((i) => {
                  const m = open.metric_fields[0];
                  const g = m ? i.growth[m] : undefined;
                  const label = String(i.data.text || i.data.title || i.data.trend || i.key).slice(0, 80);
                  return (
                    <tr key={i.key} className="border-t border-line align-top">
                          <td className="py-1 pr-2 text-ink-800">{typeof i.data.url === 'string' ? <a href={i.data.url} target="_blank" rel="noreferrer" className="hover:text-brand-700">{label}</a> : label}<div className="text-ink-500">first seen {ago(i.first_seen_at)} · {i.readings} reading{i.readings === 1 ? '' : 's'}</div></td>
                          <td className="pr-2 tabular text-ink-700">{m && i.latest[m] !== undefined ? `${n(i.latest[m])} ${m}` : '—'}</td>
                          <td className={`pr-2 tabular ${g && (g.pct || 0) > 0 ? 'text-ok-700' : 'text-ink-500'}`}>{g ? `${g.pct !== null ? `${g.pct > 0 ? '+' : ''}${g.pct}%` : `+${n(g.change)}`} in ${g.over_hours}h` : 'new'}</td>
                          <td className="text-ink-500">{i.sent_at ? <>{ago(i.sent_at)}{i.sent_task_id && <> · <Link href={`/app/tasks/${i.sent_task_id}`} className="text-brand-700 hover:text-brand-500">run</Link></>}</> : i.pending ? 'with a run' : '—'}</td>
                        </tr>);
                })}
                  </tbody>
                </table>}
            </li>
          )}
        </ul>
      </Panel>
    </div>);
}
