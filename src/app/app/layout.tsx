import { AppShell } from '@/components/shell/AppShell';

/**
 * Layout for the console at `/app/*`. Unlike `(marketing)`, `app` is a real
 * path segment, so this is an ordinary directory rather than a route group.
 *
 * The shell lives in the layout so the sidebar and top bar keep their state
 * across navigations instead of remounting per page.
 */
export default function ConsoleLayout({ children }: {children: React.ReactNode;}) {
  return <AppShell>{children}</AppShell>;
}
