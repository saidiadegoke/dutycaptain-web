import type { Metadata } from 'next';
import { Company } from '@/components/views/marketing/Company';

export const metadata: Metadata = { title: 'Company' };

export default function Page() {
  return <Company />;
}
