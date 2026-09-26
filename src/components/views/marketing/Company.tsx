'use client';

import { MailIcon, MapPinIcon } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { EarlyAccessForm } from '@/components/marketing/EarlyAccessForm';
import { CONTACT_EMAIL } from '@/lib/seo';
import { principles } from '@/data/marketing';

const engagement = [
{
  title: 'Tell us the task',
  body: 'We look at one routine you do by hand and decide together whether DutyCaptain suits it. An honest answer either way.'
},
{
  title: 'Set it up together',
  body: 'We open your account, connect what the task needs — and the companion program, if it touches your computer — and run it with you, approvals on.'
},
{
  title: 'Hand it over',
  body: 'You run and supervise tasks yourself. We stay close, and tell you as each new release arrives.'
}];


export function Company() {
  return (
    <>
      <PageHeader
        eyebrow="Company"
        title="We build the part that gets the work done"
        lede="AI models are improving quickly and are available to everyone. What is hard is everything around them: choosing the right route for each step, checking the result, asking before anything consequential, and keeping a record that can be trusted." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div>
            <SectionHeading
              title="Why we started here"
              lede="We kept meeting people whose most expensive hours went to mechanical work: rebuilding the same monthly report, re-keying invoices, checking the same websites, chasing the same records across several systems." />
            
            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink-700">
              <p>
                The tools available solved only part of it. Assistants explained the steps but left
                the work to the person. Automation tools needed every routine designed in advance.
                Tools that imitate a person at a screen could reach anything, but were slow, easily
                confused, and impossible to check.
              </p>
              <p>
                So we built DutyCaptain: give it a task in plain language, and it completes the task
                by the most reliable route available, proves the work was done, and asks before
                anything that matters. AI models are interchangeable, and DutyCaptain works with
                several. The way work is carried out and checked is the part that lasts.
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
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink-900">{CONTACT_EMAIL}</a>
                </li>
                <li className="flex items-center gap-2.5 text-ink-700">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                  HelloWorld Technologies · remote team
                </li>
              </ul>
              <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-500">
                Early-access calls are run by the people who build DutyCaptain, not a sales
                team.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="canvas" id="contact">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <SectionHeading
            title="Join early access"
            lede="Tell us the task you would hand over first. We will talk it through against that specific routine, with the console open." />
          

          <EarlyAccessForm source="/company" />
        </div>
      </Section>
    </>);

}