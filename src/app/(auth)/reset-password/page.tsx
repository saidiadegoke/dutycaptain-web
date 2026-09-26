import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { Suspense } from 'react';
import { ResetPassword } from '@/components/views/auth/ResetPassword';

export const metadata: Metadata = { title: 'Choose a new password', robots: NOINDEX };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>);

}
