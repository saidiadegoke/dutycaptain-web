import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
import { Suspense } from 'react';
import { SignIn } from '@/components/views/auth/SignIn';

export const metadata: Metadata = { title: 'Sign in', robots: NOINDEX };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>);

}
