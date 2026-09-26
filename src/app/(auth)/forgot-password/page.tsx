import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { Suspense } from 'react';
import { ForgotPassword } from '@/components/views/auth/ForgotPassword';

export const metadata: Metadata = { title: 'Reset your password', robots: NOINDEX };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>);

}
