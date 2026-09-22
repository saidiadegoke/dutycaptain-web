'use client';

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { AgentTag } from '@/components/StatusBadge';
import { auditEntries } from '@/data/audit';
import { AuditEntry } from '@/types';

const outcomeChrome: Record<AuditEntry['outcome'], string> = {
  ok: 'border-ok-100 bg-ok-50 text-ok-700',
  retry: 'border-warn-100 bg-warn-50 text-warn-700',
  blocked: 'border-brand-200 bg-brand-50 text-brand-700',
  failed: 'border-danger-100 bg-danger-50 text-danger-700'
};

const outcomes: Array<AuditEntry['outcome'] | 'all'> = ['all', 'ok', 'retry', 'blocked', 'failed'];

export function AuditTrail() {
  const [outcome, setOutcome] = useState<AuditEntry['outcome'] | 'all'>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(
    () =>
    auditEntries.filter((e) => {
      const matchesOutcome = outcome === 'all' || e.outcome === outcome;
      const matchesQuery =
      query.trim() === '' ||
      (e.action + e.target + e.model + e.taskId).
      toLowerCase().
      includes(query.trim().toLowerCase());
      return matchesOutcome && matchesQuery;
    }),
    [outcome, query]
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Audit trail</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          Every model call, browser action and human decision, in order. This is the record you
          hand to finance when a price looks wrong.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border border-line bg-panel p-1">
          {outcomes.map((o) =>
          <button
            key={o}
            type="button"
            onClick={() => setOutcome(o)}
            className={`rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors duration-150 ease-out ${
            outcome === o ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-canvas'}`
            }>
            
              {o}
            </button>
          )}
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by action, target, model or task id…"
            aria-label="Filter audit trail"
            className="w-full bg-transparent text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none" />
          
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Time', 'Agent', 'Action', 'Target', 'Model', 'Tokens', 'Task', 'Outcome'].map(
                  (h) =>
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    
                      {h}
                    </th>

                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) =>
              <tr key={e.id} className="transition-colors duration-150 ease-out hover:bg-canvas">
                  <td className="tabular whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-ink-500">
                    {e.at}
                  </td>
                  <td className="px-4 py-2.5">
                    <AgentTag agent={e.agent} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-medium text-ink-900">
                    {e.action}
                  </td>
                  <td className="max-w-[320px] truncate px-4 py-2.5 text-[12px] text-ink-700">
                    {e.target}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-ink-700">
                    {e.model}
                  </td>
                  <td className="tabular px-4 py-2.5 text-[12px] text-ink-500">
                    {e.tokens > 0 ? e.tokens.toLocaleString('en-US') : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-ink-500">{e.taskId}</td>
                  <td className="px-4 py-2.5">
                    <span
                    className={`inline-flex rounded border px-1.5 py-[2px] text-[11px] font-medium capitalize ${outcomeChrome[e.outcome]}`}>
                    
                      {e.outcome}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length === 0 &&
        <div className="px-5 py-14 text-center">
            <p className="text-[13px] font-medium text-ink-900">No events match this filter</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Try a broader outcome or clear the search.
            </p>
          </div>
        }
      </div>
    </div>);

}