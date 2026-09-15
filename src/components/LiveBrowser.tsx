import { CameraIcon, LockIcon, RotateCwIcon } from 'lucide-react';

interface LiveBrowserProps {
  url: string;
  worker: string;
  step: string;
}

/**
 * A representation of what the browser worker currently sees, with the vision
 * agent's detected regions drawn over it. Stands in for the live screenshot
 * stream coming off the Playwright worker.
 */
export function LiveBrowser({ url, worker, step }: LiveBrowserProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="flex items-center gap-2 border-b border-line bg-panel px-3 py-2">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-line bg-canvas px-2 py-1">
          <LockIcon className="h-3 w-3 shrink-0 text-ok-600" strokeWidth={2.2} />
          <span className="truncate font-mono text-[11px] text-ink-700">{url}</span>
        </div>
        <span className="hidden items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-ink-500 sm:inline-flex">
          <RotateCwIcon className="h-3 w-3 animate-spin" strokeWidth={2.2} />
          {worker}
        </span>
      </div>

      <div className="relative bg-white p-4">
        <div className="flex gap-4">
          <div className="h-28 w-28 shrink-0 rounded border border-line bg-canvas" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-3/4 rounded-sm bg-line-strong" aria-hidden="true" />
            <div className="mt-1.5 h-2.5 w-1/2 rounded-sm bg-line" aria-hidden="true" />

            <div className="relative mt-4 inline-block">
              <span className="text-[17px] font-semibold tracking-tight text-ink-900">
                ₦1,249,900
              </span>
              <span className="pointer-events-none absolute -inset-1.5 rounded border border-brand-600" aria-hidden="true">
                <span className="absolute -top-4 left-0 rounded-sm bg-brand-600 px-1 font-mono text-[9px] text-white">
                  price 0.96
                </span>
              </span>
            </div>

            <div className="relative mt-5 inline-block">
              <span className="rounded bg-ink-900 px-3 py-1.5 text-[11px] font-medium text-white">
                Add to Cart
              </span>
              <span className="pointer-events-none absolute -inset-1.5 rounded border border-dashed border-ok-600" aria-hidden="true">
                <span className="absolute -top-4 left-0 rounded-sm bg-ok-600 px-1 font-mono text-[9px] text-white">
                  in stock
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-1.5" aria-hidden="true">
          <div className="h-2 w-full rounded-sm bg-line" />
          <div className="h-2 w-5/6 rounded-sm bg-line" />
          <div className="h-2 w-2/3 rounded-sm bg-line" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-panel px-3 py-2">
        <p className="truncate text-[11px] text-ink-500">
          Step: <span className="font-medium text-ink-700">{step}</span>
        </p>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-ink-400">
          <CameraIcon className="h-3 w-3" strokeWidth={2} />
          frame 41
        </span>
      </div>
    </div>);

}