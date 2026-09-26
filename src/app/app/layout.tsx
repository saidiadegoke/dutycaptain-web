import { AppShell } from '@/components/shell/AppShell';
import type { Metadata } from 'next';
import { AuthGate } from '@/components/AuthGate';
import { NOINDEX } from '@/lib/seo';

export const metadata: Metadata = { title: 'Console', robots: NOINDEX };

/**
 * Layout for the console at `/app/*`. Unlike `(marketing)`, `app` is a real
 * path segment, so this is an ordinary directory rather than a route group.
 *
 * The shell lives in the layout so the sidebar and top bar keep their state
 * across navigations instead of remounting per page.
 */
export default function ConsoleLayout({ children }: {children: React.ReactNode;}) {
  return (
    // The gate outside the shell: a signed-out visitor is sent to /signin
    // without the console's sidebar ever appearing.
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>);

}
