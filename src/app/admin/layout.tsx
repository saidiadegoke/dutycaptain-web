import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { AdminGate } from '@/components/AdminGate';
import { NOINDEX } from '@/lib/seo';

export const metadata: Metadata = { title: 'Admin', robots: NOINDEX };

/**
 * The admin area at `/admin/*` — platform tools for admins, beside the console
 * (`/app/*`) and the marketing site. The same shell as the console, with the
 * admin nav and a way back.
 */
export default function AdminLayout({ children }: {children: React.ReactNode;}) {
  return (
    <AuthGate>
      <AdminGate>
        <AppShell area="admin">{children}</AppShell>
      </AdminGate>
    </AuthGate>);

}
