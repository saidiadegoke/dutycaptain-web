import type { Metadata } from 'next';
import { TaskDetail } from '@/components/views/TaskDetail';

export const metadata: Metadata = { title: 'Task detail' };

export default function Page() {
  return <TaskDetail />;
}
