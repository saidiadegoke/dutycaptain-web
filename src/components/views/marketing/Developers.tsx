'use client';

import { useState } from 'react';
import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';

const apiSample = `curl -X POST https://api.dutycaptain.com/tasks \\
  -H "Authorization: Bearer $DUTYCAPTAIN_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "objective": "Pull last month's Shopify orders, build the sales workbook and email it to our accountant",
    "budget": { "usd": 2, "steps": 40 }
  }'

# Watch it run
curl -N https://api.dutycaptain.com/tasks/$TASK_ID/events

# Approve the pending email, for this task only
curl -X POST https://api.dutycaptain.com/approvals/$APPROVAL_ID/decide \\
  -d '{ "granted": true, "scope": "task" }'`;

const cliSample = `# Coming with connections and schedules
dc run "Analyse these CSVs and produce a report"
dc tasks
dc logs <task-id>
dc pause <task-id>
dc devices`;

const capabilities = `filesystem.search    spreadsheet.write
filesystem.read      pdf.generate
document.extract     http.request
browser.navigate     python.run
browser.elements     computer.elements
browser.locate       computer.invoke`;

const observation = `{
  "status": "success",
  "summary": "Workbook created: 3 sheets, 12,438 rows",
  "data": { "sheets": 3, "rows": 12438 },
  "verification": { "passed": true,
    "check": "reopened; formulas evaluate" }
}`;

const surfaces = [
{
  name: 'Tasks API',
  detail: 'Create a task from a sentence, set its spending limits, pause, resume or cancel it, and fetch its history.',
  endpoint: 'POST /tasks'
},
{
  name: 'Live events',
  detail: 'A stream of everything as it happens: the plan, each step, each check, each approval request.',
  endpoint: 'GET /tasks/:id/events'
},
{
  name: 'Approvals',
  detail: 'Answer an approval from your own system — once, for this task, or always.',
  endpoint: 'POST /approvals/:id/decide'
},
{
  name: 'Webhooks and API keys',
  detail: 'Be told when a task finishes or needs you, and give your own systems their own keys.',
  endpoint: 'task.finished'
},
{
  name: 'Your own tools (coming)',
  detail: 'Tool servers you already run can be added as connected services, with no change to how tasks are planned.',
  endpoint: 'MCP'
}];


type Tab = 'api' | 'cli';

export function Developers() {
  const [tab, setTab] = useState<Tab>('api');

  return (
    <>
      <PageHeader
        eyebrow="Developers"
        title="Everything in the console is available to your code"
        lede="Start tasks from your own systems, follow them live, and answer approvals where your team already works. The same rules, checks and history apply however a task was started." />


      <Section tone="light">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <div>
            <div className="flex items-center gap-1 rounded-md border border-line bg-canvas p-1">
              {
              [
              { id: 'api' as Tab, label: 'HTTP API' },
              { id: 'cli' as Tab, label: 'Command line (coming)' }].

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
              {tab === 'api' ? apiSample : cliSample}
            </pre>

            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-700">
              {tab === 'api' ?
              'A task is one sentence and, optionally, its limits. DutyCaptain plans it, and the event stream reports each step as it happens — so your dashboard can show exactly what the console shows.' :
              'The command-line tool uses the same API, the same sign-in and the same task history. A task started in a terminal can be watched and approved on the web.'}
            </p>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Capabilities, not implementations</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
                The AI sees what can be done, never how. Reading a file in the cloud and on your
                computer is the same capability; DutyCaptain decides where it runs.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-800">
                {capabilities}
              </pre>
            </div>

            <div className="rounded-xl border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[13px] font-semibold text-ink-900">Structured results</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
                Every step returns facts, not prose, and the check that confirmed them.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-canvas px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-800">
                {observation}
              </pre>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="Ways in"
          lede="Drive DutyCaptain from your own systems, or be told when it needs you." />

        <dl className="mt-10 divide-y divide-line border-y border-line">
          {surfaces.map((s) =>
          <div
            key={s.name}
            className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[200px_minmax(0,1fr)_220px] md:items-baseline md:gap-8">

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
          lede="Long tasks fail in the middle. DutyCaptain assumes it, and recovers step by step rather than starting again." />

        <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {[
          {
            t: 'Repair before replanning',
            b: 'A broken step is fixed where it stands. The whole plan is only rethought when the plan itself was wrong.'
          },
          {
            t: 'A simpler route, then a harder one',
            b: 'A step that keeps failing by one route is tried by the next, and every move between routes is recorded.'
          },
          {
            t: 'Survives a restart',
            b: 'Task state is saved after every step, so a server that stops mid-task is replaced and the task continues from where it was.'
          },
          {
            t: 'Never twice',
            b: 'Every instruction to your computer carries its own identity, so a dropped connection cannot send the same email twice.'
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
        title="Get API access"
        body="Early-access accounts include API keys. Tell us what you want to connect DutyCaptain to."
        primary={{ to: '/company', label: 'Request access' }}
        secondary={{ to: '/platform', label: 'How it works' }} />

    </>);

}
