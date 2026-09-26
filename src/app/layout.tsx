import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { INDEXABLE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
});

export const viewport: Viewport = {
  themeColor: '#0b1220',
  colorScheme: 'light'
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  creator: 'HelloWorld Technologies',
  publisher: 'HelloWorld Technologies',
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_GB',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION
  },
  robots: INDEXABLE ?
  { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } } :
  { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false }
};

export default function RootLayout({ children }: {children: React.ReactNode;}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>);

}
