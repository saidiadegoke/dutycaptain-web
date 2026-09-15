import type { Metadata } from 'next';
import { Approvals } from '@/components/views/Approvals';

export const metadata: Metadata = { title: 'Approvals' };

export default function Page() {
  return <Approvals />;
}
