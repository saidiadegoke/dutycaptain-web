import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { Company } from '@/components/views/marketing/Company';

export const metadata: Metadata = pageMetadata({
  title: 'About us and early access',
  description:
  'Why we built DutyCaptain, the principles behind it, and how to join early access. DutyCaptain is built by HelloWorld Technologies.',
  path: '/company'
});

export default function Page() {
  return <Company />;
}
