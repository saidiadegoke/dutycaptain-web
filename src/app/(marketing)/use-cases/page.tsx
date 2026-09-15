import type { Metadata } from 'next';
import { UseCases } from '@/components/views/marketing/UseCases';

export const metadata: Metadata = { title: 'Use cases' };

export default function Page() {
  return <UseCases />;
}
