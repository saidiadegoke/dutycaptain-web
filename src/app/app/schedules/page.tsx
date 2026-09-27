import type { Metadata } from 'next';
import { Schedules } from '@/components/views/Schedules';

export const metadata: Metadata = { title: 'Schedules' };

export default function Page() {
  return <Schedules />;
}
