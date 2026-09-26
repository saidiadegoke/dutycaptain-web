import Link from 'next/link';
import { ActivityIcon, ArrowLeftIcon } from 'lucide-react';

/**
 * The frame around sign-in, sign-up and password reset: the logo, a way back
 * to the website, and nothing from the console. Someone who is not signed in
 * has no tasks, approvals or computers, so none of that is shown.
 */
export function AuthLayout({ children }: {children: React.ReactNode;}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans">
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
            <ActivityIcon className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">DutyCaptain</span>
        </Link>
        <Link href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-700 transition-colors duration-150 ease-out hover:text-ink-900">
          
          <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
          Back to website
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="flex justify-center gap-5 pb-6 text-[12px] text-ink-500">
        <Link href="/privacy" className="hover:text-ink-900">Privacy policy</Link>
        <Link href="/terms" className="hover:text-ink-900">Terms of use</Link>
        <Link href="/company#contact" className="hover:text-ink-900">Contact</Link>
      </footer>
    </div>);

}

/** The card every auth page sits in. */
export function AuthCard({
  title,
  lede,
  children,
  footer



}: {title: string;lede?: React.ReactNode;children: React.ReactNode;footer?: React.ReactNode;}) {
  return (
    <>
      <div className="rounded-xl border border-line bg-panel p-6 shadow-panel sm:p-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">{title}</h1>
        {lede && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{lede}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-[13px] text-ink-500">{footer}</div>}
    </>);

}

export const fieldClass =
'w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-panel focus:outline-none';

export const labelClass = 'block text-[12px] font-medium text-ink-900';

export const primaryButtonClass =
'w-full rounded-md bg-brand-600 px-3 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:bg-line-strong disabled:text-ink-500';

export function FormError({ message }: {message: string | null;}) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] leading-relaxed text-danger-700">
      {message}
    </p>);

}

/**
 * Where to go after signing in. Only a path inside the console is honoured —
 * anything else (another site, `//evil.example`) would make the sign-in page
 * an open redirect.
 */
export function safeNext(next: string | null): string {
  if (next && next.startsWith('/app') && !next.startsWith('//')) return next;
  return '/app';
}
