import { PageHeader, Section, SectionHeading } from '@/components/marketing/Section';
import { CTABand } from '@/components/marketing/CTABand';

const gatedActions = [
{ action: 'Send an email or message', gate: 'Always', why: 'It leaves your organisation' },
{ action: 'Make a payment or transfer', gate: 'Always', why: 'Moves money; also asks you to sign in again' },
{ action: 'Delete or overwrite outside the task', gate: 'Always', why: 'Hard or impossible to reverse' },
{ action: 'Submit a form or publish content', gate: 'Always', why: 'Seen by others once done' },
{ action: 'Grant a new permission or install software', gate: 'Always', why: 'Changes what is possible next' },
{ action: 'Look at your screen', gate: 'Always', why: 'A picture can show far more than the task needs' },
{ action: 'Read, search, analyse, prepare a file', gate: 'Never', why: 'Changes nothing outside the task' }];


export function Security() {
  return (
    <>
      <PageHeader
        eyebrow="Trust & control"
        title="Authority to act needs a brake and a record"
        lede="A system that can send, pay and change records on your behalf must be held to rules. DutyCaptain has two: nothing consequential happens without your approval, and everything is written down." />
      

      <Section tone="light">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
          <div>
            <SectionHeading
              title="The AI proposes; your rules decide"
              lede="The AI never carries out an action itself. Every proposed step passes through rules you control, which allow it, ask you, or block it. While one step waits for you, the rest of the task carries on." />
            

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
              The decision made before every step
            </figcaption>
            <div className="mt-5 space-y-2 text-center">
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-[12px] font-medium text-brand-700">
                The AI proposes a step
              </div>
              <div className="flex justify-center" aria-hidden="true">
                <span className="h-4 w-px bg-line-strong" />
              </div>
              <div className="rounded-lg border border-warn-100 bg-warn-50 px-4 py-2.5 text-[12px] font-medium text-warn-700">
                What do your rules say?
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ok-700">No</p>
                  <div className="mt-1.5 rounded-lg border border-ok-100 bg-ok-50 px-3 py-2.5 text-[12px] font-medium text-ok-700">
                    Runs straight away
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-danger-700">
                    Yes
                  </p>
                  <div className="mt-1.5 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2.5 text-[12px] font-medium text-danger-700">
                    Asks you first
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-2" aria-hidden="true">
                <span className="h-4 w-px bg-line-strong" />
              </div>
              <div className="rounded-lg bg-ink-900 px-4 py-2.5 text-[12px] font-medium text-white">
                Once · for this task · always
              </div>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-ink-500">
              Rules can also block an action outright. Every approval is recorded with who gave
              it, when, and exactly what it covered.
            </p>
          </figure>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          title="Everything is written down"
          lede="Each step records what was done, by which route and which AI model, what it cost, how it was checked, and who approved it. Nothing is reconstructed after the fact." />
        
        <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {[
          {
            t: 'Trace any result',
            b: 'Follow a figure in a report back through the check that confirmed it, the step that produced it, and the document or page it came from.'
          },
          {
            t: 'Nothing leaves your computer silently',
            b: 'When a document’s contents leave your computer, the event is recorded with the file and its size — so you can see exactly what crossed.'
          },
          {
            t: 'Passwords never reach the AI',
            b: 'Credentials for connected services are kept in a secure store and used only at the moment of the action. The AI sees a name, never a key.'
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
              title="Your computer, your rules"
              lede="The companion program is a helper, not a second decision-maker. It holds no plan and no AI of its own; it carries out approved instructions within the permissions you gave, and nothing more." />
            
            <dl className="mt-7 space-y-4 border-t border-line pt-6">
              {[
              ['Access', 'Only the folders and applications you name — never the whole computer'],
              ['Checked twice', 'The cloud will not send an instruction without permission, and your computer checks it again'],
              ['Connection', 'Outgoing only; no ports opened, nothing exposed to the internet'],
              ['Screen', 'A separate permission, and your approval each time it is used'],
              ['Control', 'Pause from the menu bar, or withdraw access instantly from the web']].
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
              title="Built for content that cannot be trusted"
              lede="Web pages, documents and emails are written by other people. DutyCaptain treats them as information to read, never as instructions to follow." />
            
            <ul className="mt-7 space-y-4">
              {[
              'Text on a page that tries to give orders cannot approve anything; at most it can cause a proposal, which your rules then judge.',
              'The goal of a task can only be changed by you, not by something the task read.',
              'Cloud work runs in isolated workspaces that are discarded after each task.',
              'A dropped connection can never cause an action to happen twice.',
              'Team roles, named approvers and single sign-on are coming for larger organisations.'].
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
        body="We will walk your team through the approval rules, the task history and where work runs before you commit to anything."
        primary={{ to: '/company', label: 'Talk to us' }}
        secondary={{ to: '/deployment', label: 'Where it runs' }} />
      
    </>);

}