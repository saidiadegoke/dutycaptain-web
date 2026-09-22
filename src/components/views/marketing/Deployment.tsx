import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import { clusterSizing, modelStack, rolloutPhases } from '@/data/marketing';

const mvpPod = `GPU:      A40 48GB
Storage:  100GB
Models:   Qwen3-14B, Qwen2.5-VL-7B
Services: vLLM, Playwright,
          PostgreSQL, Redis, Fastify API`;

const swapSequence = [
'Default loaded: Qwen3-14B + Qwen2.5-VL-7B',
'A large planning task arrives',
'Unload Qwen3-14B, load Qwen3-32B',
'Run planning, then unload again',
'Reload Qwen3-14B for execution'];


export function Deployment() {
  return (
    <>
      <PageHeader
        eyebrow="Deployment"
        title="One GPU is enough to start"
        lede="The MVP runs on a single A40 at roughly $0.49 an hour. Browser workers are CPU-bound, so the GPU only serves the agent and vision models — and you add capacity when a task actually demands it." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div>
            <SectionHeading
              title="What we would deploy today"
              lede="Enough to demonstrate the whole loop: upload 3,500 products, search, browse, extract, generate the audit file and update the store." />
            
            <pre className="mt-7 overflow-x-auto rounded-xl border border-shell-line bg-shell px-5 py-5 font-mono text-[12px] leading-relaxed text-white/90">
              {mvpPod}
            </pre>
            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-ink-700">
              The first thing to increase is container disk. 30GB gets tight once you hold two model
              downloads, screenshots, logs and artifacts — 100GB is the comfortable floor for
              experimentation.
            </p>
          </div>

          <aside className="rounded-xl border border-line bg-canvas p-6">
            <h3 className="text-[13px] font-semibold text-ink-900">Cost of the MVP pod</h3>
            <dl className="mt-4 space-y-3">
              {[
              ['Hourly', '$0.49'],
              ['24/7 for a month', '≈ $353'],
              ['Start/stop while building', 'under $100'],
              ['Per model call', '$0']].
              map(([k, v]) =>
              <div key={k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[13px] text-ink-500">{k}</dt>
                  <dd className="tabular text-[14px] font-semibold text-ink-900">{v}</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-500">
              Because inference is self-hosted, a task that makes thousands of model calls costs the
              same as one that makes ten.
            </p>
          </aside>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="The model stack, and why each one is there"
          lede="Open weights throughout. Qwen is the default orchestration family because its tool-calling behaviour and multilingual handling are the strongest of the comparable open models today." />
        
        <div className="mt-9 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Responsibility', 'Model', 'VRAM (4-bit)', 'Why this one'].map((h) =>
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  
                    {h}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {modelStack.map((row) =>
              <tr key={row.model}>
                  <th
                  scope="row"
                  className="px-5 py-3 text-left text-[13px] font-medium text-ink-900">
                  
                    {row.responsibility}
                  </th>
                  <td className="px-5 py-3 font-mono text-[12px] text-brand-700">{row.model}</td>
                  <td className="tabular px-5 py-3 text-[13px] text-ink-700">{row.vram}</td>
                  <td className="px-5 py-3 text-[13px] text-ink-500">{row.why}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight text-ink-900">
              Do not load everything at once
            </h3>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-700">
              Running the full stack simultaneously on one A40 is technically possible with
              aggressive quantisation, and a bad idea — memory fragmentation, slower inference,
              loading delays and OOM risk. vLLM keeps only the active models resident instead.
            </p>
            <ol className="mt-6 space-y-2.5">
              {swapSequence.map((step, i) =>
              <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-ink-700">
                  <span className="tabular mt-0.5 font-mono text-[11px] text-brand-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              )}
            </ol>
            <p className="mt-5 text-[13px] leading-relaxed text-ink-500">
              Planning tasks are infrequent compared with execution tasks, which is what makes the
              swap cheap.
            </p>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold tracking-tight text-ink-900">
              Recommended cluster when you scale past the pilot
            </h3>
            <div className="mt-5 overflow-hidden rounded-xl border border-line bg-panel">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    {['Service', 'GPU'].map((h) =>
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      
                        {h}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {clusterSizing.map((row) =>
                  <tr key={row.service}>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-ink-900">{row.service}</p>
                        <p className="mt-0.5 text-[12px] text-ink-500">{row.note}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink-700">{row.gpu}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="light">
        <SectionHeading
          title="Rollout in four phases"
          lede="Each phase adds one capability and is useful on its own. Nothing here requires the next step to deliver value." />
        
        <ol className="mt-10 border-l border-line">
          {rolloutPhases.map((phase) =>
          <li key={phase.phase} className="relative pb-8 pl-8 last:pb-0">
              <span
              className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-brand-600"
              aria-hidden="true" />
            
              <p className="font-mono text-[11px] uppercase tracking-wider text-brand-700">
                {phase.phase}
              </p>
              <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-ink-900">
                {phase.title}
              </h3>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-500">
                {phase.body}
              </p>
            </li>
          )}
        </ol>
      </Section>

      <CTABand
        title="We will size it against your first task"
        body="Tell us the volume and the sites involved and we will tell you exactly what hardware the pilot needs."
        primary={{ to: '/company', label: 'Get a sizing' }}
        secondary={{ to: '/pricing', label: 'See pricing' }} />
      
    </>);

}