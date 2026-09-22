'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, GlobeIcon, TerminalIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { tasksApi, ApiError } from '@/lib/api';

/**
 * New task (P1-15).
 *
 * The composer was a mock that produced a fake plan from a fixture. It now
 * creates a real task and navigates to it — deliberately without showing a plan
 * first, because there is nothing to show: the runtime does not plan ahead in
 * Phase 1. It decides one action at a time (§5.1), so the plan appears on the
 * detail page as steps happen. A preview here would be an invention.
 *
 * The examples are written to match what the two Level-1 actuators can actually
 * do. Suggesting "update all SmartStore prices" would set the model up to
 * propose capabilities that do not exist, which the loop would reject three
 * times before failing the task.
 */
const examples = [
'Fetch https://api.github.com/repos/nodejs/node and report the star count and open issue count.',
'Fetch https://api.github.com/repos/nodejs/node and https://api.github.com/repos/denoland/deno, then use Python to compare their stars-to-open-issues ratios.',
'Fetch https://httpbin.org/json and summarise what the response contains.',
'Use Python to compute the first 20 Fibonacci numbers and their sum.'];


const capabilities = [
{ name: 'http.request', icon: GlobeIcon, detail: 'Fetch a URL. Read-only, and cannot reach private networks.' },
{ name: 'python.run', icon: TerminalIcon, detail: 'Run a script in a sandbox. No network, nothing persists.' }];


export function NewTask() {
  const router = useRouter();
  const [objective, setObjective] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const task = await tasksApi.create(objective.trim());
      // Straight to the detail page: the task is already running by the time
      // this resolves, and the interesting part is watching it.
      router.push(`/app/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/app/tasks" className="inline-flex items-center gap-1 text-[12px] text-ink-500 transition-colors duration-150 ease-out hover:text-ink-900">
        <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2} />
        All tasks
      </Link>

      <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-ink-900">New task</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        Describe the outcome you want. The runtime decides the steps.
      </p>

      <form onSubmit={submit} className="mt-5">
        <div className="rounded-xl border border-line bg-panel p-4 shadow-panel">
          <label htmlFor="objective" className="sr-only">
            Objective
          </label>
          <textarea
            id="objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={4}
            maxLength={4000}
            autoFocus
            placeholder="e.g. Fetch the Node.js repo from the GitHub API and report its star count."
            className="w-full resize-y bg-transparent text-[14px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:outline-none" />
          

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-[11px] text-ink-400">
              {objective.length} / 4000
            </p>
            <button
              type="submit"
              disabled={!objective.trim() || busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-50">
              
              {busy ? 'Starting…' : 'Start task'}
              <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {error &&
        <p role="alert" className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
            {error}
          </p>
        }
      </form>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel title="Try one of these" description="Written for the capabilities that exist today">
          <ul className="space-y-2">
            {examples.map((ex) =>
            <li key={ex}>
                <button
                type="button"
                onClick={() => setObjective(ex)}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-left text-[12px] leading-relaxed text-ink-700 transition-colors duration-150 ease-out hover:border-brand-200 hover:text-ink-900">
                
                  {ex}
                </button>
              </li>
            )}
          </ul>
        </Panel>

        <Panel title="What it can do" description="Phase 1 ships two Level-1 actuators">
          <ul className="space-y-3">
            {capabilities.map((c) =>
            <li key={c.name} className="flex items-start gap-2.5">
                <c.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                <div>
                  <p className="font-mono text-[12px] text-ink-900">{c.name}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{c.detail}</p>
                </div>
              </li>
            )}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-400">
            Browsers, spreadsheets, files and your own machine arrive in later phases. Ask for
            something outside this list and the task will say so rather than pretend.
          </p>
        </Panel>
      </div>
    </div>);

}
