import type { Metadata } from 'next';
import { Devices } from '@/components/views/Devices';

export const metadata: Metadata = { title: 'Computers' };

export default function Page() {
  return <Devices />;
}
