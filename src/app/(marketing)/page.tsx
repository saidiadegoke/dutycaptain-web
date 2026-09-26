import type { Metadata } from 'next';
import { Home } from '@/components/views/marketing/Home';
import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_EMAIL, pageMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'DutyCaptain — Hand over routine work, checked and approved',
  description:
  'Describe a task in plain language. DutyCaptain plans it, does each step by the most reliable route, checks the result, and asks before anything that matters.',
  path: '/',
  absoluteTitle: true
});

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
  {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'HelloWorld Technologies',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    email: CONTACT_EMAIL
  },
  {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` }
  },
  {
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, macOS, Windows, Linux',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` }
  }]

};

export default function Page() {
  return (
    <>
      <JsonLd data={structuredData} />
      <Home />
    </>);

}
