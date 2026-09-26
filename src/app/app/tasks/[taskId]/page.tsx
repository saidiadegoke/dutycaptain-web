import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TaskDetail } from '@/components/views/TaskDetail';

export const metadata: Metadata = { title: 'Task detail' };

export default function Page() {
  // TaskDetail reads `?view=` (useSearchParams), which Next requires to sit
  // inside a Suspense boundary.
  return (
    <Suspense fallback={<p className="mx-auto max-w-[1400px] text-[13px] text-ink-500">Loading task…</p>}>
      <TaskDetail />
    </Suspense>);

}
