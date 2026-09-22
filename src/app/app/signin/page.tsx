import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignIn } from '@/components/views/SignIn';

export const metadata: Metadata = { title: 'Sign in' };

export default function Page() {
  // `useSearchParams` needs a Suspense boundary to avoid opting the whole route
  // into client-side rendering at build time.
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>);

}
