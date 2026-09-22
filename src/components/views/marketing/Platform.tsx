import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import { agents } from '@/data/marketing';

const graphStages = [
{ nodes: ['Load catalog'], state: 'done' },
{ nodes: ['Resolve retailer URLs'], state: 'done' },
{ nodes: ['Extract price', 'Verify price', 'Stock status'], state: 'run' },
{ nodes: ['Generate Excel audit'], state: 'queued' },
{ nodes: ['Human approval'], state: 'wait' },
{ nodes: ['Update SmartStore'], state: 'queued' }];


const stageChrome: Record<string, string> = {
  done: 'border-line bg-panel text-ink-700',
  run: 'border-brand-200 bg-brand-50 text-brand-700',
  queued: 'border-dashed border-line-strong bg-canvas text-ink-500',
  wait: 'border-warn-100 bg-warn-50 text-warn-700'
};

const memoryTables = [
['tasks', 'User requests and their goals'],
['steps', 'Individual actions in the graph'],
['step_outputs', 'Structured JSON results'],
['browser_sessions', 'Cookies and authenticated state'],
['documents', 'Uploaded files and scans'],
['embeddings', 'Semantic memory in pgvector'],
['audit_logs', 'Every AI and human decision']];


const visionJson = `{
  "elements": [
    { "type": "price",  "value": "₦18,500", "bbox": [220,310,290,340] },
    { "type": "button", "text": "Next Page", "bbox": [520,740,610,770] }
  ]
}`;

const nodeSpec = `{
  id, type,
  inputs, outputs,
  retries, timeout,
  parallelism
}`;

export function Platform() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="An agent operating system, not a chatbot"
        lede="The language model orchestrates. Playwright, vision, search and file tools do the actual work. That separation is what lets a task run for thirty minutes across thousands of steps without a human watching it." />
      

      <Section tone="light">
        <SectionHeading
          title="Six agents, each with one responsibility"
          lede="Every step is routed to the smallest model that can do it. A 3,500-product task can make thousands of calls, so using a 32B model for tagging would be waste — even on hardware you own." />
        

        <dl className="mt-10 divide-y divide-line border-y border-line">
          {agents.map((agent) =>
          <div
            key={agent.id}
            className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
            
              <dt>
                <span className="text-[15px] font-semibold tracking-tight text-ink-900">
                  {agent.name}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-brand-700">
                  {agent.model}
                </span>
              </dt>
              <dd className="max-w-2xl text-[14px] leading-relaxed text-ink-700">
                {agent.summary}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      <Section tone="canvas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div>
            <SectionHeading
              title="The workflow engine is a DAG, not a script"
              lede="Linear execution cannot express “these three checks can happen at once, but nothing writes until a person signs off.” A directed graph can." />
            

            <figure className="mt-8">
              <div className="space-y-2">
                {graphStages.map((stage, i) =>
                <div key={i}>
                    <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${stage.nodes.length}, minmax(0, 1fr))`
                    }}>
                    
                      {stage.nodes.map((n) =>
                    <div
                      key={n}
                      className={`rounded-lg border px-3 py-2.5 text-[12px] font-medium ${stageChrome[stage.state]}`}>
                      
                          {n}
                        </div>
                    )}
                    </div>
                    {i < graphStages.length - 1 &&
                  <div className="flex justify-center py-1" aria-hidden="true">
                        <span className="h-4 w-px bg-line-strong" />
                      </div>
                  }
                  </div>
                )}
              </div>
              <figcaption className="mt-4 text-[12px] leading-relaxed text-ink-500">
                The graph the planner produced for a four-retailer pricing task. Three extraction
                branches run in parallel across 20 workers; the write waits behind one approval.
              </figcaption>
            </figure>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Every node carries</h3>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-800">
                {nodeSpec}
              </pre>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                Retries and timeouts live on the node, so a failed page is re-dispatched on its own
                instead of restarting the task.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Parallel execution</h3>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                {[
                ['Queue', 'Redis, 20 consumers'],
                ['Workers', 'CPU containers, no GPU'],
                ['Per product', '~8 seconds average'],
                ['3,500 products', '25–35 minutes']].
                map(([k, v]) =>
                <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="tabular font-medium text-ink-900">{v}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                After dispatch, workers pull their own steps. No model coordination is required.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              title="Browser intelligence that survives redesigns"
              lede="CSS selectors break the moment a retailer ships a new template. When Playwright hits an ambiguous page, the vision agent reads the screenshot and returns semantic objects with coordinates for the browser to click." />
            
            <ol className="mt-7 space-y-3">
              {[
              'Playwright loads the page in a persistent, logged-in session.',
              'The worker captures a screenshot.',
              'Qwen2.5-VL returns values, types and bounding boxes.',
              'Playwright clicks the returned coordinates and continues.'].
              map((step, i) =>
              <li key={step} className="flex gap-3 text-[14px] leading-relaxed text-ink-700">
                  <span className="tabular mt-0.5 font-mono text-[11px] text-brand-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              )}
            </ol>
            <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-canvas px-4 py-4 font-mono text-[11px] leading-relaxed text-ink-800">
              {visionJson}
            </pre>
          </div>

          <div>
            <SectionHeading
              title="Memory that changes the next plan"
              lede="Results, sessions and preferences are stored in PostgreSQL with pgvector. When an operator says “prefer Konga over Jumia”, that preference is embedded and the planner applies it to every future task." />
            
            <div className="mt-7 overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      Table
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {memoryTables.map(([t, p]) =>
                  <tr key={t}>
                      <td className="px-4 py-2.5 font-mono text-[12px] font-medium text-ink-900">
                        {t}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-700">{p}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Link href="/deployment"
              className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
              
              What this needs to run
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </Section>

      <CTABand
        title="See the runtime on your own workflow"
        body="Bring a task that involves a browser, a document, or a system with no usable API. That is the interesting case." />
      
    </>);

}