import type { Metadata } from 'next';
import { AuditTrail } from '@/components/views/AuditTrail';

export const metadata: Metadata = { title: 'Audit trail' };

export default function Page() {
  return <AuditTrail />;
}
