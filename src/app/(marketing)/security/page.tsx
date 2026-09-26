import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Security } from '@/components/views/marketing/Security';

export const metadata: Metadata = pageMetadata({
  title: 'Trust & control: approvals and permissions',
  description:
  'Nothing consequential happens without your approval. Scoped, revocable access to your computer, passwords never shown to the AI, and a record of every step.',
  path: '/security'
});

export default function Page() {
  return <Security />;
}
