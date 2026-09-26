import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';
import { routes } from '@/data/marketing';

const graphStages = [
{ nodes: ['Fetch last month’s orders'], state: 'done' },
{ nodes: ['Analyse orders'], state: 'done' },
{ nodes: ['Build the workbook', 'Prepare the charts'], state: 'run' },
{ nodes: ['Check the workbook'], state: 'queued' },
{ nodes: ['Your approval'], state: 'wait' },
{ nodes: ['Email to accountant'], state: 'queued' }];


const stageChrome: Record<string, string> = {
  done: 'border-line bg-panel text-ink-700',
  run: 'border-brand-200 bg-brand-50 text-brand-700',
  queued: 'border-dashed border-line-strong bg-canvas text-ink-500',
  wait: 'border-warn-100 bg-warn-50 text-warn-700'
};

const checks = [
['Spreadsheet created', 'Reopened; sheets, rows and formulas confirmed'],
['PDF produced', 'Opened; pages counted and text readable'],
['Email sent', 'Delivery confirmed by the email service'],
['Web form submitted', 'Confirmation page read back'],
['File saved on your computer', 'Read again and compared'],
['Button pressed in an application', 'The application asked for its new state']];


const memory = [
['Task history', 'Every step, result, cost and approval, kept with the task'],
['Account memory', 'Facts you choose to keep — your accountant’s address, your store — visible and deletable'],
['Files produced', 'Reports and workbooks, kept 30 days by default'],
['Permissions', 'What you have allowed, for how long, and on which computer']];


export function Platform() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="A system that does the work, not a chat that describes it"
        lede="The AI decides what should happen next. Everything else — carrying it out, checking it, asking for approval and keeping the record — is handled by DutyCaptain itself, under rules you control." />


      <Section tone="light">
        <SectionHeading
          title="Four routes to any system, simplest first"
          lede="For every step, DutyCaptain chooses the most dependable way to reach what it needs, and moves to a less direct route only when the simpler one cannot do the job. Each move is recorded, so you can see how often it happens." />


        <dl className="mt-10 divide-y divide-line border-y border-line">
          {routes.map((route) =>
          <div
            key={route.id}
            className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">

              <dt>
                <span className="text-[15px] font-semibold tracking-tight text-ink-900">
                  {route.name}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-brand-700">
                  {route.level}
                </span>
              </dt>
              <dd className="max-w-2xl text-[14px] leading-relaxed text-ink-700">
                {route.summary}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      <Section tone="canvas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div>
            <SectionHeading
              title="A plan you can see, not a script"
              lede="A task becomes a set of steps with an order: what can happen side by side, what must wait, and where you need to sign off. You see it before it runs." />


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
                The plan for a monthly sales report. The workbook and its charts are prepared side by
                side; the email waits behind one approval.
              </figcaption>
            </figure>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">When a step goes wrong</h3>
              <ol className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink-700">
                {[
                'Try the step again',
                'Try it by another route',
                'Correct that part of the plan',
                'Rethink the plan',
                'Stop and ask you'].
                map((s, i) =>
                <li key={s} className="flex gap-2.5">
                    <span className="tabular font-mono text-[11px] text-brand-700">{i + 1}</span>
                    {s}
                  </li>
                )}
              </ol>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                Each stage has a limit, so a stubborn step cannot loop for ever. Completed steps are
                never repeated.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Limits that are enforced</h3>
              <dl className="mt-3 space-y-2.5 text-[12px]">
                {[
                ['Spend', 'a cap per task'],
                ['Time', 'a cap per task'],
                ['Steps', 'a cap per task'],
                ['At the limit', 'pauses and asks']].
                map(([k, v]) =>
                <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="font-medium text-ink-900">{v}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                The cost of every task is shown live while it runs.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              title="Checked, not assumed"
              lede="Every change is followed by a check that it had the intended effect. The check is carried out by DutyCaptain itself, not by asking the AI whether it thinks it succeeded." />

            <div className="mt-7 overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      After
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      DutyCaptain checks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {checks.map(([a, c]) =>
                  <tr key={a}>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-ink-900">{a}</td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-700">{c}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-500">
              Where nothing can be checked — a click at a point on the screen, for example — the
              step is recorded as unchecked rather than reported as a success.
            </p>
          </div>

          <div>
            <SectionHeading
              title="A memory you can see"
              lede="DutyCaptain remembers what makes the next task easier, and nothing is remembered silently. Everything it keeps is listed in your settings and can be removed." />

            <div className="mt-7 overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      What
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      Kept as
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {memory.map(([t, p]) =>
                  <tr key={t}>
                      <td className="px-4 py-2.5 text-[13px] font-medium text-ink-900">{t}</td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-700">{p}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Link href="/deployment"
              className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">

              Where the work happens
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </Section>

      <CTABand
        title="See it on a task of your own"
        body="Bring a task that touches a document, a website, or an application on your computer. Those are the interesting ones." />

    </>);

}
