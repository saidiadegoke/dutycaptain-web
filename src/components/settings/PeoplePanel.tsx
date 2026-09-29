'use client';

import { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, endpointsApi, peopleApi } from '@/lib/api';
import type { Endpoint, Person, Pool } from '@/lib/types';

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
            <span className="text-ink-900">{p.name} <span className="text-ink-500">· requests go to {p.endpoint_name || 'a removed endpoint'}</span></span>
            <button type="button" disabled={busy} onClick={() => act(() => peopleApi.removePool(p.id))} aria-label={`Remove ${p.name}`}
          className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900 disabled:opacity-60"><XIcon className="h-3.5 w-3.5" /></button>
          </li>
        )}
        {pools.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-500">None.</li>}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); act(() => peopleApi.addPool({ name: poolName, endpoint: poolEndpoint }), () => setPoolName('')); }}
        className="mt-2 flex flex-wrap items-center gap-2">
        <input value={poolName} onChange={(e) => setPoolName(e.target.value)} placeholder="NaijaReels scouts" aria-label="Pool name"
          className="w-[180px] rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] text-ink-900" />
        <select value={poolEndpoint} onChange={(e) => setPoolEndpoint(e.target.value)} aria-label="The partner endpoint its requests go to"
          className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-900">
          <option value="">Partner endpoint…</option>
          {endpoints.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
        </select>
        <button type="submit" disabled={busy || !poolName.trim() || !poolEndpoint} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Add pool</button>
      </form>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
        The endpoint receives a <code className="font-mono">dutycaptain.request</code> with a reply link; the partner posts each answer to it with <code className="font-mono">answered_by</code>.
      </p>
    </Panel>);

}
