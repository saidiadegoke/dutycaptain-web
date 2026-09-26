import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { Suspense } from 'react';
import { SignUp } from '@/components/views/auth/SignUp';

export const metadata: Metadata = { title: 'Create an account', robots: NOINDEX };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignUp />
    </Suspense>);

}
