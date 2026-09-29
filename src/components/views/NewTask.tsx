'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, GlobeIcon, TerminalIcon, PaperclipIcon, FileTextIcon, XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { tasksApi, ApiError, endpointsApi, peopleApi, schedulesApi } from '@/lib/api';
import type { Endpoint, GapRoute, Person, Pool, ScheduleMode } from '@/lib/types';
import { ScheduleFields } from '@/components/ScheduleFields';
import { RichTextEditor } from '@/components/RichTextEditor';
import { bytes } from '@/utils/format';

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


const MAX_ATTACH_BYTES = 10 * 1024 * 1024;
const MAX_ATTACH_FILES = 10;
const ATTACH_ACCEPT = '.txt,.md,.csv,.json,.html,.htm,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx';

export function NewTask() {
  const router = useRouter();
  const [objective, setObjective] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [sendTo, setSendTo] = useState('');
  const [alsoOnFailure, setAlsoOnFailure] = useState(false);
  const [reviewPlan, setReviewPlan] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [days, setDays] = useState<number[]>([]);
  const [timezone, setTimezone] = useState('UTC');
  const [mode, setMode] = useState<ScheduleMode>('review_each');
  const [runOnceNow, setRunOnceNow] = useState(false);
  // Where what it could not get goes (phase 6): '' | 'owner' | 'person:<id>' | 'pool:<id>'.
  const [gapTo, setGapTo] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  // Files marked sensitive.
  const [sensitive, setSensitive] = useState<Set<File>>(new Set());
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.size <= MAX_ATTACH_BYTES);
    if (incoming.length < list.length) setError('Files over 10 MB were left out.');
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_ATTACH_FILES));
  }

  /**
   * Create the task, attach its files, then start it — files first, so the
   * plan is made with them. A file that will not attach cancels the draft
   * rather than leaving a task that runs without it.
   */
  async function createAndStart(options: Parameters<typeof tasksApi.create>[1]) {
    const task = await tasksApi.create(objective.trim(), { ...options, ...(files.length ? { start: false } : {}) });
    if (!files.length) return task;
    for (const f of files) {
      try {
        await tasksApi.addAttachment(task.id, f, { sensitive: sensitive.has(f) });
      } catch (err) {
        await tasksApi.control(task.id, 'cancel').catch(() => {});
        throw new ApiError(`Could not attach ${f.name}: ${err instanceof ApiError ? err.message : 'upload failed'}. Nothing was started.`, 422);
      }
    }
    await tasksApi.start(task.id);
    return task;
  }

  useEffect(() => {
    try { setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'); } catch { /* UTC */ }
  }, []);

  useEffect(() => { endpointsApi.list().then(setEndpoints).catch(() => setEndpoints([])); }, []);
  useEffect(() => { peopleApi.list().then((d) => { setPeople(d.people); setPools(d.pools); }).catch(() => {}); }, []);

  const gaps: GapRoute | undefined = gapTo === 'owner' ? { to: 'owner' }
    : gapTo.startsWith('person:') ? { to: 'people', people: [gapTo.slice(7)] }
      : gapTo.startsWith('pool:') ? { to: 'pool', pool: gapTo.slice(5) } : undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const deliverTo = sendTo ? { endpoint_id: sendTo, when: (alsoOnFailure ? 'finished' : 'done') as 'done' | 'finished' } : undefined;
      const when = { times, days, timezone };

      if (repeat && mode !== 'reuse_plan') {
        // Plans at each run (and stops for review, in review_each).
        await schedulesApi.create({ objective: objective.trim(), mode, ...when, ...(deliverTo ? { deliver_to: deliverTo } : {}) });
        if (!runOnceNow) {
          router.push('/app/schedules');
          return;
        }
        const first = await createAndStart({
          ...(deliverTo ? { deliver_to: deliverTo } : {}), review_plan: mode === 'review_each' || reviewPlan, ...(gaps ? { gaps } : {}),
        });
        router.push(`/app/tasks/${first.id}`);
        return;
      }

      const task = await createAndStart({
        ...(deliverTo ? { deliver_to: deliverTo } : {}),
        ...(reviewPlan ? { review_plan: true } : {}),
        ...(gaps ? { gaps } : {}),
        // Plan now, you review it, and every run reuses that plan.
        ...(repeat && mode === 'reuse_plan' ? { schedule: when } : {})
      });
      // Straight to the detail page: the task is already running (or planning
      // for your review) by the time this resolves.
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
          <RichTextEditor
            value={objective}
            onChange={setObjective}
            ariaLabel="Objective"
            autoFocus
            placeholder="e.g. Price each item in the attached list at Lagos filling stations, and send me a CSV." />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            className={`mt-3 rounded-lg border border-dashed px-3 py-2.5 text-[12px] transition-colors ${dragging ? 'border-brand-500 bg-brand-50' : 'border-line'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => picker.current?.click()}
              className="inline-flex cursor-pointer items-center gap-1 font-medium text-brand-700 hover:text-brand-500">
                <PaperclipIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Attach files
              </button>
              <span className="text-ink-500">or drop them here — a list, a brief, a spreadsheet export (CSV, TXT, MD, JSON, PDF, HTML, XLSX, DOCX, images · up to 10 MB each, 10 files)</span>
              <input ref={picker} type="file" multiple hidden accept={ATTACH_ACCEPT} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>
            {files.length > 0 &&
            <ul className="mt-2 flex flex-wrap gap-1.5">
                {files.map((f, i) =>
              <li key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1 text-[12px] text-ink-900">
                    <FileTextIcon className="h-3.5 w-3.5 text-ink-500" strokeWidth={2} />
                    <span className="max-w-[220px] truncate">{f.name}</span>
                    <span className="text-ink-400">{bytes(f.size)}</span>
                    <label className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-ink-500" title="Kept for this task only, and the task asks you before it sends anything outside">
                      <input type="checkbox" checked={sensitive.has(f)} className="cursor-pointer"
                    onChange={(e) => setSensitive((prev) => { const next = new Set(prev); if (e.target.checked) next.add(f); else next.delete(f); return next; })} />
                      Sensitive
                    </label>
                    <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}
                  className="cursor-pointer rounded p-0.5 text-ink-400 hover:text-ink-900">
                      <XIcon className="h-3 w-3" strokeWidth={2.4} />
                    </button>
                  </li>
              )}
              </ul>
            }
            {files.length > 0 && repeat &&
            <p className="mt-2 text-warn-700">Attached files are used by {mode === 'reuse_plan' || runOnceNow ? 'this first task' : 'no run'}; scheduled runs don’t get them yet.</p>
            }
          </div>

          <div className="mt-3 space-y-3 border-t border-line pt-3 text-[12px]">
            <label className="flex cursor-pointer items-start gap-2 text-ink-700">
              <input type="checkbox" checked={reviewPlan || (repeat && mode !== 'auto')} disabled={repeat && mode !== 'auto'}
              onChange={(e) => setReviewPlan(e.target.checked)} className="mt-0.5 cursor-pointer" />
              <span>
                <span className="font-medium text-ink-900">Review the plan before it runs</span>
                <span className="block text-ink-500">It plans, then stops so you can choose how each step runs — or do a step yourself — and press Run.</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2 text-ink-700">
              <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="mt-0.5 cursor-pointer" />
              <span className="font-medium text-ink-900">Repeat on a schedule</span>
            </label>
            {repeat && <ScheduleFields
              times={times} setTimes={setTimes} days={days} setDays={setDays}
              timezone={timezone} setTimezone={setTimezone} mode={mode} setMode={setMode}
              runOnceNow={runOnceNow} setRunOnceNow={setRunOnceNow} />}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12px]">
            <label className="inline-flex items-center gap-2 text-ink-700">
              When it’s done, send the result to
              <select
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="cursor-pointer rounded-md border border-line bg-panel px-2 py-1 font-mono text-[12px] text-ink-900">
                <option value="">nowhere</option>
                {endpoints.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
              </select>
            </label>
            {sendTo &&
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-ink-700">
                <input type="checkbox" checked={alsoOnFailure} onChange={(e) => setAlsoOnFailure(e.target.checked)} className="cursor-pointer" />
                also if it fails
              </label>
            }
            {sendTo && endpoints.find((ep) => ep.id === sendTo)?.approval === 'ask' &&
            <span className="text-ink-500">You’ll be asked to approve before it sends.</span>
            }
            <Link href="/app/settings" className="text-brand-700 hover:text-brand-500">
              {endpoints.length ? 'Manage endpoints' : 'Add an API endpoint'}
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12px]">
            <label className="inline-flex items-center gap-2 text-ink-700">
              If something can’t be found or read clearly,
              <select value={gapTo} onChange={(e) => setGapTo(e.target.value)} aria-label="Where gaps go"
                className="cursor-pointer rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-ink-900">
                <option value="">deliver it marked partial</option>
                <option value="owner">ask me to fill it in</option>
                {people.map((p) => <option key={p.id} value={`person:${p.id}`}>ask {p.name}</option>)}
                {pools.map((p) => <option key={p.id} value={`pool:${p.id}`}>ask the {p.name} pool</option>)}
              </select>
            </label>
            <span className="text-ink-500">Only the missing or unclear values are asked for; the rest of the task keeps going.</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-[11px] text-ink-400">
              {objective.length} / 4000
            </p>
            <button
              type="submit"
              disabled={!objective.trim() || busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-50">
              
              {busy ? 'Starting…' : repeat ? (mode === 'reuse_plan' ? 'Plan it now' : runOnceNow ? 'Save schedule and start' : 'Save schedule') : reviewPlan ? 'Plan it' : 'Start task'}
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
