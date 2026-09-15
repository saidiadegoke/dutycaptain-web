import { MarketingShell } from '@/components/marketing/MarketingShell';

/**
 * Route-group layout for the public site. `(marketing)` adds no path segment,
 * so these pages live at `/`, `/platform`, … while sharing one shell.
 */
export default function MarketingLayout({ children }: {children: React.ReactNode;}) {
  return <MarketingShell>{children}</MarketingShell>;
}
