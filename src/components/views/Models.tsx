'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { Panel } from '@/components/Panel';
import { ProgressBar } from '@/components/ProgressBar';
import { gpuTimeline, modelServices, runtimeServices } from '@/data/models';

const statusChrome = {
  loaded: 'border-ok-100 bg-ok-50 text-ok-700',
  standby: 'border-warn-100 bg-warn-50 text-warn-700',
  unloaded: 'border-line bg-canvas text-ink-500'
} as const;

const serviceChrome: Record<string, string> = {
  healthy: 'bg-ok-600',
  busy: 'bg-warn-600',
  down: 'bg-danger-600'
};

export function Models() {
  const loadedVram = modelServices.reduce((sum, m) => sum + m.vramPct, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Runtime</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          One A40 serving the whole MVP. Models load and unload per task so the smallest capable
          model handles each step.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel
          title="VRAM allocation"
          description={`${loadedVram}% of 48 GB committed`}
          className="xl:col-span-2">
          
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-line">
            {modelServices.
            filter((m) => m.vramPct > 0).
            map((m, i) =>
            <div
              key={m.id}
              title={`${m.name} — ${m.vram}`}
              className={`flex items-center justify-center text-[10px] font-medium text-white ${
              ['bg-brand-700', 'bg-brand-500', 'bg-brand-200'][i] ?? 'bg-brand-200'} ${
              i === 2 ? 'text-brand-900' : ''}`}
              style={{ width: `${m.vramPct}%` }}>
              
                  {m.vramPct > 8 ? m.name : ''}
                </div>
            )}
            <div
              className="flex flex-1 items-center justify-center bg-canvas text-[10px] font-medium text-ink-500"
              style={{ width: `${100 - loadedVram}%` }}>
              
              {100 - loadedVram}% free
            </div>
          </div>

          <div className="mt-6 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gpuTimeline} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="fillVram" x1="0" y1="0" x2="0" y2="1">
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
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#e4e8ef"
                  tickLine={false}
                  axisLine={false} />
                
                <Tooltip
                  contentStyle={{
                    border: '1px solid #e4e8ef',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                  labelStyle={{ color: '#0b1220', fontWeight: 600 }} />
                
                <Area
                  type="monotone"
                  dataKey="vram"
                  name="VRAM used"
                  stroke="#2456d8"
                  strokeWidth={2}
                  fill="url(#fillVram)" />
                
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Services" padded={false}>
          <ul className="divide-y divide-line">
            {runtimeServices.map((s) =>
            <li key={s.name} className="flex items-start gap-3 px-5 py-3.5">
                <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${serviceChrome[s.status]}`}
                aria-hidden="true" />
              
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900">{s.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink-500">{s.detail}</p>
                </div>
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modelServices.map((m) =>
        <article
          key={m.id}
          className={`rounded-xl border bg-panel p-5 shadow-panel ${
          m.status === 'loaded' ? 'border-line' : 'border-dashed border-line-strong'}`
          }>
          
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-mono text-[13px] font-semibold text-ink-900">{m.name}</h2>
                <p className="mt-1 text-[12px] leading-snug text-ink-500">{m.role}</p>
              </div>
              <span
              className={`shrink-0 rounded border px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-wide ${statusChrome[m.status]}`}>
              
                {m.status}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-ink-500">VRAM</p>
                <p className="tabular text-[11px] font-medium text-ink-900">{m.vram}</p>
              </div>
              <div className="mt-1.5">
                <ProgressBar
                value={m.vramPct}
                size="sm"
                tone={m.status === 'loaded' ? 'brand' : 'neutral'}
                label={`${m.name} VRAM`} />
              
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3.5">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink-400">GPU</dt>
                <dd className="mt-0.5 text-[11px] text-ink-700">{m.gpu}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink-400">Latency</dt>
                <dd className="tabular mt-0.5 text-[11px] text-ink-700">{m.latency}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink-400">Queue</dt>
                <dd className="tabular mt-0.5 text-[11px] text-ink-700">{m.queue}</dd>
              </div>
            </dl>

            <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-ink-400">
              Rollout phase {m.phase}
            </p>
          </article>
        )}
      </div>
    </div>);

}