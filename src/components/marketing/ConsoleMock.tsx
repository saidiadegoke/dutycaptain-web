const steps = [
{ label: 'Fetch last month’s orders', route: 'connected service', state: 'done', meta: '1.2s' },
{ label: 'Analyse 12,438 orders', route: 'built-in', state: 'done', meta: '8.4s' },
{ label: 'Build the workbook', route: 'built-in', state: 'done', meta: 'checked' },
{ label: 'Format charts in Excel', route: 'your computer', state: 'run', meta: 'running' },
{ label: 'Email to accountant', route: 'connected service', state: 'wait', meta: 'needs approval' }];


const chrome: Record<string, string> = {
  done: 'border-line bg-panel text-ink-700',
  run: 'border-brand-200 bg-brand-50 text-brand-700',
  wait: 'border-warn-100 bg-warn-50 text-warn-700'
};

const mark: Record<string, string> = { done: '✓', run: '→', wait: '○' };

/** A compact, honest representation of the task detail view in the console. */
export function ConsoleMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-pop">
      <div className="flex items-center justify-between border-b border-line bg-canvas px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
          <span className="text-[12px] font-medium text-ink-900">Prepare monthly sales report</span>
        </div>
        <span className="tabular font-mono text-[10px] uppercase tracking-wide text-ink-500">
          4m 12s · $0.38
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between">
          <p className="tabular text-[22px] font-semibold leading-none tracking-tight text-ink-900">
            72%
          </p>
          <p className="tabular text-[11px] text-ink-500">3 of 5 steps checked</p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full w-[72%] rounded-full bg-brand-600" />
        </div>

        <div className="mt-4 space-y-1.5">
          {steps.map((s) =>
          <div
            key={s.label}
            className={`flex items-center justify-between gap-3 rounded border px-2.5 py-1.5 text-[11px] ${chrome[s.state]}`}>

              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[10px]" aria-hidden="true">{mark[s.state]}</span>
                <span className="truncate font-medium">{s.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="hidden font-mono text-[10px] text-ink-400 sm:inline">{s.route}</span>
                <span className="font-mono text-[10px]">{s.meta}</span>
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
          {['Pause', 'Take control', 'Stop'].map((b) =>
          <span
            key={b}
            className="rounded border border-line bg-canvas px-2 py-1 text-[10px] font-medium text-ink-700">

              {b}
            </span>
          )}
        </div>
      </div>
    </div>);

}
