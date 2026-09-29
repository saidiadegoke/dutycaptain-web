'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, connectionsApi, triggersApi } from '@/lib/api';
import type { Connection, PlatformInfo, Trigger, TriggerDetail } from '@/lib/types';
import { ago } from '@/utils/format';

/**
 * Connections and events (phase 7).
 *
 * A CONNECTION is this account's own access to a platform through its
 * official API — you allow DutyCaptain on the platform, it never sees your
 * password. Tasks read through it without asking (search, trends, comments,
 * your posts' numbers); nothing is posted. Fetching or browsing the site
 * itself stays yours to do.
 *
 * A TRIGGER is a URL of DutyCaptain's that an app or a platform's webhook
 * sends events to: each event starts a task, or reaches a step waiting for it.
 */
export function Connections() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">Connections</h1>
        <p className="mt-1 text-[13px] text-ink-500">Platforms your tasks read through, and the events that start them.</p>
      </div>
      <ConnectionsPanel />
      <TriggersPanel />
    </div>);
}

const STATUS: Record<Connection['status'], { label: string; cls: string }> = {
  active: { label: 'Connected', cls: 'text-ok-700' },
  expired: { label: 'Expired — reconnect', cls: 'text-danger-700' },
  pending: { label: 'Waiting for you on the platform', cls: 'text-ink-500' },
  error: { label: 'Did not connect', cls: 'text-danger-700' },
  revoked: { label: 'Disconnected', cls: 'text-ink-500' },
};

export function ConnectionsPanel() {
  const params = useSearchParams();
  const [list, setList] = useState<Connection[] | null>(null);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [error, setError] = useState<string | null>(params.get('connection_error'));
  const [note, setNote] = useState<string | null>(params.get('connected') ? 'Connected.' : null);
  const [busy, setBusy] = useState(false);

  const load = () => connectionsApi.list().then((d) => { setList(d.connections); setPlatforms(d.platforms); }).catch(() => setError('Could not load your connections.'));
  useEffect(() => { load(); }, []);

  async function connect(platform: string, reconnect?: string) {
    setBusy(true);
    setError(null);
    try {
      const { authorize_url: url } = await connectionsApi.start(platform, { ...(reconnect ? { reconnect } : {}), return_to: '/app/connections' });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start connecting.');
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    setNote(null);
    try { await fn(); await load(); } catch (err) { setError(err instanceof ApiError ? err.message : 'That did not work.'); } finally { setBusy(false); }
  }

  const shown = (list || []).filter((c) => c.status !== 'pending');
  return (
    <Panel title="Platforms" description="Your own accounts, through each platform's official API. Tasks read through them without asking; nothing is posted.">
      {error && <p role="alert" className="mb-3 text-[12px] text-danger-700">{error}</p>}
      {note && <p className="mb-3 text-[12px] text-ok-700">{note}</p>}
      <ul className="divide-y divide-line rounded-md border border-line">
        {shown.map((c) =>
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-[13px]">
            <div className="min-w-0">
              <span className="font-medium text-ink-900">{c.label}</span>
              {c.handle && <span className="text-ink-700"> · {c.handle}</span>}
              <span className={`ml-2 text-[12px] ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
              {c.last_used_at && <span className="ml-2 text-[12px] text-ink-500">read {ago(c.last_used_at)}</span>}
              {c.last_error && c.status !== 'active' && <p className="text-[12px] text-ink-500">{c.last_error}</p>}
            </div>
            <div className="flex items-center gap-2">
              {c.status === 'active' &&
            <button type="button" disabled={busy} onClick={() => act(async () => {
              const r = await connectionsApi.check(c.id);
              setNote(r.ok ? `${c.label} ${c.handle || ''} is working.` : null);
              if (!r.ok) setError(r.message || 'Not working.');
            })} className="cursor-pointer text-[12px] font-medium text-brand-700 hover:text-brand-500 disabled:opacity-60">Check</button>}
              {(c.status === 'expired' || c.status === 'error') &&
            <button type="button" disabled={busy} onClick={() => connect(c.platform, c.id)} className="cursor-pointer rounded-md bg-brand-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Reconnect</button>}
              <button type="button" disabled={busy} onClick={() => act(() => connectionsApi.remove(c.id))} aria-label={`Disconnect ${c.label}`}
            className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900 disabled:opacity-60"><XIcon className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        )}
        {list && shown.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-500">None yet. Without one, a task asks you to collect from these sites yourself.</li>}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {platforms.map((p) =>
        <button key={p.id} type="button" disabled={busy || !p.configured} onClick={() => connect(p.id)}
          title={p.configured ? `Asks ${p.label} for: ${p.scopes.join(', ')}` : `Not set up on this server: needs ${p.missing}`}
          className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-800 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50">
            Connect {p.label}
          </button>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
        You allow DutyCaptain on the platform itself; it never sees your password, and it asks only to read.
        If a connection expires, tasks that need it stop at that step and say so — reconnect here and run them again.
      </p>
    </Panel>);
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label="Copy" onClick={() => { navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => {}); }}
      className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900">
      {done ? <CheckIcon className="h-3.5 w-3.5 text-ok-700" /> : <CopyIcon className="h-3.5 w-3.5" />}
    </button>);
}

const MODES: Record<Trigger['mode'], string> = {
  auto: 'starts a task that plans and runs',
  review_each: 'starts a task that waits for you to review its plan',
  none: 'starts nothing — only reaches steps waiting for it',
};

export function TriggersPanel() {
  const [list, setList] = useState<Trigger[] | null>(null);
  const [open, setOpen] = useState<TriggerDetail | null>(null);
  const [secret, setSecret] = useState<{ id: string; value: string } | null>(null);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [mode, setMode] = useState<Trigger['mode']>('auto');
  const [types, setTypes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => triggersApi.list().then(setList).catch(() => setError('Could not load your triggers.'));
  useEffect(() => { load(); }, []);

  async function act(fn: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError(null);
    try { await fn(); after?.(); await load(); } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not save.'); } finally { setBusy(false); }
  }

  return (
    <Panel title="Triggers" description="Events that start a task — from your apps, or a platform's webhook — or that a waiting step is waiting for.">
      {error && <p role="alert" className="mb-3 text-[12px] text-danger-700">{error}</p>}
      <ul className="divide-y divide-line rounded-md border border-line">
        {(list || []).map((t) =>
        <li key={t.id} className="px-3 py-2 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => (open?.id === t.id ? setOpen(null) : triggersApi.get(t.id).then(setOpen).catch(() => {}))} className="min-w-0 cursor-pointer text-left">
                <span className="font-medium text-ink-900">{t.name}</span>
                <span className="text-ink-500"> · {MODES[t.mode]}{t.event_types.length ? ` · for ${t.event_types.join(', ')}` : ''} · {t.event_count} event{t.event_count === 1 ? '' : 's'}{t.last_event_at ? `, last ${ago(t.last_event_at)}` : ''}</span>
                {!t.enabled && <span className="ml-2 text-[12px] text-warn-700">paused</span>}
              </button>
              <div className="flex items-center gap-2">
                <button type="button" disabled={busy} onClick={() => act(() => triggersApi.update(t.id, { enabled: !t.enabled }))} className="cursor-pointer text-[12px] font-medium text-brand-700 hover:text-brand-500 disabled:opacity-60">{t.enabled ? 'Pause' : 'Resume'}</button>
                <button type="button" disabled={busy} onClick={() => act(() => triggersApi.remove(t.id))} aria-label={`Remove ${t.name}`} className="cursor-pointer rounded p-1 text-ink-400 hover:text-ink-900 disabled:opacity-60"><XIcon className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[12px] text-ink-500">
              <code className="truncate font-mono text-[11px]">{t.url}</code><Copy text={t.url} />
              <button type="button" onClick={() => triggersApi.secret(t.id).then((s) => setSecret({ id: t.id, value: s.secret })).catch(() => {})} className="ml-2 cursor-pointer font-medium text-brand-700 hover:text-brand-500">Show secret</button>
              <button type="button" onClick={() => act(async () => { const s = await triggersApi.secret(t.id, true); setSecret({ id: t.id, value: s.secret }); })} className="ml-2 cursor-pointer font-medium text-ink-600 hover:text-ink-900">Rotate</button>
            </div>
            {secret?.id === t.id &&
          <div className="mt-1 flex items-center gap-1 text-[12px]">
                <code className="break-all rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-800">{secret.value}</code><Copy text={secret.value} />
              </div>}
            {open?.id === t.id && <TriggerActivity detail={open} onChanged={() => triggersApi.get(t.id).then(setOpen).catch(() => {})} />}
          </li>
        )}
        {list && list.length === 0 && <li className="px-3 py-2 text-[12px] text-ink-500">None yet.</li>}
      </ul>
      <form onSubmit={(e) => {
        e.preventDefault();
        act(async () => {
          const t = await triggersApi.create({ name, mode, ...(mode !== 'none' ? { objective } : {}), event_types: types.split(',').map((x) => x.trim()).filter(Boolean) });
          if (t.secret) setSecret({ id: t.id, value: t.secret });
        }, () => { setName(''); setObjective(''); setTypes(''); });
      }} className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="new-order" aria-label="Trigger name"
            className="w-[160px] rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] text-ink-900" />
          <select value={mode} onChange={(e) => setMode(e.target.value as Trigger['mode'])} aria-label="What each event does"
            className="rounded-md border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-900">
            <option value="auto">Start a task</option>
            <option value="review_each">Start a task, I review its plan</option>
            <option value="none">Only for waiting steps</option>
          </select>
          <input value={types} onChange={(e) => setTypes(e.target.value)} placeholder="event types, e.g. order.created (all if empty)" aria-label="Event types"
            className="w-[260px] rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] text-ink-900" />
        </div>
        {mode !== 'none' &&
        <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} aria-label="What each event's task should do"
          placeholder="What each event's task should do, e.g. “Thank the customer for their order and add it to the orders sheet”"
          className="w-full rounded-md border border-line bg-panel px-3 py-2 text-[12px] text-ink-900" />}
        <button type="submit" disabled={busy || !name.trim() || (mode !== 'none' && !objective.trim())} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Add trigger</button>
      </form>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
        Send events as JSON to the trigger&apos;s URL, signed: <code className="font-mono">DutyCaptain-Signature: t=&lt;unix seconds&gt;,v1=&lt;hex HMAC-SHA256 of &quot;t.body&quot;&gt;</code> with its secret,
        or <code className="font-mono">Authorization: Bearer &lt;secret&gt;</code>. Its type is the event&apos;s <code className="font-mono">type</code>; an <code className="font-mono">id</code> makes a repeat count once.
        The event reaches the task as data, never as instructions.
      </p>
    </Panel>);
}

const OUTCOME: Record<string, string> = {
  started: 'started a task', resumed: 'reached a waiting step', ignored: 'not a type it wants', duplicate: 'a repeat', skipped: 'nothing to do', received: 'received',
};

function TriggerActivity({ detail, onChanged }: { detail: TriggerDetail; onChanged: () => void }) {
  return (
    <div className="mt-2 rounded-md border border-line bg-canvas px-3 py-2 text-[12px]">
      {detail.waits.length > 0 &&
      <>
          <p className="font-medium text-ink-700">Steps waiting for it</p>
          <ul className="mb-2 mt-1 space-y-1">
            {detail.waits.map((w) =>
          <li key={w.id} className="flex items-center justify-between gap-2">
                <span><Link href={`/app/tasks/${w.task_id}`} className="text-brand-700 hover:text-brand-500">{w.step_title}</Link>{w.rule.type ? ` · ${w.rule.type}` : ''} · until {new Date(w.expires_at).toLocaleString()}</span>
                <button type="button" onClick={() => triggersApi.stopWaiting(w.id).then(onChanged).catch(() => {})} className="cursor-pointer font-medium text-ink-600 hover:text-ink-900">Stop waiting</button>
              </li>
          )}
          </ul>
        </>}
      <p className="font-medium text-ink-700">Recent events</p>
      <ul className="mt-1 space-y-1">
        {detail.events.map((e) =>
        <li key={e.id}>
            <span className="text-ink-800">{e.type || 'event'}</span>
            <span className="text-ink-500"> · {OUTCOME[e.outcome] || e.outcome} · {ago(e.received_at)}</span>
            {e.task_id && <Link href={`/app/tasks/${e.task_id}`} className="ml-1 text-brand-700 hover:text-brand-500">open task</Link>}
          </li>
        )}
        {detail.events.length === 0 && <li className="text-ink-500">None yet.</li>}
      </ul>
    </div>);
}
