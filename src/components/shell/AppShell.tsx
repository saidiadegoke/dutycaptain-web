'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvalsApi, auth, configApi, devicesApi, session } from '@/lib/api';
import type { SessionUser } from '@/lib/types';
import { VerifyEmailBanner } from '@/components/VerifyEmailBanner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActivityIcon,
  CpuIcon,
  FileBoxIcon,
  GaugeIcon,
  LaptopIcon,
  ListChecksIcon,
  PlusIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon } from
'lucide-react';

const nav = [
{ to: '/app', label: 'Overview', icon: GaugeIcon, end: true },
{ to: '/app/tasks', label: 'Tasks', icon: ListChecksIcon },
{ to: '/app/approvals', label: 'Approvals', icon: ShieldCheckIcon, countsApprovals: true },
{ to: '/app/artifacts', label: 'Artifacts', icon: FileBoxIcon },
{ to: '/app/models', label: 'Runtime', icon: CpuIcon },
{ to: '/app/devices', label: 'Computers', icon: LaptopIcon },
{ to: '/app/audit', label: 'Audit trail', icon: ScrollTextIcon },
// Every account has settings of its own (search providers); admins also see the platform's there.
{ to: '/app/settings', label: 'Settings', icon: SettingsIcon }];


/** How often the sidebar re-reads counts and health. */
const REFRESH_MS = 30_000;


/** Initials for the avatar, falling back to the email when there is no name. */
function initials(user: SessionUser | null): string {
  if (!user) return '—';
  const first = (user.first_name || '').trim();
  const last = (user.last_name || '').trim();
  if (first || last) return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  return (user.email || '?').slice(0, 2).toUpperCase();
}

function displayName(user: SessionUser | null): string {
  if (!user) return 'Signed out';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return name || user.email || 'Signed in';
}

const crumbs: Record<string, string> = {
  '/app': 'Overview',
  '/app/tasks': 'Tasks',
  '/app/approvals': 'Approvals',
  '/app/artifacts': 'Artifacts',
  '/app/models': 'Runtime',
  '/app/audit': 'Audit trail',
  '/app/tasks/new': 'Tasks / New task',
  '/app/devices': 'Computers',
  '/app/settings': 'Settings'
};

export function AppShell({ children }: {children: React.ReactNode;}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  // Read after mount, never during render: `localStorage` does not exist on the
  // server, and reading it in the render body would make the first client paint
  // disagree with the server's HTML.
  useEffect(() => {
    const sync = () => setUser(session.user());
    sync();
    window.addEventListener('dc:session', sync);
    return () => window.removeEventListener('dc:session', sync);
  }, []);

  // Real numbers or nothing: the approvals badge, the health dot and the
  // computers line each come from the API, and are hidden until they have.
  const [pending, setPending] = useState<number | null>(null);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [computers, setComputers] = useState<{connected: number;total: number;} | null>(null);

  useEffect(() => {
    if (!user) return undefined;
    let live = true;
    const load = async () => {
      const [ok, approvals, devices] = await Promise.all([
      configApi.healthy(),
      approvalsApi.list().catch(() => null),
      devicesApi.list().catch(() => null)]
      );
      if (!live) return;
      setHealthy(ok);
      if (approvals) setPending(approvals.length);
      if (devices) setComputers({ connected: devices.filter((d) => d.connected).length, total: devices.length });
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [user, pathname]);

  const signOut = () => {
    auth.signOut();
    router.replace('/signin');
  };

  /**
   * react-router's NavLink supplied `isActive`; next/link does not, so the
   * comparison is explicit. `end` reproduces NavLink's exact-match behaviour —
   * without it, /app would highlight for every nested route.
   */
  const isActive = (item: {to: string;end?: boolean;}) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
  const crumb =
  crumbs[pathname] ?? (pathname.startsWith('/app/tasks/') ? 'Tasks / Detail' : 'Overview');

  return (
    <div className="flex min-h-full w-full bg-canvas font-sans">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-shell-line bg-shell lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
            <ActivityIcon className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            DutyCaptain
          </span>
        </Link>

        <div className="px-3 pb-3">
          <Link href="/app/tasks/new"
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
            
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            New task
          </Link>
        </div>

        <nav className="flex-1 px-3" aria-label="Main">
          <ul className="space-y-0.5">
            {nav.map((item) =>
            <li key={item.to}>
                <Link
                href={item.to}
                aria-current={isActive(item) ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors duration-150 ease-out ${
                isActive(item) ?
                'bg-shell-raised font-medium text-white' :
                'text-shell-text hover:bg-shell-raised hover:text-white'}`
                }>
                
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {'countsApprovals' in item && pending !== null && pending > 0 &&
                <span
                  className="rounded bg-warn-600 px-1.5 py-[1px] text-[10px] font-semibold text-white"
                  aria-label={`${pending} waiting for approval`}>
                  
                      {pending}
                    </span>
                }
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="border-t border-shell-line px-5 py-4">
          <p className="truncate text-[12px] font-medium text-white">{displayName(user)}</p>
          {user?.email &&
          <p className="mt-0.5 truncate text-[11px] text-shell-text">{user.email}</p>
          }
          {computers &&
          <Link href="/app/devices" className="mt-2 block text-[11px] text-shell-text hover:text-white">
              {computers.total === 0 ?
            'No computer connected' :
            `${computers.connected} of ${computers.total} computer${computers.total === 1 ? '' : 's'} online`}
            </Link>
          }
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-panel/90 px-5 backdrop-blur lg:px-8">
          <p className="truncate text-[13px] font-medium text-ink-700">{crumb}</p>
          <div className="flex items-center gap-3">
            {healthy !== null &&
            <span
              className={`hidden items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium sm:inline-flex ${
              healthy ? 'border-ok-100 bg-ok-50 text-ok-700' : 'border-danger-100 bg-danger-50 text-danger-700'}`
              }>
              
                <span
                className={`h-1.5 w-1.5 rounded-full ${healthy ? 'bg-ok-600' : 'bg-danger-600'}`}
                aria-hidden="true" />
              
                {healthy ? 'Connected' : 'Cannot reach DutyCaptain'}
              </span>
            }
            {user &&
            <div className="flex items-center gap-2 border-l border-line pl-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-semibold text-white">
                  {initials(user)}
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-[12px] font-medium text-ink-900">{displayName(user)}</p>
                  <button
                  type="button"
                  onClick={signOut}
                  className="text-[11px] text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline">
                  
                    Sign out
                  </button>
                </div>
              </div>
            }
          </div>
        </header>

        <VerifyEmailBanner user={user} />
        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>);

}