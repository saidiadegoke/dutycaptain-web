import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { pricingFaq } from '@/data/marketing';
import { Pricing } from '@/components/views/marketing/Pricing';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing: plans for individuals and teams',
  description:
  'Starter, Team and Enterprise plans for DutyCaptain. In early access, every task shows its cost live, and the spending limits you set are enforced.',
  path: '/pricing'
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: pricingFaq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          }))
        }} />
      
      <Pricing />
    </>);
}
