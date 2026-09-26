import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Deployment } from '@/components/views/marketing/Deployment';

export const metadata: Metadata = pageMetadata({
  title: 'Where it runs: cloud, your computer, roadmap',
  description:
  'DutyCaptain runs in the cloud and uses your computer only when a task needs it. Choose the AI model per step, and see what is available and what is coming.',
  path: '/deployment'
});

export default function Page() {
  return <Deployment />;
}
