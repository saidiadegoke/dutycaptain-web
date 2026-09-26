'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { session } from '@/lib/api';

/**
 * Keep the signed-out away from pages that need a session.
 *
 * Checked on the client, not in middleware, because the token lives in
 * `localStorage` — which the server cannot see. That is a consequence of the
 * API issuing JWTs in the response body to a console on another origin; a
 * cookie session would let this move server-side, and that is the P7-01 change
 * noted in the API client.
 *
 * Renders nothing until the check has run. Showing the page first and
 * redirecting after would flash a shell full of empty panels, which reads as a
 * broken app rather than a sign-in.
 */

export function AuthGate({ children }: {children: React.ReactNode;}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking');

  useEffect(() => {
    const check = () => {
      if (session.isSignedIn()) return setState('in');
      setState('out');
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
      return undefined;
    };
    check();
    // The client dispatches this after a sign-in, a sign-out, or a refresh that
    // failed — so a session expiring mid-session moves the user, rather than
    // leaving them on a page where every request 401s.
    window.addEventListener('dc:session', check);
    return () => window.removeEventListener('dc:session', check);
  }, [pathname, router]);

  if (state !== 'in') return null;
  return <>{children}</>;
}
