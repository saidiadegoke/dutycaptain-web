'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, apiKeysApi } from '@/lib/api';
import type { ApiKey } from '@/lib/types';

const field = 'w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never');

/**
 * Keys another system uses to create tasks in this account.
 *
 * A key can create a task and read it back, and nothing else: it cannot change
 * settings, endpoints or policies. The full key is shown once, when it is made.
 */
export function ApiKeysPanel() {
  const [list, setList] = useState<ApiKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      setList(await apiKeysApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your keys.');
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const k = await apiKeysApi.create(name.trim());
      setCreated(k.key);
      setCopied(false);
      setAdding(false);
      setName('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the key.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(k: ApiKey) {
    if (!window.confirm(`Revoke "${k.name}"? Anything using it stops working immediately.`)) return;
    try {
      await apiKeysApi.revoke(k.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not revoke it.');
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
    } catch { /* the key is still selectable */ }
  }

  return (
    <Panel
      title="API keys"
      description="Let another system create tasks in this account and follow them. A key can do nothing else."
      action={!adding ?
      <button type="button" onClick={() => { setAdding(true); setCreated(null); }} className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Create key
          </button> :
      undefined}>

      {error && <p role="alert" className="mb-3 text-[12px] text-danger-700">{error}</p>}

      {created &&
      <div className="mb-4 rounded-lg border border-warn-100 bg-warn-50 p-3">
          <p className="text-[12px] font-medium text-ink-900">Copy this key now — it won’t be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md border border-line bg-panel px-2 py-1.5 font-mono text-[12px] text-ink-900">{created}</code>
            <button type="button" onClick={copy} className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">
              {copied ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> : <CopyIcon className="h-3.5 w-3.5" strokeWidth={2.2} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-500">Send it as <code className="font-mono">Authorization: Bearer sk_live_…</code>. Store it in the other system’s secret settings.</p>
        </div>
      }

      {adding &&
      <form onSubmit={(e) => { e.preventDefault(); create(); }} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-line bg-canvas p-3">
          <label className="block min-w-[220px] flex-1">
            <span className="text-[12px] font-medium text-ink-700">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="naijareels-worker" autoFocus className={`${field} mt-1 font-mono`} />
          </label>
          <button type="submit" disabled={busy || !name.trim()} className="cursor-pointer rounded-md bg-brand-700 px-3 py-2 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
            {busy ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={() => setAdding(false)} className="cursor-pointer rounded-md px-3 py-2 text-[12px] font-medium text-ink-700 hover:bg-panel">Cancel</button>
        </form>
      }

      {list === null ?
      <p className="text-[12px] text-ink-500">Loading…</p> :
      list.length === 0 ?
      <p className="text-[13px] leading-relaxed text-ink-500">None yet. Create one for a system that should start tasks here, such as a website’s job worker.</p> :
      <ul className="divide-y divide-line rounded-lg border border-line">
          {list.map((k) =>
        <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[13px] font-medium text-ink-900">{k.name}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  <span className="font-mono">{k.key_prefix}…</span> · created {day(k.created_at)} · last used {day(k.last_used_at)}
                  {k.status === 'revoked' ? ' · revoked' : ''}
                </p>
              </div>
              {k.status === 'active' &&
          <button type="button" onClick={() => revoke(k)} aria-label={`Revoke ${k.name}`} className="cursor-pointer rounded-md p-1.5 text-ink-400 hover:bg-canvas hover:text-danger-700">
                  <Trash2Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
          }
            </li>
        )}
        </ul>
      }
    </Panel>);

}
