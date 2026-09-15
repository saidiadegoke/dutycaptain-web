import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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
  title: {
    default: 'DutyCaptain',
    template: '%s · DutyCaptain'
  },
  description:
  'An autonomous execution layer that selects the right actuator for each step of a task — native calls, APIs, browser automation, or your own computer.',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: {children: React.ReactNode;}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>);

}
