'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2Icon, CircleDashedIcon, AlertTriangleIcon, XCircleIcon, XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, endpointsApi, peopleApi } from '@/lib/api';
import type { Endpoint, Person, Pool, PoolTest } from '@/lib/types';

/**
 * Who a task may ask besides you (phase 6). A colleague gets an email with a
 * private link to answer — no account needed. A pool is a group in a partner's
 * app (NaijaReels scouts): its endpoint receives each request and posts every
 * answer back, saying who gave it.
 */
export function PeoplePanel() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [poolName, setPoolName] = useState('');
  const [poolEndpoint, setPoolEndpoint] = useState('');
  const [closeEndpoint, setCloseEndpoint] = useState('');
  const [refPath, setRefPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => peopleApi.list().then((d) => { setPeople(d.people); setPools(d.pools); }).catch(() => setError('Could not load your people.'));
  useEffect(() => {
    load();
    endpointsApi.list().then(setEndpoints).catch(() => {});
  }, []);

  async function act(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      after?.();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="People a task may ask" description="Colleagues answer by a private link; a pool is reached through a partner's app.">
      {error && <p role="alert" className="mb-3 text-[12px] text-danger-700">{error}</p>}
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Colleagues</h3>
      <ul className="mt-2 divide-y divide-line rounded-md border border-line">
        {(people || []).map((p) =>
        <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
            <span className="text-ink-900">{p.name} <span className="text-ink-500">· {p.email}</span></span>
            <button type="button" disabled={busy} onClick={() => act(() => peopleApi.remove(p.id))} aria-label={`Remove ${p.name}`}
          className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900 disabled:opacity-60"><XIcon className="h-3.5 w-3.5" /></button>
          </li>
        )}
        {people && people.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-500">Nobody yet — tasks ask only you.</li>}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); act(() => peopleApi.add({ name, email }), () => { setName(''); setEmail(''); }); }}
        className="mt-2 flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Their name"
          className="w-[160px] rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] text-ink-900" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" aria-label="Their email"
          className="w-[220px] rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] text-ink-900" />
        <button type="submit" disabled={busy || !name.trim() || !email.trim()} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Add</button>
      </form>

      <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-500">Pools</h3>
      <ul className="mt-2 divide-y divide-line rounded-md border border-line">
        {pools.map((p) =>
        <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
            <div className="min-w-0 flex-1">
              <span className="text-ink-900">{p.name} <span className="text-ink-500">· requests go to {p.endpoint_name || 'a removed endpoint'}{p.close_endpoint_name ? ` · closed through ${p.close_endpoint_name}` : ''}{p.ref_path ? ` · their id at ${p.ref_path}` : ''}</span></span>
              <PoolTestPanel poolId={p.id} />
            </div>
            <button type="button" disabled={busy} onClick={() => act(() => peopleApi.removePool(p.id))} aria-label={`Remove ${p.name}`}
          className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900 disabled:opacity-60"><XIcon className="h-3.5 w-3.5" /></button>
          </li>
        )}
        {pools.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-500">None.</li>}
      </ul>
      <form onSubmit={(e) => {
        e.preventDefault();
        act(() => peopleApi.addPool({ name: poolName, endpoint: poolEndpoint, ...(closeEndpoint ? { close_endpoint: closeEndpoint } : {}), ...(refPath.trim() ? { ref_path: refPath.trim() } : {}) }),
          () => { setPoolName(''); setCloseEndpoint(''); setRefPath(''); });
      }}
        className="mt-2 flex flex-wrap items-center gap-2">
        <input value={poolName} onChange={(e) => setPoolName(e.target.value)} placeholder="NaijaReels scouts" aria-label="Pool name"
          className="w-[180px] rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] text-ink-900" />
        <select value={poolEndpoint} onChange={(e) => setPoolEndpoint(e.target.value)} aria-label="The partner endpoint its requests go to"
          className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-900">
          <option value="">Partner endpoint…</option>
          {endpoints.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
        </select>
        <select value={closeEndpoint} onChange={(e) => setCloseEndpoint(e.target.value)} aria-label="Their close call (optional)"
          className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-900">
          <option value="">No close call</option>
          {endpoints.map((ep) => <option key={ep.id} value={ep.id}>Close via {ep.name}</option>)}
        </select>
        <input value={refPath} onChange={(e) => setRefPath(e.target.value)} placeholder="their id at, e.g. data.id" aria-label="Where their id is in their reply (optional)"
          className="w-[170px] rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[12px] text-ink-900" />
        <button type="submit" disabled={busy || !poolName.trim() || !poolEndpoint} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Add pool</button>
      </form>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
        Their API decides the shape: the endpoint&apos;s body template maps each request into it (put <code className="font-mono">{'{{reply.url}}'}</code> where their app should send answers).
        A close call is sent only if you choose one — its URL may use <code className="font-mono">{'{{partner_ref}}'}</code>, read from their reply where you say.
      </p>
    </Panel>);

}

const ICON = {
  pending: <CircleDashedIcon className="h-3.5 w-3.5 text-ink-400" />,
  pass: <CheckCircle2Icon className="h-3.5 w-3.5 text-ok-700" />,
  warn: <AlertTriangleIcon className="h-3.5 w-3.5 text-warn-700" />,
  fail: <XCircleIcon className="h-3.5 w-3.5 text-danger-700" />,
};

/**
 * Test the pool's integration before a task relies on it: a sample request
 * goes to its app through the real path, and each step of the handshake is
 * checked. The answer waits for a person in that app (up to 30 minutes).
 */
function PoolTestPanel({ poolId }: {poolId: string;}) {
  const [test, setTest] = useState<PoolTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { peopleApi.poolTest(poolId).then(setTest).catch(() => {}); }, [poolId]);
  useEffect(() => {
    if (!test || test.status !== 'running') return undefined;
    const t = setInterval(() => { peopleApi.poolTest(poolId).then(setTest).catch(() => {}); }, 3000);
    return () => clearInterval(t);
  }, [test, poolId]);

  async function run() {
    setError(null);
    try { setTest(await peopleApi.testPool(poolId)); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not start the test.'); }
  }

  return (
    <div className="mt-1 text-[12px]">
      <button type="button" disabled={test?.status === 'running'} onClick={run} className="cursor-pointer font-medium text-brand-700 hover:text-brand-500 disabled:opacity-60">
        {test?.status === 'running' ? 'Testing — answer the test request in their app…' : test ? 'Test again' : 'Test this pool'}
      </button>
      {test && test.status !== 'running' && <span className={`ml-2 font-medium ${test.status === 'passed' ? 'text-ok-700' : 'text-danger-700'}`}>{test.status === 'passed' ? 'Passed' : 'Failed'}</span>}
      {error && <p role="alert" className="text-danger-700">{error}</p>}
      {test &&
      <ul className="mt-1.5 space-y-1">
          {test.checks.map((c) =>
        <li key={c.key} className="flex items-start gap-1.5">
              <span className="mt-0.5">{ICON[c.status]}</span>
              <span><span className="text-ink-800">{c.title}</span>{c.detail && <span className="text-ink-500"> — {c.detail}</span>}</span>
            </li>
        )}
        </ul>
      }
      {test && test.exchanges.map((x, i) =>
      <details key={i} className="mt-1.5 rounded-md border border-line bg-canvas px-2 py-1">
          <summary className="cursor-pointer text-ink-700">{x.what === 'close' ? 'Their close call' : 'The request'}: {x.request ? `${x.request.method} ${x.request.url}` : x.error} {x.response ? `→ ${x.response.status}` : ''}</summary>
          {x.request &&
        <>
              <p className="mt-1 text-ink-500">Sent (headers: {x.request.headers.join(', ') || 'none'})</p>
              <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-panel p-2 font-mono text-[11px] text-ink-800">{JSON.stringify(x.request.body, null, 2)}</pre>
            </>
        }
          {x.response &&
        <>
              <p className="mt-1 text-ink-500">Their reply</p>
              <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-panel p-2 font-mono text-[11px] text-ink-800">{typeof x.response.body === 'string' ? x.response.body : JSON.stringify(x.response.body, null, 2)}</pre>
            </>
        }
        </details>
      )}
    </div>);

}
