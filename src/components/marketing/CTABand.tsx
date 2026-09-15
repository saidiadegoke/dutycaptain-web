import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

interface CTABandProps {
  title: string;
  body: string;
  primary?: {to: string;label: string;};
  secondary?: {to: string;label: string;};
}

export function CTABand({
  title,
  body,
  primary = { to: '/company', label: 'Book a demo' },
  secondary = { to: '/app', label: 'Explore the console' }
}: CTABandProps) {
  return (
    <section className="bg-shell">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-white lg:text-[26px]">
            {title}
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-shell-text">{body}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link href={primary.to}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
            
            {primary.label}
            <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
          <Link href={secondary.to}
            className="rounded-md border border-shell-line px-4 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-shell-raised">
            
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>);

}