import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Platform } from '@/components/views/marketing/Platform';

export const metadata: Metadata = pageMetadata({
  title: 'How it works: plans, routes and checks',
  description:
  'See how DutyCaptain turns one instruction into a visible plan, picks the simplest reliable route for each step, checks every change and keeps a record.',
  path: '/platform'
});

export default function Page() {
  return <Platform />;
}
