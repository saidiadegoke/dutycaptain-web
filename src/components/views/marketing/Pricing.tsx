'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import { plans, pricingFaq } from '@/data/marketing';

export function Pricing() {
  const [open, setOpen] = useState<string | null>(pricingFaq[0].q);

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="A platform licence, plus the compute you already own"
        lede="No per-token billing and no per-bot licences. A job that makes ten thousand model calls costs the same as one that makes ten, because inference runs on your hardware." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) =>
          <article
            key={plan.id}
            className={`flex h-full flex-col rounded-xl border bg-panel ${
            plan.featured ?
            'border-brand-600 shadow-pop lg:-mt-4 lg:mb-4' :
            'border-line shadow-panel'}`
            }>
            
              {plan.featured &&
            <p className="rounded-t-xl bg-brand-600 px-6 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-white">
                  Most teams start here
                </p>
            }
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">
                  {plan.name}
                </h2>
                <p className="mt-1 text-[13px] text-ink-500">{plan.forWho}</p>

                <div className="mt-5 border-b border-line pb-5">
                  <p className="flex items-baseline gap-1">
                    <span className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink-900">
                      {plan.price}
                    </span>
                    {plan.period &&
                  <span className="text-[13px] text-ink-500">{plan.period}</span>
                  }
                  </p>
                  <p className="mt-1.5 text-[12px] text-ink-500">{plan.detail}</p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {plan.includes.map((item) =>
                <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-700">
                      <CheckIcon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600"
                    strokeWidth={2.6} />
                  
                      {item}
                    </li>
                )}
                </ul>

                <Link href="/company"
                className={`mt-8 block rounded-md px-3 py-2.5 text-center text-[13px] font-medium transition-colors duration-150 ease-out ${
                plan.featured ?
                'bg-brand-600 text-white hover:bg-brand-500' :
                'border border-line text-ink-900 hover:bg-canvas'}`
                }>
                
                  {plan.cta}
                </Link>
              </div>
            </article>
          )}
        </div>

        <div className="mt-10 rounded-xl border border-line bg-canvas p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">
                What the compute actually costs
              </h2>
              <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-ink-700">
                The MVP stack — Qwen3-14B for planning and browsing, Qwen2.5-VL-7B for vision —
                fits on one A40 48GB. Browser workers run as CPU containers, so the GPU is only
                serving models.
              </p>
              <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-ink-500">
                Scale by adding worker containers first, and a second GPU only when planning and
                vision start queueing behind each other.
              </p>
            </div>
            <dl className="space-y-3 rounded-lg border border-line bg-panel p-5">
              {[
              ['A40 48GB pod', '$0.49 / hr'],
              ['Running continuously', '≈ $353 / mo'],
              ['Typical dev usage', '< $100 / mo'],
              ['Model calls', 'unmetered']].
              map(([k, v]) =>
              <div key={k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[13px] text-ink-500">{k}</dt>
                  <dd className="tabular text-[14px] font-semibold text-ink-900">{v}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </Section>

      <Section tone="canvas">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
          <SectionHeading
            title="Questions we get before a pilot"
            lede="If yours is not here, ask us directly — we answer scoping questions before anything is signed." />
          
          <div className="divide-y divide-line border-y border-line">
            {pricingFaq.map((item) => {
              const isOpen = open === item.q;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.q)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left">
                    
                    <span className="text-[15px] font-medium text-ink-900">{item.q}</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 ease-out ${
                      isOpen ? 'rotate-180' : ''}`
                      }
                      strokeWidth={2} />
                    
                  </button>
                  {isOpen &&
                  <p className="max-w-2xl pb-5 text-[14px] leading-relaxed text-ink-700">
                      {item.a}
                    </p>
                  }
                </div>);

            })}
          </div>
        </div>
      </Section>

      <CTABand
        title="Pilots start with one workflow, on your hardware"
        body="Thirty days, one job, the full approval and audit model. If it does not pay for itself we will tell you." />
      
    </>);

}