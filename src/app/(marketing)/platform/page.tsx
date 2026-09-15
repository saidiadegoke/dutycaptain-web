import type { Metadata } from 'next';
import { Platform } from '@/components/views/marketing/Platform';

export const metadata: Metadata = { title: 'Platform' };

export default function Page() {
  return <Platform />;
}
