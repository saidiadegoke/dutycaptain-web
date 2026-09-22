'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  LoaderIcon,
  PaperclipIcon,
  RocketIcon,
  SparklesIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { AgentKind } from '@/types';
import { AgentTag } from '@/components/StatusBadge';

const examples = [
'Compare prices of all Samsung phones across Jumia, Konga, Slot and Pointek. Update SmartStore and generate an Excel audit.',
'Read the 148 supplier invoices in /uploads/march and produce a reconciled payables JSON.',
'Every morning at 8, read the NNPC fuel price board and publish it to the ops sheet.'];


const connectors = ['SmartStore', 'Google Sheets', 'Postgres', 'Courier APIs', 'Files only'];

interface PlanStep {
  step: string;
  agent: AgentKind;
  note: string;
  parallel?: boolean;
  approval?: boolean;
}

const plan: PlanStep[] = [
{ step: 'load_catalog', agent: 'file', note: 'Parse the attached CSV into 3,500 SKU records' },
{ step: 'search_product', agent: 'search', note: 'Rank retailer URLs per SKU, keep top 3', parallel: true },
{ step: 'extract_price', agent: 'vision', note: 'Screenshot each page, read price and stock', parallel: true },
{ step: 'validate', agent: 'planner', note: 'Re-verify any price moving more than 15%' },
{ step: 'generate_excel', agent: 'file', note: 'Build the audit workbook with source columns' },
{ step: 'approve', agent: 'human', note: 'Price overwrite is destructive — pause here', approval: true },
{ step: 'update_dashboard', agent: 'api', note: 'Write in batches of 250 with snapshot kept' }];


export function NewTask() {
  const [goal, setGoal] = useState(examples[0]);
  const [connector, setConnector] = useState(connectors[0]);
  const [workers, setWorkers] = useState(20);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [state, setState] = useState<'idle' | 'planning' | 'ready'>('ready');

  function generate() {
    setState('planning');
    window.setTimeout(() => setState('ready'), 900);
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link href="/app/tasks"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 transition-colors duration-150 ease-out hover:text-ink-900">
        
        <ArrowLeftIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        Tasks
      </Link>

      <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-ink-900">New task</h1>
      <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
        Describe the outcome in plain English. The planner turns it into an execution graph you can
        review before anything runs.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Panel title="Goal">
            <label htmlFor="goal" className="sr-only">
              Task goal
            </label>
            <textarea
              id="goal"
              rows={4}
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                setState('idle');
              }}
              className="w-full resize-none rounded-lg border border-line bg-canvas px-3.5 py-3 text-[13px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:bg-panel focus:outline-none"
              placeholder="e.g. Update all SmartStore prices from Nigerian retailers" />
            

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-ink-500">Try:</span>
              {examples.map((ex, i) =>
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setGoal(ex);
                  setState('idle');
                }}
                className="rounded border border-line bg-panel px-2 py-1 text-[11px] text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas">
                
                  Example {i + 1}
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
                
                <PaperclipIcon className="h-3.5 w-3.5" strokeWidth={2} />
                Attach input
              </button>
              <span className="font-mono text-[11px] text-ink-500">products.csv · 3,500 rows</span>
            </div>
          </Panel>

          <Panel
            title="Planned execution"
            description="Editable before dispatch. Nothing runs until you launch."
            action={
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
              
                <SparklesIcon className="h-3.5 w-3.5 text-brand-600" strokeWidth={2} />
                {state === 'ready' ? 'Re-plan' : 'Generate plan'}
              </button>
            }
            padded={false}>
            
            {state === 'planning' &&
            <div className="flex items-center gap-2.5 px-5 py-10 text-[13px] text-ink-500">
                <LoaderIcon className="h-4 w-4 animate-spin text-brand-600" strokeWidth={2.2} />
                Qwen3-14B is decomposing the goal…
              </div>
            }

            {state === 'idle' &&
            <div className="px-5 py-10 text-center">
                <p className="text-[13px] font-medium text-ink-900">No plan yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-ink-500">
                  Generate a plan to see the steps, which ones run in parallel, and where the task
                  will pause for you.
                </p>
              </div>
            }

            {state === 'ready' &&
            <motion.ol
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="divide-y divide-line">
              
                {plan.map((step, i) =>
              <motion.li
                key={step.step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: i * 0.04,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className="flex items-start gap-3.5 px-5 py-3">
                
                    <span className="tabular mt-0.5 w-4 shrink-0 font-mono text-[11px] text-ink-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[12px] font-medium text-ink-900">
                          {step.step}
                        </span>
                        <AgentTag agent={step.agent} />
                        {step.parallel &&
                    <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-[1px] text-[10px] font-medium text-brand-700">
                            parallel ×{workers}
                          </span>
                    }
                        {step.approval && approvalRequired &&
                    <span className="rounded border border-warn-100 bg-warn-50 px-1.5 py-[1px] text-[10px] font-medium text-warn-700">
                            waits for you
                          </span>
                    }
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-500">{step.note}</p>
                    </div>
                  </motion.li>
              )}
              </motion.ol>
            }
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Execution settings">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="connector"
                  className="block text-[12px] font-medium text-ink-900">
                  
                  Write target
                </label>
                <select
                  id="connector"
                  value={connector}
                  onChange={(e) => setConnector(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900 focus:border-brand-500 focus:outline-none">
                  
                  {connectors.map((c) =>
                  <option key={c} value={c}>
                      {c}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="workers" className="text-[12px] font-medium text-ink-900">
                    Browser workers
                  </label>
                  <span className="tabular text-[12px] text-ink-500">{workers}</span>
                </div>
                <input
                  id="workers"
                  type="range"
                  min={1}
                  max={40}
                  value={workers}
                  onChange={(e) => setWorkers(Number(e.target.value))}
                  className="mt-2 w-full accent-brand-600" />
                
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
                  At {workers} workers and ~8s per product, 3,500 SKUs finish in roughly{' '}
                  <span className="tabular font-medium text-ink-900">
                    {Math.round(3500 * 8 / workers / 60)} min
                  </span>
                  .
                </p>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-canvas px-3.5 py-3">
                <div>
                  <p className="text-[12px] font-medium text-ink-900">
                    Require approval before writes
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                    Destructive actions pause mid-graph and resume once approved.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={approvalRequired}
                  aria-label="Require approval before writes"
                  onClick={() => setApprovalRequired((v) => !v)}
                  className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ease-out ${
                  approvalRequired ? 'bg-brand-600' : 'bg-line-strong'}`
                  }>
                  
                  <motion.span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
                    animate={{ left: approvalRequired ? 18 : 2 }}
                    transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }} />
                  
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Models this task will use">
            <ul className="space-y-2.5 text-[12px]">
              {[
              ['Qwen3-14B', 'planning, validation, browser reasoning'],
              ['Qwen2.5-VL-7B', 'screenshot and table reading'],
              ['BGE-M3', 'retailer memory and retrieval']].
              map(([name, role]) =>
              <li key={name} className="flex items-baseline justify-between gap-3">
                  <span className="font-mono font-medium text-ink-900">{name}</span>
                  <span className="text-right text-ink-500">{role}</span>
                </li>
              )}
            </ul>
          </Panel>

          <button
            type="button"
            disabled={state !== 'ready' || goal.trim() === ''}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-500">
            
            <RocketIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            Dispatch task
          </button>
          <p className="text-center text-[11px] text-ink-500">
            Writes to {connector} · {approvalRequired ? 'approval required' : 'fully autonomous'}
          </p>
        </div>
      </div>
    </div>);

}