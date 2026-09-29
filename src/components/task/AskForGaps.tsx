'use client';

import { useEffect, useState } from 'react';
import { UsersIcon } from 'lucide-react';
import { ApiError, peopleApi, tasksApi } from '@/lib/api';
import type { GapRoute, Person, Pool } from '@/lib/types';

/**
 * A task that finished partial can still ask for what it could not get
 * (phase 6): only the missing, unclear or disputed values, pre-filled, to you,
 * a colleague or a pool. The answers complete the result — measured again by
 * code — and, if the partial result was delivered, the completed one follows.
 */
export function AskForGaps({ taskId, onAsked }: {taskId: string;onAsked: () => void;}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [to, setTo] = useState('owner');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { peopleApi.list().then((d) => { setPeople(d.people); setPools(d.pools); }).catch(() => {}); }, []);

  async function ask() {
    const route: GapRoute = to === 'owner' ? { to: 'owner' } : to.startsWith('person:') ? { to: 'people', people: [to.slice(7)] } : { to: 'pool', pool: to.slice(5) };
    setBusy(true);
    setError(null);
    try {
      await tasksApi.askForGaps(taskId, route);
      onAsked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not ask.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-[13px]">
      <UsersIcon className="h-4 w-4 text-ink-500" />
      <span className="text-ink-800">Some of it could not be found or read clearly.</span>
      <label className="inline-flex items-center gap-2 text-ink-700">
        Ask
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Who to ask" className="cursor-pointer rounded-md border border-line bg-panel px-2 py-1 text-[12px] text-ink-900">
          <option value="owner">me</option>
          {people.map((p) => <option key={p.id} value={`person:${p.id}`}>{p.name}</option>)}
          {pools.map((p) => <option key={p.id} value={`pool:${p.id}`}>the {p.name} pool</option>)}
        </select>
        for only what is missing
      </label>
      <button type="button" disabled={busy} onClick={ask} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
        {busy ? 'Asking…' : 'Ask'}
      </button>
      {error && <p role="alert" className="w-full text-[12px] text-danger-700">{error}</p>}
    </section>);

}
