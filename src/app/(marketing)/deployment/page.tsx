import type { Metadata } from 'next';
import { Deployment } from '@/components/views/marketing/Deployment';

export const metadata: Metadata = { title: 'Deployment' };

export default function Page() {
  return <Deployment />;
}
