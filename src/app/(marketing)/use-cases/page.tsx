import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { UseCases } from '@/components/views/marketing/UseCases';

export const metadata: Metadata = pageMetadata({
  title: 'Use cases: routine work you can hand over',
  description:
  'Monthly reports, invoices, price checks, desktop applications and portals — the repetitive work professionals and teams hand to DutyCaptain first.',
  path: '/use-cases'
});

export default function Page() {
  return <UseCases />;
}
