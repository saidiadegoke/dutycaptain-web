import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Connections } from '@/components/views/Connections';

export const metadata: Metadata = { title: 'Connections' };

export default function Page() {
  // The platform sends the owner back here with ?connected= or ?connection_error=.
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl text-[13px] text-ink-500">Loading…</p>}>
      <Connections />
    </Suspense>);
}
