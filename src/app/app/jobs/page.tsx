import type { Metadata } from 'next';
import { Jobs } from '@/components/views/Jobs';

export const metadata: Metadata = { title: 'Jobs' };

export default function Page() {
  return <Jobs />;
}
