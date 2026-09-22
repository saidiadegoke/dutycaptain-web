import type { Metadata } from 'next';
import { NewTask } from '@/components/views/NewTask';

export const metadata: Metadata = { title: 'New task' };

export default function Page() {
  return <NewTask />;
}
