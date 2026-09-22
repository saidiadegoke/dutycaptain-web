'use client';

import { useState } from 'react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';

const sdkSample = `import { agent } from "@dutycaptain/sdk"

const task = await agent.create({
  goal: "Update SmartStore prices",
  input: "products.csv",
  approvals: ["write"],
  workers: 20
})

await task.run()

console.log(task.artifacts)
// → ["samsung-price-audit-2026-09-11.xlsx"]`;

const yamlSample = `name: Daily Fuel Price
schedule: "0 8 * * *"

steps:
  - search: "NNPC fuel price Lagos"
  - browse: official_site
  - extract:
      schema:
        price: number
  - excel: fuel.xlsx
  - email: ops@company.com`;

const browserApi = `browser.open(url)
browser.click(selector)
browser.type(selector, value)
browser.wait()
browser.screenshot()
browser.download()`;

const plannerOutput = `[
  { "step": "load_catalog" },
  { "step": "search_product", "parallel": true },
  { "step": "extract_price" },
  { "step": "validate" },
  { "step": "generate_excel" },
  { "step": "update_dashboard" }
]`;

const surfaces = [
{
  name: 'REST API',
  detail: 'Create tasks, stream step events, fetch artifacts and approve pending actions.',
  endpoint: 'POST /v1/tasks'
},
{
  name: 'Webhooks',
  detail: 'Task state changes, approval requests and artifact writes pushed to your endpoint.',
  endpoint: 'task.awaiting_approval'
},
{
  name: 'Tool registry',
  detail: 'Register your own typed tool and the planner can include it in generated graphs.',
  endpoint: 'agent.tools.register()'
},
{
  name: 'Connectors',
  detail: 'Adapters for SmartStore, ERPs, Paystack, courier APIs, Postgres and sheets.',
  endpoint: 'connector("smartstore")'
}];


type Tab = 'sdk' | 'yaml';

export function Developers() {
  const [tab, setTab] = useState<Tab>('sdk');

  return (
    <>
      <PageHeader
        eyebrow="Developers"
        title="The platform is a runtime you can call"
        lede="Everything the console does is available as code. Define a workflow in TypeScript, declare it in YAML, or let the planner generate it from English and then edit the result." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <div>
            <div className="flex items-center gap-1 rounded-md border border-line bg-canvas p-1">
              {
              [
              { id: 'sdk' as Tab, label: 'TypeScript SDK' },
              { id: 'yaml' as Tab, label: 'YAML workflow' }].

              map((t) =>
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={`rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ease-out ${
                tab === t.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-panel'}`
                }>
                
                  {t.label}
                </button>
              )}
            </div>

            <pre className="mt-4 overflow-x-auto rounded-xl border border-shell-line bg-shell px-5 py-5 font-mono text-[12px] leading-relaxed text-white/90">
              {tab === 'sdk' ? sdkSample : yamlSample}
            </pre>

            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-700">
              {tab === 'sdk' ?
              'Tasks are first-class objects. Await completion, subscribe to step events, or hand the task id to your own dashboard and poll it.' :
              'Declarative workflows are versioned in your repo and run on a schedule. The planner can generate a first draft from a sentence, which you then review and commit.'}
            </p>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Browser tool calls</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
                The model never manipulates HTML. It issues these calls, and the worker executes
                them in a real browser.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-800">
                {browserApi}
              </pre>
            </div>

            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Planner output</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
                Not prose — structured steps that become the execution graph.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-800">
                {plannerOutput}
              </pre>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="Integration surfaces"
          lede="Drive the platform from your own systems, or let it drive them." />
        
        <dl className="mt-10 divide-y divide-line border-y border-line">
          {surfaces.map((s) =>
          <div
            key={s.name}
            className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[180px_minmax(0,1fr)_220px] md:items-baseline md:gap-8">
            
              <dt className="text-[15px] font-semibold tracking-tight text-ink-900">{s.name}</dt>
              <dd className="text-[14px] leading-relaxed text-ink-700">{s.detail}</dd>
              <dd className="font-mono text-[11px] text-brand-700 md:text-right">{s.endpoint}</dd>
            </div>
          )}
        </dl>
      </Section>

      <Section tone="light">
        <SectionHeading
          title="Failure handling you do not have to write"
          lede="Long tasks fail in the middle. The runtime assumes it and recovers per node rather than per task." />
        
        <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {[
          {
            t: 'Per-node retries and timeouts',
            b: 'A page that times out is re-dispatched on its own. The other 19 workers never stop.'
          },
          {
            t: 'Resume from the graph',
            b: 'Restarting a task continues from completed nodes using stored step outputs.'
          },
          {
            t: 'Session persistence',
            b: 'Cookies and authenticated state are stored per site, so logins survive worker restarts.'
          },
          {
            t: 'Outlier validation',
            b: 'A cheap model flags improbable values and escalates them to a stronger one before any write.'
          }].
          map((item) =>
          <div key={item.t} className="bg-panel p-6">
              <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">{item.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{item.b}</p>
            </div>
          )}
        </div>
      </Section>

      <CTABand
        title="Get the SDK and a sandbox cluster"
        body="We will set up a pod with the MVP model stack so you can run a real task the same day."
        primary={{ to: '/company', label: 'Request access' }}
        secondary={{ to: '/platform', label: 'Read the architecture' }} />
      
    </>);

}