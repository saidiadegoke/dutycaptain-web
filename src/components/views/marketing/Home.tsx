import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import { ConsoleMock } from '@/components/marketing/ConsoleMock';
import { comparison, heroStats, runSequence, useCases } from '@/data/marketing';

export function Home() {
  const featured = useCases.find((u) => u.featured)!;

  return (
    <>
      <div className="bg-shell">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-brand-200">
                Autonomous task execution
              </p>
              <h1 className="mt-4 max-w-xl text-[36px] font-semibold leading-[1.05] tracking-tight text-white lg:text-[52px]">
                Describe the task. DutyCaptain does the work.
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-shell-text lg:text-[17px]">
                DutyCaptain plans the steps, carries each one out by the most reliable route — a
                built-in tool, a connected service, a website, or your own computer — checks that it
                worked, and stops for your approval before anything that matters.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/company#contact"
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500">
                  
                  Join early access
                  <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
                </Link>
                <Link href="/app"
                  className="rounded-md border border-shell-line px-4 py-2.5 text-[14px] font-medium text-white transition-colors duration-150 ease-out hover:bg-shell-raised">
                  
                  Explore the console
                </Link>
              </div>

              <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-shell-line pt-8 sm:grid-cols-4">
                {heroStats.map((s) =>
                <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <span className="tabular block text-[20px] font-semibold tracking-tight text-white">
                        {s.value}
                      </span>
                      <span className="mt-1 block text-[12px] leading-snug text-shell-text">
                        {s.label}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="lg:pl-6">
              <ConsoleMock />
              <p className="mt-3 text-center text-[12px] text-shell-text">
                The task view, part-way through a monthly sales report.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Section tone="light">
        <SectionHeading
          title="One sentence in, finished and checked work out"
          lede="You see the plan before anything runs, and a record of every step once it has." />
        

        <ol className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
          {runSequence.map((step, i) =>
          <li key={step.title} className="flex flex-col bg-panel p-6">
              <span className="tabular font-mono text-[11px] text-brand-700">
                Step {i + 1}
              </span>
              <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{step.body}</p>
            </li>
          )}
        </ol>

        <div className="mt-8">
          <Link href="/platform"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
            
            See how it works
            <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </Section>

      <Section tone="canvas">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-brand-700">
              {featured.industry}
            </p>
            <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-ink-900 lg:text-[30px]">
              {featured.name}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{featured.problem}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{featured.approach}</p>

            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-5">
              {featured.metrics.map((m) =>
              <div key={m.label}>
                  <dd className="tabular text-[24px] font-semibold leading-none tracking-tight text-ink-900">
                    {m.value}
                  </dd>
                  <dt className="mt-1.5 text-[12px] text-ink-500">{m.label}</dt>
                </div>
              )}
            </dl>

            <Link href="/use-cases"
              className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
              
              Four more tasks people hand over
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>

          <figure className="rounded-xl border border-line bg-panel p-6 shadow-panel">
            <figcaption className="text-[12px] font-semibold text-ink-700">
              What the approval looks like
            </figcaption>
            <div className="mt-4 overflow-hidden rounded-lg border border-warn-100">
              <div className="flex items-center justify-between border-b border-warn-100 bg-warn-50 px-4 py-2.5">
                <span className="text-[12px] font-semibold text-warn-700">Email to accountant</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-warn-700">
                  needs approval
                </span>
              </div>
              <dl className="divide-y divide-line">
                {[
                ['To', 'accounts@example-accountants.com'],
                ['Subject', 'Sales report — August 2026'],
                ['Attachment', 'sales-report-2026-08.xlsx · 3 sheets, checked'],
                ['Why it is asking', 'Sending email always needs approval']].
                map(([k, v]) =>
                <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-2.5">
                    <dt className="text-[12px] text-ink-500">{k}</dt>
                    <dd className="text-[12px] font-medium text-ink-900">{v}</dd>
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-line bg-canvas px-4 py-3">
                <span className="rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white">
                  Allow once
                </span>
                <span className="rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-900">
                  Allow for this task
                </span>
                <span className="rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-900">
                  Deny
                </span>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
              The workbook was reopened and checked before this request reached you. Approving
              sends it, confirms delivery, and records who approved it and when.
            </p>
          </figure>
        </div>
      </Section>

      <Section tone="light">
        <SectionHeading
          title="Why not an automation tool, or a chat assistant"
          lede="Each solves part of the problem. DutyCaptain was built for the whole of it: understanding the task, doing it, and proving it was done." />
        
        <div className="mt-9 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                <th scope="col" className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  Requirement
                </th>
                {comparison.columns.map((c, i) =>
                <th
                  key={c}
                  scope="col"
                  className={`px-5 py-3 text-[12px] font-semibold ${
                  i === 0 ? 'bg-brand-50 text-brand-700' : 'text-ink-500'}`
                  }>
                  
                    {c}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {comparison.rows.map((row) =>
              <tr key={row.feature}>
                  <th
                  scope="row"
                  className="px-5 py-3 text-left text-[13px] font-medium text-ink-900">
                  
                    {row.feature}
                  </th>
                  {row.values.map((v, i) =>
                <td
                  key={v + i}
                  className={`px-5 py-3 text-[13px] ${
                  i === 0 ?
                  'bg-brand-50/60 font-medium text-ink-900' :
                  'text-ink-500'}`
                  }>
                  
                      {v}
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="canvas">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              title="Autonomous, but never unsupervised"
              lede="DutyCaptain acts only within limits you set, and every action is written down — including the ones it was stopped from taking." />
            
            <div className="mt-7 space-y-5">
              {[
              {
                t: 'Approval before anything consequential',
                b: 'Sending, paying, deleting and publishing wait for you. Reading and preparing carry on without interrupting.'
              },
              {
                t: 'A record of every step',
                b: 'What was done, by which route, what it cost, how it was checked, and who approved it.'
              },
              {
                t: 'Your computer, on your terms',
                b: 'The companion program reaches only the folders and applications you name, and you can pause or withdraw it at any time.'
              }].
              map((item) =>
              <div key={item.t} className="border-l-2 border-brand-600 pl-4">
                  <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">
                    {item.t}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{item.b}</p>
                </div>
              )}
            </div>
            <Link href="/security"
              className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
              
              How trust and control work
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
            <div className="border-b border-line px-5 py-3">
              <p className="text-[12px] font-semibold text-ink-900">Task history</p>
              <p className="mt-0.5 text-[11px] text-ink-500">Prepare monthly sales report · last 6 events</p>
            </div>
            <ul className="divide-y divide-line">
              {[
              ['09:25:41', 'Email to accountant', 'connected service', 'waiting'],
              ['09:25:38', 'Format charts in Excel', 'your computer', 'ok'],
              ['09:25:31', 'Check the workbook', 'built-in', 'ok'],
              ['09:25:27', 'Build the workbook', 'built-in', 'retry'],
              ['09:25:12', 'Analyse orders', 'built-in', 'ok'],
              ['09:25:03', 'Fetch orders', 'connected service', 'ok']].
              map((row) =>
              <li key={row[0]} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="tabular font-mono text-[11px] text-ink-400">{row[0]}</span>
                  <span className="flex-1 font-mono text-[11px] font-medium text-ink-900">
                    {row[1]}
                  </span>
                  <span className="hidden font-mono text-[11px] text-ink-500 sm:inline">
                    {row[2]}
                  </span>
                  <span
                  className={`rounded border px-1.5 py-[2px] text-[10px] font-medium capitalize ${
                  row[3] === 'ok' ?
                  'border-ok-100 bg-ok-50 text-ok-700' :
                  row[3] === 'waiting' ?
                  'border-warn-100 bg-warn-50 text-warn-700' :
                  'border-brand-200 bg-brand-50 text-brand-700'}`
                  }>
                  
                    {row[3]}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Section>

      <CTABand
        title="Start with one task you do by hand today"
        body="Tell us what it is. We will set it up with you during early access and show you the record of every step." />
      
    </>);

}