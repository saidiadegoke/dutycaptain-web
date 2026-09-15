import type { Metadata } from 'next';
import { NewJob } from '@/components/views/NewJob';

export const metadata: Metadata = { title: 'New job' };

export default function Page() {
  return <NewJob />;
}
