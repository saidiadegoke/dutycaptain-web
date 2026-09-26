import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { LegalPage } from '@/components/marketing/LegalPage';
import { LEGAL, privacySections } from '@/data/legal';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy policy',
  description:
  'What DutyCaptain collects, why, how long it is kept, and your choices — including what leaves your computer and which AI providers see task content.',
  path: '/privacy'
});

export default function Page() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      lede="What we collect, why, and the choices you have. DutyCaptain collects only what a task needs, and nothing leaves your computer without a record."
      effective={LEGAL.effective}
      sections={privacySections} />);

}
