'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActivityIcon, ArrowUpRightIcon, ChevronDownIcon, MenuIcon, XIcon } from 'lucide-react';
import { isNavGroup, marketingNav, type NavGroup } from '@/data/marketing';

const footerGroups = [
{
  title: 'Product',
  links: [
  { to: '/platform', label: 'How it works' },
  { to: '/use-cases', label: 'Use cases' },
  { to: '/security', label: 'Trust & control' },
  { to: '/deployment', label: 'Where it runs' }]

},
{
  title: 'Build',
  links: [
  { to: '/developers', label: 'Developers' },
  { to: '/deployment#roadmap', label: 'Roadmap' },
  { to: '/app', label: 'Open the console' }]

},
{
  title: 'Company',
  links: [
  { to: '/company', label: 'About' },
  { to: '/company#contact', label: 'Contact' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms of use' }]

}];



const pathOf = (to: string) => to.split('#')[0];

/**
 * One top-level menu with children. Opens on hover for a mouse and on click or
 * Enter for everyone else; Escape, a click outside, or following a link closes
 * it.
 */
function NavDropdown({ group, pathname }: {group: NavGroup;pathname: string;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = group.children.some((c) => pathOf(c.to) === pathname);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ease-out ${
        active ? 'font-medium text-ink-900' : 'text-ink-700 hover:bg-canvas hover:text-ink-900'}`
        }>
        
        {group.label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-150 ease-out ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.2} />
        
      </button>

      {open &&
      <div className="absolute left-0 top-full z-40 pt-2">
          <ul className="w-[280px] rounded-xl border border-line bg-panel p-1.5 shadow-pop">
            {group.children.map((child) =>
          <li key={child.to}>
                <Link href={child.to}
            onClick={() => setOpen(false)}
            aria-current={pathOf(child.to) === pathname && !child.to.includes('#') ? 'page' : undefined}
            className="block rounded-lg px-3 py-2 transition-colors duration-150 ease-out hover:bg-canvas">
            
                  <span className="block text-[13px] font-medium text-ink-900">{child.label}</span>
                  {child.description &&
              <span className="mt-0.5 block text-[12px] leading-snug text-ink-500">
                      {child.description}
                    </span>
              }
                </Link>
              </li>
          )}
          </ul>
        </div>
      }
    </div>);

}

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
            isNavGroup(item) ?
            <NavDropdown key={item.label} group={item} pathname={pathname} /> :

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
            <Link href="/signin"
              className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
              
              Sign in
              <ArrowUpRightIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
            <Link href="/company#contact"
              className="rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
              
              Join early access
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
            <nav aria-label="Marketing mobile" className="space-y-3">
              {marketingNav.map((item) =>
            isNavGroup(item) ?
            <div key={item.label}>
                    <p className="px-2.5 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                      {item.label}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {item.children.map((child) =>
                <li key={child.to}>
                          <Link href={child.to}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-2.5 py-2 text-[13px] ${
                  pathname === child.to ?
                  'bg-canvas font-medium text-ink-900' :
                  'text-ink-700'}`
                  }>
                  
                            {child.label}
                          </Link>
                        </li>
                )}
                    </ul>
                  </div> :

            <Link key={item.to} href={item.to}
            onClick={() => setOpen(false)}
            className={`block rounded-md px-2.5 py-2 text-[13px] ${
            pathname === item.to ?
            'bg-canvas font-medium text-ink-900' :
            'text-ink-700'}`
            }>
            
                    {item.label}
                  </Link>
            )}
            </nav>
            <div className="mt-3 flex gap-2 border-t border-line pt-3">
              <Link href="/signin"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md border border-line px-3 py-2 text-center text-[13px] font-medium text-ink-900">
              
                Sign in
              </Link>
              <Link href="/company#contact"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-center text-[13px] font-medium text-white">
              
                Join early access
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
                Describe the task. DutyCaptain plans it, does it by the most reliable route, checks
                the result, and asks before anything that matters.
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
              © 2026 HelloWorld Technologies. DutyCaptain.
            </p>
            <p className="font-mono text-[11px] text-shell-text">
              Cloud first · your computer when it counts
            </p>
          </div>
        </div>
      </footer>
    </div>);

}