import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  tone?: 'light' | 'canvas' | 'dark';
  className?: string;
  id?: string;
}

const tones = {
  light: 'bg-panel',
  canvas: 'bg-canvas border-y border-line',
  dark: 'bg-shell'
};

export function Section({ children, tone = 'light', className = '', id }: SectionProps) {
  return (
    <section id={id} className={`${tones[tone]} ${className}`}>
      <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-20">{children}</div>
    </section>);

}

interface SectionHeadingProps {
  title: string;
  lede?: string;
  align?: 'left' | 'center';
  dark?: boolean;
}

export function SectionHeading({
  title,
  lede,
  align = 'left',
  dark = false
}: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <h2
        className={`text-[26px] font-semibold leading-tight tracking-tight lg:text-[30px] ${
        dark ? 'text-white' : 'text-ink-900'}`
        }>
        
        {title}
      </h2>
      {lede &&
      <p
        className={`mt-3 text-[15px] leading-relaxed ${
        dark ? 'text-shell-text' : 'text-ink-500'}`
        }>
        
          {lede}
        </p>
      }
    </div>);

}

export function PageHeader({
  eyebrow,
  title,
  lede,
  children





}: {eyebrow: string;title: string;lede: string;children?: React.ReactNode;}) {
  return (
    <div className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8 lg:py-16">
        <p className="font-mono text-[11px] uppercase tracking-wider text-brand-700">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-[32px] font-semibold leading-[1.1] tracking-tight text-ink-900 lg:text-[40px]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-700">{lede}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>);

}