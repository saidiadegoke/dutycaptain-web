import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { LegalPage } from '@/components/marketing/LegalPage';
import { LEGAL, termsSections } from '@/data/legal';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of use',
  description:
  'The terms for using DutyCaptain: what it does on your behalf, what you remain responsible for, acceptable use, fees during early access, and liability.',
  path: '/terms'
});

export default function Page() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      lede="The agreement between you and us when you use DutyCaptain: what it does on your behalf, what you remain responsible for, and what each of us can expect."
      effective={LEGAL.effective}
      sections={termsSections} />);

}
