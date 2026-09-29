'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel } from '@/components/Panel';
import { ApiError, runtimeApi } from '@/lib/api';
import { checked } from '@/lib/types';
import type { RuntimeProvider, RuntimeStatus, TaskStatus } from '@/lib/types';

const REFRESH_MS = 15000;

const dot: Record<string, string> = {
  ready: 'bg-ok-600',
  up: 'bg-ok-600',
  benched: 'bg-warn-600',
  'not set up': 'bg-ink-400',
  down: 'bg-danger-600',
};

const KIND_LABEL: Record<string, string> = { paid: 'platform credit', free: 'free', you: 'your time' };

/** The runtime's state, kept fresh while the page is open. */
export function useRuntimeStatus() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const s = await runtimeApi.status();
        if (alive) { setStatus(s); setError(null); }
      } catch (err) {
        if (alive) setError(err instanceof ApiError ? err.message : 'Could not check the runtime.');
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  return { status, error };
}

function Dot({ state }: { state: string }) {
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[state] || 'bg-ink-400'}`} aria-hidden="true" />;
}

function ProviderList({ providers, empty }: { providers: RuntimeProvider[]; empty: string }) {
  if (!providers.length) return <p className="px-5 py-4 text-[12px] text-ink-500">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {providers.map((p) =>
      <li key={p.name} className="flex items-start gap-3 px-5 py-3.5">
          <Dot state={p.state} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] font-medium text-ink-900">
                <span className="mr-1.5 font-mono text-[11px] text-ink-400">{p.order}.</span>{p.label}
              </p>
              <p className="text-[11px] text-ink-500">
                {p.state === 'benched' ? 'sitting out' : p.state}
                {p.kind ? ` · ${KIND_LABEL[p.kind] || p.kind}` : ''}
              </p>
            </div>
            {p.reason &&
          <p className="mt-0.5 text-[12px] text-warn-700">
                {p.reason}{p.until ? ` — tried again after ${new Date(p.until).toLocaleTimeString()}` : ''}
              </p>
          }
          </div>
        </li>
      )}
    </ul>);

}

function Unavailable({ what }: { what: string }) {
  return <p className="text-[12px] text-danger-700">{what} could not be checked.</p>;
}

function Row({ state, title, detail }: { state: string; title: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      <Dot state={state} />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink-900">{title}</p>
        <p className="mt-0.5 text-[12px] text-ink-500">{detail}</p>
      </div>
    </li>);

}

const STATUS_ORDER: TaskStatus[] = [
  'done', 'partial', 'queued', 'planning', 'running', 'waiting_for_review', 'waiting_for_approval', 'waiting_for_input',
  'waiting_for_device', 'waiting_for_budget', 'paused', 'failed', 'cancelled',
];

export function Models() {
  const { status, error } = useRuntimeStatus();
  const ai = checked(status?.ai);
  const search = checked(status?.search);
  const python = checked(status?.python);
  const browser = checked(status?.browser);
  const computers = checked(status?.computers);
  const tasks = checked(status?.tasks);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Runtime</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
            What runs your tasks, right now: the AI models that plan and decide, the search providers,
            the sandbox that runs code, and the browser.
          </p>
        </div>
        {status &&
        <p className="text-[11px] text-ink-400" title={new Date(status.checkedAt).toLocaleString()}>
            Checked {new Date(status.checkedAt).toLocaleTimeString()} · refreshes every 15 s
          </p>
        }
      </div>

      {error &&
      <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">{error}</p>
      }

      {!status && !error ?
      <div className="mt-5 h-48 animate-pulse rounded-xl border border-line bg-panel shadow-panel" aria-label="Loading" /> :
      status &&
      <>
          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
            <Panel
            title="AI models"
            description={ai ?
            ai.connection ? `Your own model: ${ai.connection}` :
            `Tried in this order; the next answers when one is out of credits or down.${ai.model ? ` Model: ${ai.model}.` : ''}` :
            'Could not be checked'}
            padded={false}>

              {ai ?
            <ProviderList providers={ai.providers} empty={ai.connection ? 'Calls go to your connected model.' : 'No AI provider is configured.'} /> :
            <div className="px-5 py-4"><Unavailable what="The AI providers" /></div>}
            </Panel>

            <Panel
            title="Web search"
            description={search ? search.chosenByAccount ? 'Your order, from Settings.' : 'The platform’s order — you can change it in Settings.' : 'Could not be checked'}
            padded={false}
            action={<Link href="/app/settings" className="text-[12px] font-medium text-brand-700 hover:text-brand-500">Settings</Link>}>

              {search ?
            <ProviderList providers={search.providers} empty="No search provider is enabled." /> :
            <div className="px-5 py-4"><Unavailable what="Search" /></div>}
            </Panel>

            <Panel title="Services">
              <ul className="space-y-4">
                {python ?
              <Row
                state={python.available ? 'up' : 'down'}
                title="Code sandbox"
                detail={`${python.available ? 'Running' : 'Unavailable'} on ${python.executor}${
                python.fallback ? `, ${python.fallback.executor} as fallback (${python.fallback.available ? 'ready' : 'unavailable'})` : ''}. ${
                python.files ? 'Scripts can read the full text of earlier results.' : 'Scripts get earlier results inline only.'}`} /> :
              <li><Unavailable what="The code sandbox" /></li>}
                {browser ?
              <Row
                state={browser.available ? 'up' : 'not set up'}
                title="Browser"
                detail={browser.available ? 'Ready for pages that need a real browser.' : 'Not available — tasks read pages over HTTP only.'} /> :
              <li><Unavailable what="The browser worker" /></li>}
                {computers ?
              <Row
                state={computers.connected ? 'up' : 'not set up'}
                title="Your computers"
                detail={computers.total ?
                `${computers.connected} of ${computers.total} online.` :
                'None connected. Tasks that need your files or apps wait for one.'} /> :
              <li><Unavailable what="Your computers" /></li>}
              </ul>
              <Link href="/app/devices" className="mt-4 inline-block text-[12px] font-medium text-brand-700 hover:text-brand-500">
                Manage computers
              </Link>
            </Panel>
          </div>

          <div className="mt-5">
            <Panel title="Your tasks, last 7 days" description={tasks ? `${tasks.total} task${tasks.total === 1 ? '' : 's'}` : 'Could not be checked'}>
              {tasks ?
            tasks.total ?
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
                    {STATUS_ORDER.filter((s) => tasks.byStatus[s]).map((s) =>
              <div key={s}>
                        <dt className="text-[11px] capitalize text-ink-500">{s.replace(/_/g, ' ')}</dt>
                        <dd className="tabular mt-1 text-[18px] font-semibold text-ink-900">{tasks.byStatus[s]}</dd>
                      </div>
              )}
                  </dl> :
            <p className="text-[12px] text-ink-500">No tasks in the last week.</p> :
            <Unavailable what="Your tasks" />}
            </Panel>
          </div>
        </>
      }
    </div>);

}
