'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, FlagIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { AgentTag } from '@/components/StatusBadge';
import { approvals } from '@/data/approvals';
import { delta, naira } from '@/utils/format';

type Decision = 'approved' | 'rejected';

const riskChrome = {
  high: 'border-danger-100 bg-danger-50 text-danger-700',
  medium: 'border-warn-100 bg-warn-50 text-warn-700',
  low: 'border-line bg-canvas text-ink-500'
} as const;

export function Approvals() {
  const [selectedId, setSelectedId] = useState(approvals[0].id);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const selected = approvals.find((a) => a.id === selectedId)!;
  const decision = decisions[selected.id];

  return (
    <div className="mx-auto max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Approvals</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          Agents run autonomously until an action touches the business. These are paused mid-graph
          and will resume the moment you decide.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="Queue" description="3 waiting" padded={false}>
          <ul className="divide-y divide-line">
            {approvals.map((a) => {
              const d = decisions[a.id];
              const isActive = a.id === selectedId;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    aria-current={isActive}
                    className={`w-full border-l-2 px-4 py-3.5 text-left transition-colors duration-150 ease-out ${
                    isActive ?
                    'border-l-brand-600 bg-brand-50' :
                    'border-l-transparent hover:bg-canvas'}`
                    }>
                    
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold tracking-tight text-ink-900">
                        {a.action}
                      </p>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-wide ${riskChrome[a.risk]}`}>
                        
                        {a.risk}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-ink-500">{a.target}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <AgentTag agent={a.requestedBy} />
                      <span className="font-mono text-[10px] text-ink-400">{a.requestedAt}</span>
                      {d &&
                      <span
                        className={`ml-auto text-[10px] font-semibold uppercase tracking-wide ${
                        d === 'approved' ? 'text-ok-700' : 'text-danger-700'}`
                        }>
                        
                          {d}
                        </span>
                      }
                    </div>
                  </button>
                </li>);

            })}
          </ul>
        </Panel>

        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-xl border border-line bg-panel shadow-panel">
          
          <header className="border-b border-line px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-ink-400">
                  {selected.id} · {selected.jobId}
                </p>
                <h2 className="mt-1.5 text-[18px] font-semibold tracking-tight text-ink-900">
                  {selected.action}
                </h2>
                <p className="mt-1 text-[13px] text-ink-700">{selected.target}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                  setDecisions((d) => ({ ...d, [selected.id]: 'rejected' }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-danger-700 transition-colors duration-150 ease-out hover:bg-danger-50">
                  
                  <XIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() =>
                  setDecisions((d) => ({ ...d, [selected.id]: 'approved' }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
                  
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                  Approve &amp; continue
                </button>
              </div>
            </div>

            {decision &&
            <div
              className={`mt-4 rounded-lg border px-3.5 py-2.5 text-[12px] font-medium ${
              decision === 'approved' ?
              'border-ok-100 bg-ok-50 text-ok-700' :
              'border-danger-100 bg-danger-50 text-danger-700'}`
              }>
              
                {decision === 'approved' ?
              'Approved. The graph resumed at “Update SmartStore” and the decision was written to the audit trail.' :
              'Rejected. The job is held and the planner was asked for an alternative branch.'}
              </div>
            }

            <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-ink-700">
              {selected.summary}
            </p>
          </header>

          <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
            {[
            { label: 'Records affected', value: selected.changes.toLocaleString('en-US') },
            { label: 'Flagged for review', value: String(selected.sample.filter((s) => s.flag).length) },
            { label: 'Median confidence', value: '0.94' },
            { label: 'Reversible', value: selected.risk === 'high' ? 'Snapshot kept' : 'Yes' }].
            map((m) =>
            <div key={m.label} className="px-6 py-4">
                <p className="text-[11px] text-ink-500">{m.label}</p>
                <p className="tabular mt-1 text-[16px] font-semibold text-ink-900">{m.value}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-ink-700">
                Proposed changes — sample of {selected.sample.length}
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-warn-700">
                <TriangleAlertIcon className="h-3.5 w-3.5" strokeWidth={2} />
                Flagged rows need a second look
              </span>
            </div>

            <div className="mt-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    {['SKU', 'Product', 'Current', 'Proposed', 'Change', 'Source', 'Confidence'].map(
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
                  {selected.sample.map((row) => {
                    const change = delta(row.current, row.proposed);
                    const down = row.proposed < row.current;
                    return (
                      <tr key={row.sku} className={row.flag ? 'bg-warn-50/60' : ''}>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-ink-700">
                          {row.sku}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-900">
                          <span className="inline-flex items-center gap-1.5">
                            {row.product}
                            {row.flag &&
                            <span className="inline-flex items-center gap-1 rounded border border-warn-100 bg-warn-50 px-1 py-[1px] text-[10px] font-medium text-warn-700">
                                <FlagIcon className="h-2.5 w-2.5" strokeWidth={2.4} />
                                {row.flag}
                              </span>
                            }
                          </span>
                        </td>
                        <td className="tabular px-4 py-2.5 text-[12px] text-ink-500">
                          {naira(row.current)}
                        </td>
                        <td className="tabular px-4 py-2.5 text-[12px] font-semibold text-ink-900">
                          {naira(row.proposed)}
                        </td>
                        <td
                          className={`tabular px-4 py-2.5 text-[12px] font-medium ${
                          change === '0%' ?
                          'text-ink-400' :
                          down ?
                          'text-ok-700' :
                          'text-danger-700'}`
                          }>
                          
                          {change}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-ink-700">{row.source}</td>
                        <td className="tabular px-4 py-2.5 text-[12px] text-ink-700">
                          {row.confidence.toFixed(2)}
                        </td>
                      </tr>);

                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[12px] text-ink-500">
              Approving writes every record in one batch and keeps a pre-write snapshot for 30
              days.
            </p>
          </div>
        </motion.div>
      </div>
    </div>);

}