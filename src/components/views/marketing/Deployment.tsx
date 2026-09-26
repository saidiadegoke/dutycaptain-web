import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import {
  deploymentOptions,
  modelProviders,
  modelRoles,
  roadmap,
  type ReleaseStatus } from
'@/data/marketing';

const whereWorkRuns = [
['Web research, connected services, data analysis', 'Cloud'],
['Building reports, workbooks and PDFs', 'Cloud'],
['Websites without a connection', 'Cloud browser'],
['Scheduled and long-running tasks', 'Cloud'],
['Files and documents on your computer', 'Your computer'],
['Desktop applications, printers, the office network', 'Your computer'],
['Portals that need a certificate installed on your machine', 'Your computer']];


const waitingFlow = [
'A step needs your computer',
'Is your computer online?',
'If not, the task pauses — it does not fail',
'You see exactly what it needs: which folder, which application',
'Your computer comes online, or you connect one',
'The task resumes from the same step'];


const statusChrome: Record<ReleaseStatus, string> = {
  Available: 'border-ok-100 bg-ok-50 text-ok-700',
  'Rolling out': 'border-brand-200 bg-brand-50 text-brand-700',
  'Coming next': 'border-warn-100 bg-warn-50 text-warn-700',
  Planned: 'border-line bg-canvas text-ink-500'
};

function StatusBadge({ status }: {status: ReleaseStatus;}) {
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-[2px] text-[11px] font-medium ${statusChrome[status]}`}>

      {status}
    </span>);

}

export function Deployment() {
  return (
    <>
      <PageHeader
        eyebrow="Where it runs"
        title="Cloud first, with your computer when it counts"
        lede="There is no separate cloud product and desktop product. There is DutyCaptain, and for each step it decides where the work should happen — in the cloud by default, on your own computer only when the task genuinely needs it." />


      <Section tone="light">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div>
            <SectionHeading
              title="Where each kind of work happens"
              lede="Most tasks never touch your computer. When one does, only that step runs there, and only what the step needs comes back." />

            <div className="mt-7 overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    {['Work', 'Runs in'].map((h) =>
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
                  {whereWorkRuns.map(([work, where]) =>
                  <tr key={work}>
                      <td className="px-4 py-2.5 text-[13px] text-ink-900">{work}</td>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-brand-700">{where}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-ink-700">
              On your computer, the search and reading happen locally. A task that looks for this
              year’s invoices sends back the figures it found — not your Documents folder.
            </p>
          </div>

          <aside className="rounded-xl border border-line bg-canvas p-6">
            <h3 className="text-[13px] font-semibold text-ink-900">When a task needs your computer</h3>
            <ol className="mt-4 space-y-3">
              {waitingFlow.map((step, i) =>
              <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-ink-700">
                  <span className="tabular mt-0.5 font-mono text-[11px] text-brand-700">{i + 1}</span>
                  {step}
                </li>
              )}
            </ol>
            <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-500">
              Where DutyCaptain can tell in advance, it says so before starting — “this needs your
              computer because it uses Excel” — rather than after doing work that cannot finish.
            </p>
          </aside>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="The right AI model for each step"
          lede="DutyCaptain is not tied to one AI company. Each step can use a different model, chosen for what the step needs and what it costs — and switching providers changes nothing about how your tasks run." />


        <ul className="mt-7 flex flex-wrap gap-2">
          {modelProviders.map((p) =>
          <li
            key={p}
            className="rounded-md border border-line bg-panel px-3 py-1.5 text-[13px] font-medium text-ink-900">

              {p}
            </li>
          )}
        </ul>

        <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-canvas">
                {['Job in the task', 'Typical choice', 'Why'].map((h) =>
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
              {modelRoles.map((row) =>
              <tr key={row.responsibility}>
                  <th
                  scope="row"
                  className="px-5 py-3 text-left text-[13px] font-medium text-ink-900">

                    {row.responsibility}
                  </th>
                  <td className="px-5 py-3 text-[13px] text-brand-700">{row.choice}</td>
                  <td className="px-5 py-3 text-[13px] text-ink-500">{row.why}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <h3 className="text-[16px] font-semibold tracking-tight text-ink-900">Ways to run DutyCaptain</h3>
          <div className="mt-5 overflow-hidden rounded-xl border border-line bg-panel">
            <table className="w-full border-collapse text-left">
              <tbody className="divide-y divide-line">
                {deploymentOptions.map((row) =>
                <tr key={row.name}>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-ink-900">{row.name}</p>
                      <p className="mt-0.5 text-[12px] text-ink-500">{row.note}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section tone="light" id="roadmap">
        <SectionHeading
          title="What is available, and what is coming"
          lede="DutyCaptain is released in stages, each useful on its own. Early-access members are told as each stage arrives." />

        <ol className="mt-10 border-l border-line">
          {roadmap.map((stage) =>
          <li key={stage.title} className="relative pb-8 pl-8 last:pb-0">
              <span
              className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-brand-600"
              aria-hidden="true" />

              <StatusBadge status={stage.status} />
              <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-ink-900">
                {stage.title}
              </h3>
              <ul className="mt-2.5 max-w-2xl space-y-1.5">
                {stage.items.map((item) =>
              <li key={item} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-500">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" aria-hidden="true" />
                    {item}
                  </li>
              )}
              </ul>
            </li>
          )}
        </ol>
      </Section>

      <CTABand
        title="Need it inside your own infrastructure?"
        body="Private deployment and your own AI models are on the way. Tell us what your organisation requires and we will keep you informed."
        primary={{ to: '/company', label: 'Talk to us' }}
        secondary={{ to: '/pricing', label: 'See plans' }} />

    </>);

}
