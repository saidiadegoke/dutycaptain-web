'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, MailIcon, MapPinIcon } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { principles } from '@/data/marketing';

const engagement = [
{
  title: 'Scoping call',
  body: 'We look at one process you do by hand and decide together whether the runtime is a fit. Honest answer either way.'
},
{
  title: 'Pilot on your hardware',
  body: 'We deploy the MVP stack on your pod, wire one connector, and run the job end to end with approvals on.'
},
{
  title: 'Hand over the console',
  body: 'Your operators run and supervise jobs themselves. We stay on for connector work and new workflows.'
}];


export function Company() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', job: '' });

  const valid = form.name.trim() !== '' && form.email.includes('@') && form.job.trim() !== '';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) setSent(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Company"
        title="We build the runtime, not another model"
        lede="Anyone can download Qwen. The hard part is everything around it: persistent browser sessions, vision-guided automation, a distributed scheduler, retry and recovery, approval checkpoints, and a record of every decision." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div>
            <SectionHeading
              title="Why we started here"
              lede="We kept meeting operations teams whose most expensive work was mechanical: someone opening four retailer sites for three thousand SKUs, someone re-keying a stack of scanned invoices, someone checking a price board every morning at eight." />
            
            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink-700">
              <p>
                General-purpose assistants do not solve that. The work needs a browser that stays
                logged in, a model that can read a page when the selectors break, a scheduler that
                can hold thousands of tasks, and a human gate before anything is published.
              </p>
              <p>
                So we built an agent operating system for measurable business jobs first, and left
                the general assistant for later. Models are interchangeable — we expect to swap
                them as better open weights ship. The workflow engine is the part that compounds.
              </p>
            </div>

            <dl className="mt-10 divide-y divide-line border-y border-line">
              {principles.map((p) =>
              <div key={p.title} className="py-6">
                  <dt className="text-[15px] font-semibold tracking-tight text-ink-900">
                    {p.title}
                  </dt>
                  <dd className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-500">
                    {p.body}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-canvas p-6">
              <h3 className="text-[13px] font-semibold text-ink-900">How an engagement runs</h3>
              <ol className="mt-4 space-y-4">
                {engagement.map((step, i) =>
                <li key={step.title} className="flex gap-3.5">
                    <span className="tabular mt-0.5 font-mono text-[11px] text-brand-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-ink-900">{step.title}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{step.body}</p>
                    </div>
                  </li>
                )}
              </ol>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Reach us directly</h3>
              <ul className="mt-4 space-y-3 text-[13px]">
                <li className="flex items-center gap-2.5 text-ink-700">
                  <MailIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                  ops@dutycaptain.io
                </li>
                <li className="flex items-center gap-2.5 text-ink-700">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                  Lagos, Nigeria · remote team
                </li>
              </ul>
              <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-500">
                Scoping calls are run by the engineers who would deploy your pilot, not a sales
                team.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="canvas" id="contact">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <SectionHeading
            title="Book a demo"
            lede="Tell us the job you would hand over first. We will run the scoping call against that specific process, with the console open." />
          

          {sent ?
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl border border-ok-100 bg-ok-50 p-6">
            
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ok-600">
                <CheckIcon className="h-4 w-4 text-white" strokeWidth={3} />
              </span>
              <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-ok-700">
                Request received
              </h3>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ok-700">
                We will reply within one business day with two times and a short list of questions
                about the process you described.
              </p>
            </motion.div> :

          <form
            onSubmit={submit}
            className="rounded-xl border border-line bg-panel p-6 shadow-panel">
            
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-[12px] font-medium text-ink-900">
                    Name
                  </label>
                  <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
                  placeholder="Adaeze Bello" />
                
                </div>
                <div>
                  <label htmlFor="email" className="block text-[12px] font-medium text-ink-900">
                    Work email
                  </label>
                  <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
                  placeholder="you@company.com" />
                
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="company" className="block text-[12px] font-medium text-ink-900">
                  Company
                </label>
                <input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
                placeholder="SmartStore" />
              
              </div>

              <div className="mt-4">
                <label htmlFor="job" className="block text-[12px] font-medium text-ink-900">
                  The job you would hand over first
                </label>
                <textarea
                id="job"
                rows={4}
                value={form.job}
                onChange={(e) => setForm({ ...form, job: e.target.value })}
                className="mt-1.5 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-[13px] leading-relaxed text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none"
                placeholder="e.g. checking competitor prices for 3,500 SKUs across four retailers every Monday" />
              
              </div>

              <button
              type="submit"
              disabled={!valid}
              className="mt-5 w-full rounded-md bg-brand-600 px-3 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-500">
              
                Request a scoping call
              </button>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
                We use this only to prepare the call. No sequences, no newsletter.
              </p>
            </form>
          }
        </div>
      </Section>
    </>);

}