'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRightIcon, FlaskConicalIcon, PlayIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';
import { ApiError, simApi, type SimHealth, type SimRun } from '@/lib/api';
import { newRunId } from '../core/rng';
import { runScenario } from '../core/runner';
import type { Cost, Outcome, Scenario, ScenarioResult } from '../core/types';
import { GROUPS, SCENARIOS } from '../scenarios';
import { ResultPanel } from './ResultPanel';
import { ADVERSARIAL } from '../adversarial';

const OUTCOME: Record<Outcome | 'RUNNING', string> = {
  PASS: 'border-ok-100 bg-ok-50 text-ok-700',
  FAIL: 'border-danger-100 bg-danger-50 text-danger-700',
  ERROR: 'border-danger-100 bg-danger-50 text-danger-700',
  WARN: 'border-warn-100 bg-warn-50 text-warn-700',
  SKIPPED: 'border-line bg-canvas text-ink-500',
  RUNNING: 'border-brand-200 bg-brand-50 text-brand-700',
};
const COST: Record<Cost, { label: string; cls: string }> = {
  free: { label: 'No AI', cls: 'text-ink-500' },
  ai: { label: 'Uses AI', cls: 'text-brand-700' },
  slow: { label: 'Slow', cls: 'text-warn-700' },
};

const btn = 'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium disabled:cursor-default disabled:opacity-50';

/**
 * The admin Simulator (docs/DUTYCAPTAIN_UI_SIMULATION.md): every feature, one
 * click each, run for real with generated content. What a run creates is
 * tagged with its run id and purged with it.
 */
export function SimulatorPage() {
  const [health, setHealth] = useState<SimHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [runId, setRunId] = useState(() => newRunId());
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [live, setLive] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [summary, setSummary] = useState<SimRun | null>(null);
  const [runs, setRuns] = useState<SimRun[]>([]);
  const [busy, setBusy] = useState(false);
  // Sections start collapsed; which ones are open is remembered in this browser.
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('sim.openGroups') || '[]'); } catch { return []; }
  });
  const toggleGroup = (group: string) => setOpenGroups((prev) => {
    const next = prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group];
    try { localStorage.setItem('sim.openGroups', JSON.stringify(next)); } catch { /* private window: not remembered */ }
    return next;
  });

  const loadRuns = useCallback(() => simApi.runs().then(setRuns).catch(() => setRuns([])), []);
  useEffect(() => {
    simApi.health().then(setHealth).catch((err) => setHealthError(err instanceof ApiError ? err.message : 'The simulator is not available on this server.'));
    loadRuns();
  }, [loadRuns]);

  const refreshSummary = useCallback(() => simApi.run(runId).then(setSummary).catch(() => setSummary(null)), [runId]);

  async function run(scenario: Scenario) {
    if (!health) return;
    setRunning(scenario.id);
    setLive([]);
    setOpen(scenario.id);
    const result = await runScenario(scenario, { runId, seed, health }, (line) => setLive((l) => [...l, line]));
    setResults((r) => ({ ...r, [scenario.id]: result }));
    setRunning(null);
    refreshSummary();
  }

  async function runAll() {
    for (const s of SCENARIOS) {
      // eslint-disable-next-line no-await-in-loop
      await run(s);
    }
    loadRuns();
  }

  async function purge(id: string) {
    if (!window.confirm(`Delete everything simulation ${id} created — its tasks, endpoints and receiver records?`)) return;
    setBusy(true);
    try {
      await simApi.purge(id);
      if (id === runId) {
        setSummary(null);
        setResults({});
        setRunId(newRunId());
      }
      loadRuns();
    } finally {
      setBusy(false);
    }
  }

  const tally = Object.values(results).reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.outcome]: (acc[r.outcome] || 0) + 1 }), {});

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold tracking-tight text-ink-900">
          <FlaskConicalIcon className="h-5 w-5 text-brand-600" strokeWidth={2.2} /> Simulator
        </h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Every feature, one click each. A sim runs the real feature — the same requests the screens make, the real AI, queue and
          sends — with generated content, and checks what happened. What it creates is tagged with the run and deleted with it.
        </p>
      </header>

      {/* Environment */}
      <section className="rounded-xl border border-line bg-panel px-5 py-3.5 text-[12px] shadow-panel">
        {healthError ? <p className="text-danger-700">{healthError}</p> : !health ? <p className="text-ink-500">Checking the server…</p> :
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-ink-700">
            <span>Simulations: <b className={health.enabled ? 'text-ok-700' : 'text-danger-700'}>{health.enabled ? 'on' : 'off'}</b></span>
            <span>Tasks run: <b className={health.queue === 'bullmq' ? 'text-ok-700' : 'text-warn-700'}>{health.queue === 'bullmq' ? 'on the queue' : 'in-process'}</b></span>
            <span>AI: <b>{health.ai?.provider || '—'}{health.ai?.model ? ` · ${health.ai.model}` : ''}</b> <span className="text-ink-400">(sims spend real tokens, capped at $0.05 a task)</span></span>
            <span className="break-all">Receiver: <span className="font-mono">{health.self_url}/sim/receiver</span></span>
          </div>
        }
      </section>

      {/* Run controls */}
      <section className="rounded-xl border border-line bg-panel px-5 py-4 shadow-panel">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] font-medium text-ink-700">
            Run
            <span className="mt-1 flex items-center gap-1.5">
              <span className="rounded-md border border-line bg-canvas px-2.5 py-1.5 font-mono text-[12px] text-ink-900">{runId}</span>
              <button type="button" onClick={() => { setRunId(newRunId()); setResults({}); setSummary(null); }} disabled={!!running} className={`${btn} border border-line text-ink-700 hover:bg-canvas`} title="Start a new run">
                <RefreshCwIcon className="h-3.5 w-3.5" /> New
              </button>
            </span>
          </label>
          <label className="text-[12px] font-medium text-ink-700">
            Seed
            <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} disabled={!!running}
            className="mt-1 block w-32 rounded-md border border-line bg-panel px-2.5 py-1.5 font-mono text-[12px] text-ink-900 focus:border-brand-500 focus:outline-none" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={runAll} disabled={!health?.enabled || !!running} className={`${btn} bg-brand-600 text-white hover:bg-brand-500`}>
              <PlayIcon className="h-3.5 w-3.5" /> Run all ({SCENARIOS.length})
            </button>
            <button type="button" onClick={refreshSummary} disabled={!!running} className={`${btn} border border-line text-ink-700 hover:bg-canvas`}>Run summary</button>
            <button type="button" onClick={() => purge(runId)} disabled={!!running || busy} className={`${btn} border border-danger-100 text-danger-700 hover:bg-danger-50`}>
              <Trash2Icon className="h-3.5 w-3.5" /> Purge run
            </button>
          </div>
        </div>
        {(summary?.counts || Object.keys(tally).length > 0) &&
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-700">
            {Object.entries(tally).map(([k, n]) => <span key={k}><b>{n}</b> {k.toLowerCase()}</span>)}
            {summary?.counts &&
          <>
                <span className="text-ink-400">·</span>
                <span><b>{summary.counts.tasks}</b> tasks</span>
                <span><b>{summary.counts.endpoints}</b> endpoints</span>
                <span><b>{summary.counts.deliveries}</b> deliveries</span>
                <span><b>{summary.counts.receiver_hits}</b> receiver requests</span>
                <span>spent <b>${summary.counts.spent_usd.toFixed(4)}</b> (estimate)</span>
              </>
          }
          </div>
        }
      </section>

      {/* Scenarios, by phase */}
      {GROUPS.map((group) => {
        const inGroup = SCENARIOS.filter((s) => s.group === group);
        const expanded = openGroups.includes(group);
        const done = inGroup.map((s) => results[s.id]?.outcome).filter(Boolean) as Outcome[];
        const counts = done.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o]: (acc[o] || 0) + 1 }), {});
        const runningHere = inGroup.find((s) => s.id === running);
        return (
      <section key={group}>
          {/* Collapsed until pressed: the header says what's inside and how it went. */}
          <button type="button" onClick={() => toggleGroup(group)} aria-expanded={expanded}
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-canvas">
            <ChevronRightIcon className={`h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} strokeWidth={2.4} />
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">{group}</span>
            <span className="text-[12px] text-ink-400">{inGroup.length}</span>
            <span className="ml-auto flex flex-wrap items-center gap-1.5">
              {runningHere && <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${OUTCOME.RUNNING}`}>Running: {runningHere.title}</span>}
              {(Object.keys(counts) as Outcome[]).map((o) =>
                <span key={o} className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${OUTCOME[o]}`}>{counts[o]} {o.toLowerCase()}</span>
              )}
            </span>
          </button>
          {expanded &&
          <ul className="mt-2 space-y-2">
            {inGroup.map((s) => {
            const r = results[s.id];
            const isRunning = running === s.id;
            const state = isRunning ? 'RUNNING' : r?.outcome;
            return (
              <li key={s.id} className="rounded-xl border border-line bg-panel px-4 py-3 shadow-panel">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink-900">{s.title}</p>
                      <p className="mt-0.5 text-[12px] text-ink-500">{s.summary}</p>
                      <p className="mt-1 flex flex-wrap gap-x-3 text-[11px]">
                        <span className="break-all font-mono text-ink-400">{s.exercises}</span>
                        {s.cost.map((c) => <span key={c} className={COST[c].cls}>{COST[c].label}</span>)}
                        <span className="text-ink-400">{s.estimate}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {state &&
                    <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${OUTCOME[state]}`}>
                          {state === 'RUNNING' ? 'Running…' : state}{r && !isRunning ? ` · ${(r.durationMs / 1000).toFixed(1)}s` : ''}
                        </button>
                    }
                      <button type="button" onClick={() => run(s)} disabled={!health?.enabled || !!running} className={`${btn} border border-line text-ink-900 hover:bg-canvas`}>
                        <PlayIcon className="h-3.5 w-3.5" /> Run
                      </button>
                    </div>
                  </div>
                  {isRunning &&
                <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-canvas p-2.5 font-mono text-[11px] leading-relaxed text-ink-700">{live.join('\n') || 'starting…'}</pre>
                }
                  {!isRunning && r && open === s.id && <ResultPanel result={r} />}
                </li>);

          })}
          </ul>
          }
        </section>);
      })}

      {/* Adversarial coverage: which ways things go wrong are proved, and by what. */}
      <section>
        <button type="button" onClick={() => toggleGroup('__adversarial')} aria-expanded={openGroups.includes('__adversarial')}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-canvas">
          <ChevronRightIcon className={`h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform duration-150 ${openGroups.includes('__adversarial') ? 'rotate-90' : ''}`} strokeWidth={2.4} />
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Adversarial coverage</span>
          <span className="text-[12px] text-ink-400">
            {ADVERSARIAL.filter((v) => v.coveredBy.length && !v.planned).length} of {ADVERSARIAL.length} fully covered
          </span>
        </button>
        {openGroups.includes('__adversarial') &&
        <div className="mt-2 overflow-x-auto rounded-xl border border-line bg-panel shadow-panel">
            <table className="w-full text-[12px]">
              <thead className="bg-canvas text-left text-ink-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Correct behaviour</th>
                  <th className="px-3 py-2 font-semibold">Proved by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ADVERSARIAL.map((v) =>
              <tr key={v.id} className="align-top">
                    <td className="px-3 py-2">
                      <p className="font-medium text-ink-900">{v.variant}</p>
                      <p className="text-ink-500">{v.example}</p>
                    </td>
                    <td className="px-3 py-2 text-ink-700">{v.correct}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {v.coveredBy.map((id) => {
                      const r = results[id];
                      return (
                        <span key={id} title={r ? `${r.outcome} in this run` : 'not run yet in this run'}
                        className={`rounded border px-1.5 py-[1px] font-mono text-[10px] ${r ? OUTCOME[r.outcome] : 'border-line bg-canvas text-ink-500'}`}>{id}</span>);

                    })}
                      </div>
                      {v.planned && <p className="mt-1 text-[11px] text-ink-400">{v.planned}</p>}
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </section>

      {/* Earlier runs */}
      {runs.length > 0 &&
      <section>
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-500">Your runs</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-panel shadow-panel">
            {runs.map((r) =>
          <li key={r.run_id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[12px]">
                <span className="font-mono text-ink-900">{r.run_id}</span>
                <span className="text-ink-500">{new Date(r.created_at).toLocaleString()}</span>
                <span className="flex-1 text-ink-700">
                  {r.purged_at ? `purged — ${Object.entries(r.purged || {}).map(([k, n]) => `${n} ${k.replace('_', ' ')}`).join(', ')}` :
              r.counts ? `${r.counts.tasks} tasks · ${r.counts.endpoints} endpoints · $${r.counts.spent_usd.toFixed(4)}` : ''}
                </span>
                {!r.purged_at &&
            <button type="button" onClick={() => purge(r.run_id)} disabled={busy || !!running} className={`${btn} text-danger-700 hover:bg-danger-50`}>
                    <Trash2Icon className="h-3.5 w-3.5" /> Purge
                  </button>
            }
              </li>
          )}
          </ul>
        </section>
      }
    </div>);

}
