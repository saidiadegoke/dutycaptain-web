import { simScope, type SimExchange, type SimHealth } from '@/lib/api';
import { createRng, hashString, newToken } from './rng';
import { outcomeOf } from './checks';
import type { Check, RunContext, Scenario, ScenarioResult, SimLink } from './types';

export interface Session {
  runId: string;
  seed: number;
  health: SimHealth;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run one scenario for real. Every request it makes — through the same API
 * functions the screens use — carries the run id, so the API tags what it
 * creates; each exchange is recorded for the result.
 */
export async function runScenario(scenario: Scenario, session: Session, onLog?: (line: string) => void): Promise<ScenarioResult> {
  const rng = createRng(session.seed ^ hashString(scenario.id));
  const token = newToken(rng);
  const log: string[] = [];
  const links: SimLink[] = [];
  const exchanges: SimExchange[] = [];
  const started = Date.now();
  const say = (line: string) => {
    const stamped = `${((Date.now() - started) / 1000).toFixed(1)}s  ${line}`;
    log.push(stamped);
    onLog?.(stamped);
  };

  const ctx: RunContext = {
    runId: session.runId,
    seed: session.seed,
    token,
    rng,
    health: session.health,
    serverTime: new Date(session.health.server_time),
    log: say,
    link: (label, href) => links.push({ label, href }),
    async poll(label, read, until, { timeoutMs = 180_000, everyMs = 1500 } = {}) {
      say(`waiting: ${label}`);
      const deadline = Date.now() + timeoutMs;
      let last: Awaited<ReturnType<typeof read>>;
      for (;;) {
        last = await read();
        if (until(last)) return last;
        if (Date.now() > deadline) throw new Error(`timed out after ${Math.round(timeoutMs / 1000)}s waiting for ${label}`);
        await sleep(everyMs);
      }
    },
    receiverUrl(name, script, { honours = false } = {}) {
      return `${session.health.self_url}/sim/receiver/${session.runId}/${encodeURIComponent(name)}/${script.join(',')}${honours ? '?honours=1' : ''}`;
    },
  };

  const finish = (outcome: ScenarioResult['outcome'], checks: Check[], error?: string): ScenarioResult => ({
    scenarioId: scenario.id, title: scenario.title, outcome, token, checks, exchanges, log, links,
    startedAt: new Date(started).toISOString(), durationMs: Date.now() - started, ...(error ? { error } : {}),
  });

  const why = scenario.skipIf?.(ctx);
  if (why) return finish('SKIPPED', [{ name: 'Skipped', status: 'skip', note: why }]);

  simScope.runId = session.runId;
  simScope.record = (e) => exchanges.push(e);
  try {
    say(`start (${token})`);
    const checks = await scenario.run(ctx);
    say(`done: ${outcomeOf(checks)}`);
    return finish(outcomeOf(checks), checks);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    say(`error: ${message}`);
    return finish('ERROR', [], message);
  } finally {
    simScope.runId = null;
    simScope.record = null;
  }
}
