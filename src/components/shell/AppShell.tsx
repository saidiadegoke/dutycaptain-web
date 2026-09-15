'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ActivityIcon,
  BellIcon,
  CpuIcon,
  FileBoxIcon,
  GaugeIcon,
  ListChecksIcon,
  PlusIcon,
  ScrollTextIcon,
  ShieldCheckIcon } from
'lucide-react';

const nav = [
{ to: '/app', label: 'Overview', icon: GaugeIcon, end: true },
{ to: '/app/jobs', label: 'Jobs', icon: ListChecksIcon },
{ to: '/app/approvals', label: 'Approvals', icon: ShieldCheckIcon, badge: 3 },
{ to: '/app/artifacts', label: 'Artifacts', icon: FileBoxIcon },
{ to: '/app/models', label: 'Runtime', icon: CpuIcon },
{ to: '/app/audit', label: 'Audit trail', icon: ScrollTextIcon }];


const crumbs: Record<string, string> = {
  '/app': 'Overview',
  '/app/jobs': 'Jobs',
  '/app/approvals': 'Approvals',
  '/app/artifacts': 'Artifacts',
  '/app/models': 'Runtime',
  '/app/audit': 'Audit trail',
  '/app/jobs/new': 'Jobs / New job'
};

export function AppShell({ children }: {children: React.ReactNode;}) {
  const pathname = usePathname();

  /**
   * react-router's NavLink supplied `isActive`; next/link does not, so the
   * comparison is explicit. `end` reproduces NavLink's exact-match behaviour —
   * without it, /app would highlight for every nested route.
   */
  const isActive = (item: {to: string;end?: boolean;}) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
  const crumb =
  crumbs[pathname] ?? (pathname.startsWith('/app/jobs/') ? 'Jobs / Detail' : 'Overview');

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
          <Link href="/app/jobs/new"
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
            
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            New job
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
                  {item.badge &&
                <span className="rounded bg-warn-600 px-1.5 py-[1px] text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                }
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="border-t border-shell-line px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-shell-text">
            Self-hosted · A40 48GB
          </p>
          <p className="mt-1 text-[11px] text-shell-text">
            3 models loaded · 20 workers
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-panel/90 px-5 backdrop-blur lg:px-8">
          <p className="truncate text-[13px] font-medium text-ink-700">{crumb}</p>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-md border border-ok-100 bg-ok-50 px-2 py-1 text-[11px] font-medium text-ok-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-ok-600" aria-hidden="true" />
              Runtime healthy
            </span>
            <button
              type="button"
              className="relative rounded-md border border-line bg-panel p-1.5 text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas"
              aria-label="Notifications">
              
              <BellIcon className="h-4 w-4" strokeWidth={1.9} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warn-600" />
            </button>
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[11px] font-semibold text-white">
                AB
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12px] font-medium text-ink-900">A. Bello</p>
                <p className="text-[11px] text-ink-500">Operations lead</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>);

}