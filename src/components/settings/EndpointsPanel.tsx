'use client';

import { useEffect, useState } from 'react';
import { KeyRoundIcon, PlusIcon, SendIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, endpointsApi } from '@/lib/api';
import type { Endpoint, EndpointInput, SendResult } from '@/lib/types';

type HeaderRow = { name: string; value: string; secret: boolean; kept?: boolean };

const METHODS: Endpoint['method'][] = ['POST', 'PUT', 'PATCH', 'GET', 'DELETE'];
const field = 'w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';
const TEMPLATE_HINT = `{
  "prices": "{{outputs[name=records].data}}",
  "summary": "{{outcome.summary}}",
  "task": "{{task.id}}"
}`;

function rowsOf(e: Endpoint | null): HeaderRow[] {
  if (!e) return [{ name: 'Authorization', value: '', secret: true }];
  return [
  ...Object.entries(e.headers).map(([name, value]) => ({ name, value, secret: false })),
  ...e.secret_headers.map((name) => ({ name, value: '', secret: true, kept: true }))];

}

/** Add or change one endpoint. */
function EndpointForm({ endpoint, onSaved, onCancel }: {endpoint: Endpoint | null;onSaved: (e: Endpoint) => void;onCancel: () => void;}) {
  const [name, setName] = useState(endpoint?.name || '');
  const [description, setDescription] = useState(endpoint?.description || '');
  const [method, setMethod] = useState<Endpoint['method']>(endpoint?.method || 'POST');
  const [url, setUrl] = useState(endpoint?.url || '');
  const [rows, setRows] = useState<HeaderRow[]>(rowsOf(endpoint));
  const [approval, setApproval] = useState<'ask' | 'auto'>(endpoint?.approval || 'ask');
  const [honoursKey, setHonoursKey] = useState(Boolean(endpoint?.honours_idempotency_key));
  const [template, setTemplate] = useState(endpoint?.body_template ? JSON.stringify(endpoint.body_template, null, 2) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRow = (i: number, patch: Partial<HeaderRow>) => setRows(rows.map((r, j) => j === i ? { ...r, ...patch } : r));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const used = rows.filter((r) => r.name.trim());
    const input: EndpointInput = {
      name: name.trim(),
      description: description.trim() || null,
      method,
      url: url.trim(),
      approval,
      honours_idempotency_key: honoursKey,
      headers: Object.fromEntries(used.filter((r) => !r.secret).map((r) => [r.name.trim(), r.value])),
      // An empty value on a kept secret means "leave it as it is".
      secret_headers: Object.fromEntries(used.filter((r) => r.secret).map((r) => [r.name.trim(), r.value])),
      body_template: template.trim() ? template : null
    };
    try {
      onSaved(endpoint ? await endpointsApi.update(endpoint.id, input) : await endpointsApi.create(input));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the endpoint.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-line bg-canvas p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-medium text-ink-700">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="orders-api" required className={`${field} mt-1 font-mono`} />
          <span className="mt-1 block text-[11px] text-ink-500">What you (and the task) call it.</span>
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-ink-700">What it is for (optional)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Receives price updates" className={`${field} mt-1`} />
        </label>
      </div>

      <div className="flex gap-2">
        <label className="block w-[120px] shrink-0">
          <span className="text-[12px] font-medium text-ink-700">Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as Endpoint['method'])} className={`${field} mt-1 cursor-pointer`}>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="block min-w-0 flex-1">
          <span className="text-[12px] font-medium text-ink-700">URL</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/prices" required className={`${field} mt-1 font-mono`} />
        </label>
      </div>

      <div>
        <p className="text-[12px] font-medium text-ink-700">Headers</p>
        <p className="text-[11px] text-ink-500">Mark a header secret (an API key, a token): it is stored encrypted, never shown again, and never given to the AI.</p>
        <ul className="mt-2 space-y-2">
          {rows.map((r, i) =>
          <li key={i} className="flex flex-wrap items-center gap-2">
              <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value, kept: false })} placeholder="Header name" className={`${field} w-[170px] font-mono`} aria-label="Header name" />
              <input
              value={r.value}
              onChange={(e) => setRow(i, { value: e.target.value })}
              type={r.secret ? 'password' : 'text'}
              placeholder={r.kept ? '•••••• (kept — type to replace)' : r.secret ? 'Secret value' : 'Value'}
              className={`${field} min-w-[180px] flex-1 font-mono`}
              aria-label="Header value" />
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-700">
                <input type="checkbox" checked={r.secret} onChange={(e) => setRow(i, { secret: e.target.checked, kept: false })} className="cursor-pointer" />
                Secret
              </label>
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove header" className="cursor-pointer rounded p-1.5 text-ink-400 hover:bg-panel hover:text-ink-900">
                <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </li>
          )}
        </ul>
        <button type="button" onClick={() => setRows([...rows, { name: '', value: '', secret: false }])} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Add a header
        </button>
      </div>

      <fieldset>
        <legend className="text-[12px] font-medium text-ink-700">Before sending</legend>
        <div className="mt-2 space-y-2">
          {([['ask', 'Ask me first', 'Each send waits for your approval.'], ['auto', 'Send without asking', 'Tasks send to it as soon as they are ready.']] as const).map(([value, label, note]) =>
          <label key={value} className="flex cursor-pointer items-start gap-2.5">
              <input type="radio" name="approval" value={value} checked={approval === value} onChange={() => setApproval(value)} className="mt-1 cursor-pointer" />
              <span>
                <span className="block text-[13px] text-ink-900">{label}</span>
                <span className="block text-[12px] text-ink-500">{note}</span>
              </span>
            </label>
          )}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" checked={honoursKey} onChange={(e) => setHonoursKey(e.target.checked)} className="mt-1 cursor-pointer" />
        <span>
          <span className="block text-[13px] text-ink-900">It ignores repeats of the same Idempotency-Key</span>
          <span className="block text-[12px] text-ink-500">
            Every send carries an <code className="font-mono">Idempotency-Key</code> header. If a send times out, DutyCaptain can&rsquo;t tell whether it arrived.
            Tick this only if this API treats a repeated key as the same request: DutyCaptain will then ask it again to find out. Otherwise it asks you instead of risking a second send.
          </span>
        </span>
      </label>

      <label className="block">
        <span className="text-[12px] font-medium text-ink-700">Body (optional)</span>
        <span className="block text-[11px] text-ink-500">
          Leave empty to send the standard result: the task, its outcome, the records it produced with their field names, and links to its files.
          Or write the JSON the API expects, filling values with <code className="font-mono">{'{{…}}'}</code>.
        </span>
        <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={5} placeholder={TEMPLATE_HINT} className={`${field} mt-1 resize-y font-mono text-[12px]`} />
      </label>

      {error && <p role="alert" className="text-[12px] text-danger-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas">Cancel</button>
        <button type="submit" disabled={busy} className="cursor-pointer rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
          {busy ? 'Saving…' : endpoint ? 'Save changes' : 'Save endpoint'}
        </button>
      </div>
    </form>);

}

function TestResult({ result }: {result: SendResult;}) {
  return (
    <div className={`mt-2 rounded-md border px-3 py-2 text-[12px] ${result.ok ? 'border-ok-100 bg-ok-50 text-ok-700' : 'border-danger-100 bg-danger-50 text-danger-700'}`}>
      {result.ok ? `It worked — HTTP ${result.response?.status}.` : `It did not work: ${result.error}`}
      {result.response && (result.response.json !== undefined || result.response.body) &&
      <pre className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-ink-700">
          {result.response.json !== undefined ? JSON.stringify(result.response.json, null, 2) : result.response.body}
        </pre>
      }
    </div>);

}

/** The APIs this account's tasks may send results to. */
export function EndpointsPanel() {
  const [list, setList] = useState<Endpoint[] | null>(null);
  const [editing, setEditing] = useState<Endpoint | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SendResult>>({});

  const load = () => endpointsApi.list().then(setList).catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your endpoints.'));
  useEffect(() => { load(); }, []);

  async function test(e: Endpoint) {
    setTesting(e.id);
    try {
      const r = await endpointsApi.test(e.id);
      setResults((all) => ({ ...all, [e.id]: r }));
    } catch (err) {
      setResults((all) => ({ ...all, [e.id]: { ok: false, request: {}, error: err instanceof ApiError ? err.message : 'Could not send the test.' } }));
    } finally {
      setTesting(null);
    }
  }

  async function remove(e: Endpoint) {
    if (!window.confirm(`Delete ${e.name}? Tasks set to send to it will not be able to.`)) return;
    try {
      await endpointsApi.remove(e.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete it.');
    }
  }

  return (
    <Panel
      title="API endpoints"
      description="Where tasks can send their results — when they finish, or as a step."
      action={editing === null ?
      <button type="button" onClick={() => setEditing('new')} className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">
            <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Add endpoint
          </button> :
      undefined}>

      {error && <p role="alert" className="mb-3 text-[12px] text-danger-700">{error}</p>}
      {editing !== null &&
      <div className="mb-4">
          <EndpointForm
          endpoint={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
        </div>
      }
      {list === null ?
      <p className="text-[12px] text-ink-500">Loading…</p> :
      list.length === 0 && editing === null ?
      <p className="text-[13px] leading-relaxed text-ink-500">
          None yet. Add one to have a task send its result to your own system — a CRM, a spreadsheet service, a webhook.
        </p> :

      <ul className="divide-y divide-line rounded-lg border border-line">
          {list.map((e) =>
        <li key={e.id} className="px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-ink-900">{e.name}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-ink-500">{e.method} {e.url}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
                    <span>{e.approval === 'ask' ? 'Asks before sending' : 'Sends without asking'}</span>
                    {e.secret_headers.length > 0 &&
                <span className="inline-flex items-center gap-1"><KeyRoundIcon className="h-3 w-3" strokeWidth={2.2} />{e.secret_headers.join(', ')}</span>
                }
                    <span>{e.body_template ? 'Custom body' : 'Standard result'}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" disabled={testing === e.id} onClick={() => test(e)} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">
                    <SendIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> {testing === e.id ? 'Sending…' : 'Send a test'}
                  </button>
                  <button type="button" onClick={() => setEditing(e)} className="cursor-pointer rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">Edit</button>
                  <button type="button" onClick={() => remove(e)} aria-label={`Delete ${e.name}`} className="cursor-pointer rounded-md p-1.5 text-ink-400 hover:bg-canvas hover:text-danger-700">
                    <Trash2Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
              {results[e.id] && <TestResult result={results[e.id]} />}
            </li>
        )}
        </ul>
      }
    </Panel>);

}
