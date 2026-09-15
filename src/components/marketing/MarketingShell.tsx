'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActivityIcon, ArrowUpRightIcon, MenuIcon, XIcon } from 'lucide-react';
import { marketingNav } from '@/data/marketing';

const footerGroups = [
{
  title: 'Product',
  links: [
  { to: '/platform', label: 'Platform' },
  { to: '/use-cases', label: 'Use cases' },
  { to: '/security', label: 'Security & control' },
  { to: '/deployment', label: 'Deployment' }]

},
{
  title: 'Build',
  links: [
  { to: '/developers', label: 'Developer SDK' },
  { to: '/developers', label: 'YAML workflows' },
  { to: '/app', label: 'Open the console' }]

},
{
  title: 'Company',
  links: [
  { to: '/company', label: 'About' },
  { to: '/company', label: 'Contact' },
  { to: '/pricing', label: 'Pricing' }]

}];


export function MarketingShell({ children }: {children: React.ReactNode;}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-full w-full flex-col bg-panel font-sans">
      <header className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
              <ActivityIcon className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink-900">
              DutyCaptain
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Marketing">
            {marketingNav.map((item) =>
            <Link
              key={item.to}
              href={item.to}
              aria-current={pathname === item.to ? 'page' : undefined}
              className={`rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ease-out ${
              pathname === item.to ?
              'font-medium text-ink-900' :
              'text-ink-700 hover:bg-canvas hover:text-ink-900'}`
              }>
              
                {item.label}
              </Link>
            )}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link href="/app"
              className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
              
              Open console
              <ArrowUpRightIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
            <Link href="/company"
              className="rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
              
              Book a demo
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto rounded-md border border-line p-1.5 text-ink-900 lg:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation">
            
            {open ?
            <XIcon className="h-4 w-4" strokeWidth={2.2} /> :

            <MenuIcon className="h-4 w-4" strokeWidth={2.2} />
            }
          </button>
        </div>

        {open &&
        <div className="border-t border-line bg-panel px-5 py-3 lg:hidden">
            <nav aria-label="Marketing mobile">
              <ul className="space-y-0.5">
                {marketingNav.map((item) =>
              <li key={item.to}>
                    <Link href={item.to}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-2.5 py-2 text-[13px] ${
                  pathname === item.to ?
                  'bg-canvas font-medium text-ink-900' :
                  'text-ink-700'}`
                  }>
                  
                      {item.label}
                    </Link>
                  </li>
              )}
              </ul>
            </nav>
            <div className="mt-3 flex gap-2 border-t border-line pt-3">
              <Link href="/app"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md border border-line px-3 py-2 text-center text-[13px] font-medium text-ink-900">
              
                Open console
              </Link>
              <Link href="/company"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-center text-[13px] font-medium text-white">
              
                Book a demo
              </Link>
            </div>
          </div>
        }
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-shell-line bg-shell">
        <div className="mx-auto max-w-[1200px] px-5 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
                  <ActivityIcon className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-white">
                  DutyCaptain
                </span>
              </div>
              <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-shell-text">
                Self-hosted AI agents that browse, read, extract and update your business systems —
                with a human on the approvals.
              </p>
            </div>

            {footerGroups.map((group) =>
            <div key={group.title}>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-shell-text">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {group.links.map((l) =>
                <li key={l.label}>
                      <Link href={l.to}
                    className="text-[13px] text-white/80 transition-colors duration-150 ease-out hover:text-white">
                    
                        {l.label}
                      </Link>
                    </li>
                )}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-shell-line pt-6">
            <p className="text-[12px] text-shell-text">
              © 2026 DutyCaptain. Runs on your hardware.
            </p>
            <p className="font-mono text-[11px] text-shell-text">
              Open-weight models · Playwright runtime · Postgres + pgvector
            </p>
          </div>
        </div>
      </footer>
    </div>);

}