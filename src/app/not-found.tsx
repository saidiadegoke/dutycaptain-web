import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function NotFound() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          That page does not exist
        </h1>
        <p className="text-[15px] text-ink-700">
          The link may be out of date, or the page may have moved.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/"
            className="rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-700">
            Back to home
          </Link>
          <Link
            href="/app"
            className="rounded-md border border-line px-3.5 py-2 text-[13px] font-medium text-ink-800 transition-colors duration-150 ease-out hover:bg-canvas">
            Open the console
          </Link>
        </div>
      </div>
    </MarketingShell>);

}
