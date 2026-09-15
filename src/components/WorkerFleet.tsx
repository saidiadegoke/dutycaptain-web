import { Worker } from '@/types';

const cell: Record<Worker['status'], string> = {
  busy: 'border-brand-200 bg-brand-50 text-brand-700',
  idle: 'border-line bg-canvas text-ink-400',
  retrying: 'border-warn-100 bg-warn-50 text-warn-700',
  error: 'border-danger-100 bg-danger-50 text-danger-700'
};

const legend: Array<{status: Worker['status'];label: string;}> = [
{ status: 'busy', label: 'Busy' },
{ status: 'retrying', label: 'Retrying' },
{ status: 'error', label: 'Blocked' },
{ status: 'idle', label: 'Idle' }];


export function WorkerFleet({ workers }: {workers: Worker[];}) {
  return (
    <div>
      <ul className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {workers.map((w) =>
        <li key={w.id}>
            <div
            title={`${w.id} · ${w.browser} · ${w.retailer} · ${w.sku} · ${w.step}`}
            className={`flex h-12 flex-col justify-between rounded border px-1.5 py-1 ${cell[w.status]}`}>
            
              <span className="font-mono text-[10px] font-medium">{w.id}</span>
              <span className="truncate text-[10px] leading-tight">
                {w.status === 'idle' ? 'idle' : w.retailer}
              </span>
            </div>
          </li>
        )}
      </ul>
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {legend.map((l) =>
        <li key={l.status} className="flex items-center gap-1.5 text-[11px] text-ink-500">
            <span className={`h-2 w-2 rounded-sm border ${cell[l.status]}`} aria-hidden="true" />
            {l.label}
            <span className="tabular text-ink-400">
              {workers.filter((w) => w.status === l.status).length}
            </span>
          </li>
        )}
      </ul>
    </div>);

}