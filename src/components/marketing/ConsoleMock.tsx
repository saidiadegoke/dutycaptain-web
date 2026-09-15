
const nodes = [
{ label: 'Load catalog', state: 'done' },
{ label: 'Resolve URLs', state: 'done' }];


const branch = [
{ label: 'Extract price', state: 'run' },
{ label: 'Verify', state: 'run' },
{ label: 'Stock', state: 'run' }];


const chrome: Record<string, string> = {
  done: 'border-line bg-panel text-ink-700',
  run: 'border-brand-200 bg-brand-50 text-brand-700',
  wait: 'border-warn-100 bg-warn-50 text-warn-700'
};

/** A compact, honest representation of the running-job view in the console. */
export function ConsoleMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-pop">
      <div className="flex items-center justify-between border-b border-line bg-canvas px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
          <span className="text-[12px] font-medium text-ink-900">job_8412 · running</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-500">
          20 workers
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between">
          <p className="tabular text-[22px] font-semibold leading-none tracking-tight text-ink-900">
            69%
          </p>
          <p className="tabular text-[11px] text-ink-500">2,418 / 3,500 SKUs</p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full w-[69%] rounded-full bg-brand-600" />
        </div>

        <div className="mt-4 space-y-1.5">
          {nodes.map((n) =>
          <div
            key={n.label}
            className={`flex items-center justify-between rounded border px-2.5 py-1.5 text-[11px] ${chrome[n.state]}`}>
            
              <span className="font-medium">{n.label}</span>
              <span className="font-mono text-[10px]">done</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-1.5">
            {branch.map((n) =>
            <div
              key={n.label}
              className={`rounded border px-2 py-1.5 text-[11px] font-medium ${chrome[n.state]}`}>
              
                {n.label}
              </div>
            )}
          </div>
          <div
            className={`flex items-center justify-between rounded border px-2.5 py-1.5 text-[11px] ${chrome.wait}`}>
            
            <span className="font-medium">Human approval</span>
            <span className="font-mono text-[10px]">3,487 changes</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-10 gap-1" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) =>
          <span
            key={i}
            className={`h-4 rounded-sm border ${
            i === 11 ?
            'border-danger-100 bg-danger-50' :
            i === 3 ?
            'border-warn-100 bg-warn-50' :
            i === 7 || i === 16 ?
            'border-line bg-canvas' :
            'border-brand-200 bg-brand-50'}`
            } />

          )}
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-ink-400">
          Playwright worker fleet
        </p>
      </div>
    </div>);

}