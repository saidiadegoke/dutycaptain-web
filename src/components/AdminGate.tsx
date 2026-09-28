'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/api';
import { isAdmin } from '@/components/shell/AppShell';

/**
 * The admin area is for admins. Anyone else is sent back to the console — the
 * API refuses them anyway (requireRole); this keeps them from a page of 403s.
 * Inside AuthGate, so a signed-out visitor goes to sign in first.
 */
export function AdminGate({ children }: {children: React.ReactNode;}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const ok = isAdmin(session.user());
      setAllowed(ok);
      if (!ok) router.replace('/app');
    };
    check();
    window.addEventListener('dc:session', check);
    return () => window.removeEventListener('dc:session', check);
  }, [router]);

  return allowed ? <>{children}</> : null;
}
