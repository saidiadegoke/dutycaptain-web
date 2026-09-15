import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';

const gatedActions = [
{ action: 'Publish or update products', gate: 'Always', why: 'Customer-facing and hard to reverse' },
{ action: 'Delete records', gate: 'Always', why: 'Destructive by definition' },
{ action: 'Send email', gate: 'Always', why: 'Leaves your organisation' },
{ action: 'Submit payments', gate: 'Always', why: 'Moves money' },
{ action: 'Write to a shared sheet', gate: 'Configurable', why: 'Low risk, often left autonomous' },
{ action: 'Read, search, extract, report', gate: 'Never', why: 'No side effects on the business' }];


export function Security() {
  return (
    <>
      <PageHeader
        eyebrow="Security & control"
        title="Agents with authority need a brake and a record"
        lede="An agent that can operate your admin dashboard is an agent that can break it. Two mechanisms make that safe: a gate in front of every destructive action, and a row in the audit log for everything else." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
          <div>
            <SectionHeading
              title="Approval gates sit inside the graph"
              lede="The job does not stop — the branch does. Extraction, validation and reporting keep running while the write waits for you, so approving costs minutes rather than a whole re-run." />
            

            <div className="mt-8 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    {['Action', 'Approval', 'Why'].map((h) =>
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
                  {gatedActions.map((row) =>
                  <tr key={row.action}>
                      <th
                      scope="row"
                      className="px-5 py-3 text-left text-[13px] font-medium text-ink-900">
                      
                        {row.action}
                      </th>
                      <td className="px-5 py-3">
                        <span
                        className={`inline-flex rounded border px-1.5 py-[2px] text-[11px] font-medium ${
                        row.gate === 'Always' ?
                        'border-danger-100 bg-danger-50 text-danger-700' :
                        row.gate === 'Configurable' ?
                        'border-warn-100 bg-warn-50 text-warn-700' :
                        'border-ok-100 bg-ok-50 text-ok-700'}`
                        }>
                        
                          {row.gate}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-ink-500">{row.why}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <figure className="rounded-xl border border-line bg-panel p-6 shadow-panel">
            <figcaption className="text-[12px] font-semibold text-ink-700">
              The decision the runtime makes
            </figcaption>
            <div className="mt-5 space-y-2 text-center">
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-[12px] font-medium text-brand-700">
                Task ready to execute
              </div>
              <div className="flex justify-center" aria-hidden="true">
                <span className="h-4 w-px bg-line-strong" />
              </div>
              <div className="rounded-lg border border-warn-100 bg-warn-50 px-4 py-2.5 text-[12px] font-medium text-warn-700">
                Does it change the business?
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ok-700">No</p>
                  <div className="mt-1.5 rounded-lg border border-ok-100 bg-ok-50 px-3 py-2.5 text-[12px] font-medium text-ok-700">
                    Runs autonomously
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-danger-700">
                    Yes
                  </p>
                  <div className="mt-1.5 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2.5 text-[12px] font-medium text-danger-700">
                    Review required
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-2" aria-hidden="true">
                <span className="h-4 w-px bg-line-strong" />
              </div>
              <div className="rounded-lg bg-ink-900 px-4 py-2.5 text-[12px] font-medium text-white">
                Approve · graph resumes
              </div>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-ink-500">
              Approvals are role-based. The operator who can approve a price write is not
              necessarily the one who can approve a payment.
            </p>
          </figure>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="Everything is written down"
          lede="Each audit row names the agent, the model, the action, the target, the token cost, the outcome and the job. Nothing an agent did is inferred after the fact." />
        
        <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {[
          {
            t: 'Reconstruct any number',
            b: 'Trace a published price back through the validation step, the extracted JSON, the screenshot that produced it and the URL it came from.'
          },
          {
            t: 'Snapshots before writes',
            b: 'A pre-write snapshot of every affected record is kept for 30 days, so a bad batch is a rollback rather than an incident.'
          },
          {
            t: 'Exportable log',
            b: 'The full audit trail exports as JSON or CSV for your own compliance review and retention rules.'
          }].
          map((item) =>
          <div key={item.t} className="bg-panel p-6">
              <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">{item.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{item.b}</p>
            </div>
          )}
        </div>
      </Section>

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              title="Self-hosted means self-hosted"
              lede="Every model in the stack is open weight and served from your cluster with vLLM. There is no vendor inference endpoint in the path, and no customer data leaves your network unless a workflow you wrote sends it somewhere." />
            
            <dl className="mt-7 space-y-4 border-t border-line pt-6">
              {[
              ['Model weights', 'Qwen3, Qwen2.5-VL, BGE — pulled once, stored on your volume'],
              ['Inference', 'vLLM on your GPUs, no external API calls'],
              ['Data at rest', 'Your PostgreSQL, your object storage, your retention policy'],
              ['Network egress', 'Only the sites and systems your workflows target'],
              ['Credentials', 'Browser sessions and API keys stored encrypted per connector']].
              map(([k, v]) =>
              <div key={k} className="grid grid-cols-1 gap-1 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <dt className="text-[13px] font-medium text-ink-900">{k}</dt>
                  <dd className="text-[13px] leading-relaxed text-ink-500">{v}</dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <SectionHeading
              title="Access and accountability"
              lede="Operators supervise, they do not share one login. Every approval carries a name." />
            
            <ul className="mt-7 space-y-4">
              {[
              'Role-based permissions per action class — read, write, publish, pay.',
              'SSO on Enterprise, with group-to-role mapping.',
              'Named approver recorded on the audit row, not just “approved”.',
              'Scheduled jobs run as a service identity with its own permitted actions.',
              'Job-level connector scoping, so a crawl cannot reach your payments adapter.'].
              map((item) =>
              <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-ink-700">
                  <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                  aria-hidden="true" />
                
                  {item}
                </li>
              )}
            </ul>
          </div>
        </div>
      </Section>

      <CTABand
        title="Bring your security review"
        body="We will walk your team through the approval model, the audit schema and the deployment topology before you commit to a pilot."
        primary={{ to: '/company', label: 'Talk to us' }}
        secondary={{ to: '/deployment', label: 'Deployment details' }} />
      
    </>);

}