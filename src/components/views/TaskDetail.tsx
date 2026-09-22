'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  BrainIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  XCircleIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { ProgressBar } from '@/components/ProgressBar';
import { AgentTag, TaskStatusBadge, StepStatusBadge } from '@/components/StatusBadge';
import { WorkflowGraph } from '@/components/WorkflowGraph';
import { LiveBrowser } from '@/components/LiveBrowser';
import { tasks } from '@/data/tasks';
import { extractionSample, stepRuns, workflow } from '@/data/workflow';
import { count, pct } from '@/utils/format';

const memoryNotes = [
'Prefers Konga over Jumia when both list the same SKU.',
'Pointek blocks headless chromium — use firefox profile.',
'Prices above ₦2M require a second source before write.'];


export function TaskDetail() {
  const { taskId } = useParams();
  const task = tasks.find((j) => j.id === taskId) ?? tasks[0];
  const [paused, setPaused] = useState(task.status === 'paused');
  const progress = pct(task.done, task.total);

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link href="/app/tasks"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 transition-colors duration-150 ease-out hover:text-ink-900">
        
        <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        Tasks
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <TaskStatusBadge status={paused ? 'paused' : task.status} />
            <span className="font-mono text-[11px] text-ink-400">{task.id}</span>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-ink-900">
            {task.name}
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-500">“{task.goal}”</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
            
            {paused ?
            <PlayIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> :

            <PauseIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            }
            {paused ? 'Resume dispatch' : 'Pause dispatch'}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-danger-700 transition-colors duration-150 ease-out hover:bg-danger-50">
            
            <XCircleIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Cancel task
          </button>
          <Link href="/app/approvals"
            className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-ink-800">
            
            <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Review 3,487 changes
          </Link>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-panel px-6 py-5 shadow-panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[220px] flex-1">
            <div className="flex items-baseline justify-between">
              <p className="tabular text-[24px] font-semibold leading-none tracking-tight text-ink-900">
                {progress}%
              </p>
              <p className="tabular text-[12px] text-ink-500">
                {count(task.done)} / {count(task.total)} SKUs
              </p>
            </div>
            <div className="mt-2.5">
              <ProgressBar value={progress} label="Task progress" />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {[
            { label: 'Started', value: task.startedAt },
            { label: 'Elapsed', value: task.elapsed },
            { label: 'Est. remaining', value: paused ? 'paused' : task.eta },
            { label: 'Workers', value: `${task.workers} of 20` }].
            map((m) =>
            <div key={m.label}>
                <dt className="text-[11px] text-ink-500">{m.label}</dt>
                <dd className="tabular mt-0.5 text-[13px] font-semibold text-ink-900">
                  {m.value}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Panel
            title="Execution graph"
            description="Generated by the planner from the goal, then executed as a DAG."
            action={
            <span className="font-mono text-[10px] uppercase tracking-wide text-ink-400">
                6 stages · 8 nodes
              </span>
            }>
            
            <WorkflowGraph stages={workflow} />
          </Panel>

          <Panel
            title="Step runs"
            description="Most recent dispatches across all branches."
            padded={false}>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    {['Step', 'Node', 'Target', 'Model', 'Duration', 'Status'].map((h) =>
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      
                        {h}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stepRuns.map((t) =>
                  <tr key={t.id} className="transition-colors duration-150 ease-out hover:bg-canvas">
                      <td className="px-5 py-2.5 font-mono text-[11px] text-ink-500">{t.id}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <AgentTag agent={t.agent} />
                          <span className="font-mono text-[11px] text-ink-700">{t.node}</span>
                        </div>
                      </td>
                      <td className="max-w-[260px] truncate px-5 py-2.5 text-[12px] text-ink-900">
                        {t.target}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[11px] text-ink-700">{t.model}</td>
                      <td className="tabular px-5 py-2.5 text-[12px] text-ink-700">
                        {t.duration}
                        {t.attempt > 1 &&
                      <span className="ml-1 text-warn-700">· try {t.attempt}</span>
                      }
                      </td>
                      <td className="px-5 py-2.5">
                        <StepStatusBadge status={t.status} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel
            title="What worker W01 sees"
            description="Vision agent regions drawn over the live frame.">
            
            <LiveBrowser
              url="jumia.com.ng/galaxy-s24-ultra-512gb"
              worker="W01"
              step="extract price + stock" />
            
          </Panel>

          <Panel title="Last structured extraction">
            <pre className="overflow-x-auto rounded-lg border border-line bg-canvas px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-800">
              {extractionSample}
            </pre>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
              Output is stored as JSON first, then shaped into the Excel audit at the report
              stage.
            </p>
          </Panel>

          <Panel
            title="Memory applied to this task"
            action={<BrainIcon className="h-4 w-4 text-ink-400" strokeWidth={1.9} />}>
            
            <ul className="space-y-2.5">
              {memoryNotes.map((note) =>
              <li key={note} className="flex gap-2.5 text-[12px] leading-relaxed text-ink-700">
                  <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                  aria-hidden="true" />
                
                  {note}
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>);

}