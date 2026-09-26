import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Developers } from '@/components/views/marketing/Developers';

export const metadata: Metadata = pageMetadata({
  title: 'Developers: API, live events and approvals',
  description:
  'Start DutyCaptain tasks from your own systems, stream every step as it happens and answer approvals over the API, with webhooks and API keys.',
  path: '/developers'
});

export default function Page() {
  return <Developers />;
}
