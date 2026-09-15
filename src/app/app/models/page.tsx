import type { Metadata } from 'next';
import { Models } from '@/components/views/Models';

export const metadata: Metadata = { title: 'Runtime' };

export default function Page() {
  return <Models />;
}
