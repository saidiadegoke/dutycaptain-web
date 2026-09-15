import type { Metadata } from 'next';
import { JobDetail } from '@/components/views/JobDetail';

export const metadata: Metadata = { title: 'Job detail' };

export default function Page() {
  return <JobDetail />;
}
