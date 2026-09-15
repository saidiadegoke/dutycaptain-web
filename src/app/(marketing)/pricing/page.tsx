import type { Metadata } from 'next';
import { Pricing } from '@/components/views/marketing/Pricing';

export const metadata: Metadata = { title: 'Pricing' };

export default function Page() {
  return <Pricing />;
}
