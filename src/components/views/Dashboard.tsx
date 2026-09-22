'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { ArrowRightIcon, ChevronRightIcon, FileSpreadsheetIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ProgressBar } from '@/components/ProgressBar';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { WorkerFleet } from '@/components/WorkerFleet';
import { tasksApi } from '@/lib/api';
import type { Task } from '@/lib/types';
import { isActive } from '@/lib/types';
import { throughput, workers } from '@/data/workflow';
import { approvals } from '@/data/approvals';
import { modelServices } from '@/data/models';
import { artifacts } from '@/data/artifacts';
import { count, pct } from '@/utils/format';

type Row = Task & {steps?: {total: number;done: number;failed: number;};};

/**
 * The hero card is the one part of this page that is about a real task, so it
 * reads a real one (P1-15). The panels below it — approvals, model fleet,
 * artifacts — are still fixtures, because the features behind them arrive in
 * Phases 3 to 6. Half-real is uncomfortable, but the alternative is a home
 * screen that shows a task nobody started.
 */
export function Dashboard() {
  const [active, setActive] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = modelServices.filter((m) => m.status === 'loaded');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await tasksApi.list({ limit: 20 });
        if (!alive) return;
        const rows = res.data as Row[];
        // The newest task still working, else simply the newest.
        setActive(rows.find((t) => isActive(t.status)) ?? rows[0] ?? null);
      } catch {
        // The dashboard is glanceable, not operational — a failed fetch shows
        // the empty state rather than an error anyone has to dismiss.
        if (alive) setActive(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const steps = active?.steps ?? { total: 0, done: 0, failed: 0 };
  const progress = pct(steps.done, steps.total);

  const metrics = [
  { label: 'Steps', value: steps.total ? `${count(steps.done)} / ${count(steps.total)}` : '—' },
  { label: 'Failed steps', value: steps.failed ? String(steps.failed) : '0' },
  { label: 'Status', value: active ? active.status.replace(/_/g, ' ') : '—' },
  { label: 'Started', value: active?.started_at ? new Date(active.started_at).toLocaleTimeString() : '—' }];

  if (!loading && !active) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Operations overview</h1>
        <div className="mt-5 rounded-xl border border-line bg-panel px-6 py-16 text-center shadow-panel">
          <p className="text-[13px] font-medium text-ink-900">Nothing running yet</p>
          <p className="mt-1 text-[12px] text-ink-500">
            Start a task and this is where its progress appears.
          </p>
          <Link href="/app/tasks/new"
            className="mt-4 inline-flex rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500">
            
            New task
          </Link>
        </div>
      </div>);

  }


  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
            Operations overview
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            The most recent task, and what the runtime is doing with it.
          </p>
        </div>
        <Link href="/app/tasks"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
          
          All tasks
          <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-line bg-panel shadow-panel lg:col-span-2">
          <header className="border-b border-line px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <TaskStatusBadge status={active!.status} />
                  <span className="font-mono text-[11px] text-ink-400">{active!.id}</span>
                </div>
                <h2 className="mt-2 max-w-2xl text-[17px] font-semibold leading-snug tracking-tight text-ink-900">
                  “{active!.objective}”
                </h2>
              </div>
              <Link href={`/app/tasks/${active!.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-ink-800">
                
                Open task
                <ChevronRightIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <p className="tabular text-[28px] font-semibold leading-none tracking-tight text-ink-900">
                  {progress}%
                </p>
                <p className="text-[12px] text-ink-500">
                  {steps.total ? `${steps.done} of ${steps.total} steps` : 'no steps yet'}
                </p>
              </div>
              <div className="mt-2.5">
                <ProgressBar value={progress} label="Task progress" />
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {metrics.map((m) =>
              <div key={m.label}>
                  <dt className="text-[11px] text-ink-500">{m.label}</dt>
                  <dd className="tabular mt-1 text-[14px] font-semibold text-ink-900">
                    {m.value}
                  </dd>
                </div>
              )}
            </dl>
          </header>

          <div className="px-6 py-5">
            <h3 className="text-[12px] font-semibold text-ink-700">
              Products completed over time
            </h3>
            <div className="mt-3 h-[168px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughput} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="fillProducts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2456d8" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#2456d8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e4e8ef" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#e4e8ef"
                    tickLine={false} />
                  
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#e4e8ef"
                    tickLine={false}
                    axisLine={false} />
                  
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #e4e8ef',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 8px 24px rgba(11,18,32,0.1)'
                    }}
                    labelStyle={{ color: '#0b1220', fontWeight: 600 }} />
                  
                  <Area
                    type="monotone"
                    dataKey="products"
                    stroke="#2456d8"
                    strokeWidth={2}
                    fill="url(#fillProducts)"
                    name="Products" />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-ink-700">Browser worker fleet</h3>
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-400">
                  Playwright · CPU containers
                </span>
              </div>
              <div className="mt-3">
                <WorkerFleet workers={workers} />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <Panel
            title="Needs your decision"
            description="Destructive actions pause until approved."
            padded={false}
            action={
            <Link href="/app/approvals"
              className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
              
                Review all
              </Link>
            }>
            
            <ul className="divide-y divide-line">
              {approvals.map((a, i) =>
              <li key={a.id}>
                  <Link href="/app/approvals"
                  className="block px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-canvas">
                  
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                        className={`truncate font-semibold tracking-tight text-ink-900 ${
                        i === 0 ? 'text-[14px]' : 'text-[13px]'}`
                        }>
                        
                          {a.action}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-ink-500">{a.target}</p>
                      </div>
                      <span
                      className={`shrink-0 rounded border px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-wide ${
                      a.risk === 'high' ?
                      'border-danger-100 bg-danger-50 text-danger-700' :
                      a.risk === 'medium' ?
                      'border-warn-100 bg-warn-50 text-warn-700' :
                      'border-line bg-canvas text-ink-500'}`
                      }>
                      
                        {a.risk}
                      </span>
                    </div>
                    {i === 0 &&
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-700">
                        {a.summary}
                      </p>
                  }
                    <p className="mt-1.5 font-mono text-[10px] text-ink-400">
                      {a.requestedAt}
                    </p>
                  </Link>
                </li>
              )}
            </ul>
          </Panel>

          <Panel
            title="Runtime"
            description={`${loaded.length} models loaded on one A40`}
            action={
            <Link href="/app/models"
              className="text-[12px] font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-500">
              
                Details
              </Link>
            }>
            
            <ul className="space-y-3.5">
              {loaded.map((m) =>
              <li key={m.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-mono text-[12px] font-medium text-ink-900">{m.name}</p>
                    <p className="tabular text-[11px] text-ink-500">{m.vram}</p>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar
                    value={m.vramPct}
                    size="sm"
                    tone={m.vramPct > 40 ? 'warn' : 'brand'}
                    label={`${m.name} VRAM`} />
                  
                  </div>
                  <p className="mt-1 text-[11px] text-ink-500">
                    {m.latency} · {m.queue} queued
                  </p>
                </li>
              )}
            </ul>
          </Panel>

          <Panel title="Latest artifacts" padded={false}>
            <ul className="divide-y divide-line">
              {artifacts.slice(0, 3).map((a) =>
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <FileSpreadsheetIcon
                  className="h-4 w-4 shrink-0 text-ink-400"
                  strokeWidth={1.9} />
                
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12px] text-ink-900">{a.name}</p>
                    <p className="text-[11px] text-ink-500">
                      {a.createdAt} · {a.size}
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>);

}