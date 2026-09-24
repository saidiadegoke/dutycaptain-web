'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckIcon,
  ClockIcon,
  ShieldAlertIcon,
  TrashIcon,
  XIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { CapabilityTag } from '@/components/StatusBadge';
import { approvalsApi, ApiError } from '@/lib/api';
import type { Approval, ApprovalGrant } from '@/lib/types';

/**
 * Approvals (P3-07) — the screen where a person answers the policy engine.
 *
 * WHAT MAKES THIS SCREEN DANGEROUS is the habit of clicking yes. §7.1's three
 * scopes exist because a task that sends forty emails would otherwise ask forty
 * times, and a person who has been asked forty times stops reading — at which
 * point the approval flow is not a safeguard, it is a ritual that makes one
 * feel safe. So the card leads with **what would actually run**, not with the
 * buttons: the arguments first, the capability second, the reason third.
 *
 * AND THE SCOPES ARE NOT EQUAL. "Once" is the default and the only one
 * pre-selected. The wider two say plainly what they give away, because "always
 * allow" is a decision a person makes in two seconds and lives with for months.
 *
 * WHAT IS SHOWN IS ALREADY SCRUBBED (P3-08). `args_preview` is a redacted,
 * bounded copy — so a credential that reached the arguments is not put back on
 * a screen here.
 */

const timeAgo = (iso: string) => {
  const secs = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const expiresIn = (iso: string | null) => {
  if (!iso) return null;
  const secs = Math.round((Date.parse(iso) - Date.now()) / 1000);
  if (secs <= 0) return 'expired';
  if (secs < 3600) return `${Math.floor(secs / 60)}m left`;
  return `${Math.floor(secs / 3600)}h left`;
};

const SCOPES: {value: 'once' | 'task' | 'always';label: string;detail: string;}[] = [
{ value: 'once', label: 'Just this', detail: 'this exact call, this once' },
{ value: 'task', label: 'This task', detail: `every ${'{capability}'} while this task runs` },
{ value: 'always', label: 'Always', detail: 'this exact call, in any task, until you revoke it' }];


function Argument({ name, value }: {name: string;value: unknown;}) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const long = String(text).length > 120 || String(text).includes('\n');

  return (
    <div className="border-t border-line py-2 first:border-t-0 first:pt-0">
      <p className="font-mono text-[10px] uppercase tracking-wide text-ink-400">{name}</p>
      {long ?
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-canvas p-2 font-mono text-[11px] leading-relaxed text-ink-900">
          {text}
        </pre> :

      <p className="mt-0.5 break-words font-mono text-[12px] text-ink-900">{text}</p>
      }
    </div>);

}

export function Approvals() {
  const params = useSearchParams();
  const deepLinked = params.get('approval');

  const [queue, setQueue] = useState<Approval[] | null>(null);
  const [grants, setGrants] = useState<ApprovalGrant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scope, setScope] = useState<'once' | 'task' | 'always'>('once');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pending, standing] = await Promise.all([approvalsApi.list(), approvalsApi.grants()]);
      setQueue(pending);
      setGrants(standing);
      setSelectedId((current) => {
        if (current && pending.some((a) => a.id === current)) return current;
        // The push notification deep-links to one specific question; honour it
        // when it is still waiting, rather than dropping the person at the top
        // of a list and making them find it.
        if (deepLinked && pending.some((a) => a.id === deepLinked)) return deepLinked;
        return pending.length ? pending[0].id : null;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
    }
  }, [deepLinked]);

  useEffect(() => { load(); }, [load]);

  // A task suspends the moment a policy asks, which can happen while this page
  // is open. Polling rather than streaming: there is no per-user event stream
  // yet (P1-13's is per task), and a question arriving thirty seconds late is
  // not the failure mode this screen has.
  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const selected = queue?.find((a) => a.id === selectedId) || null;

  async function answer(granted: boolean) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const out = await approvalsApi.decide(selected.id, {
        granted, scope, note: note.trim() || undefined,
      });
      setOutcome(
        granted ?
        `Approved. ${out.resumed ? 'The task is running again.' : 'The task will pick it up.'}` :
        'Declined. The task carries on without that step.'
      );
      setNote('');
      setScope('once');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Approvals</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          Tasks run on their own until an action touches something outside the runtime. These are
          suspended mid-plan and resume the moment you decide — nothing is lost while they wait.
        </p>
      </div>

      {error &&
      <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
          {error}
        </p>
      }
      {outcome &&
      <p className="mt-4 rounded-md border border-ok-100 bg-ok-50 px-3 py-2 text-[12px] text-ok-700">
          {outcome}
        </p>
      }

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel
          title="Waiting"
          description={queue === null ? 'Loading…' : `${queue.length} question${queue.length === 1 ? '' : 's'}`}
          padded={false}>

          {queue !== null && queue.length === 0 ?
          <p className="px-4 py-8 text-center text-[12px] text-ink-500">
              Nothing is waiting on you.
            </p> :

          <ul className="divide-y divide-line">
              {(queue || []).map((a) => {
              const active = a.id === selectedId;
              return (
                <li key={a.id}>
                    <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full px-4 py-3 text-left transition-colors duration-150 ease-out ${
                    active ? 'bg-brand-50' : 'hover:bg-canvas'}`
                    }>

                      <div className="flex items-center justify-between gap-2">
                        <CapabilityTag capability={a.capability} runtime={null} />
                        <span className="shrink-0 text-[10px] text-ink-400">{timeAgo(a.created_at)}</span>
                      </div>
                      <p className="mt-1.5 truncate text-[13px] font-medium text-ink-900">{a.summary}</p>
                      {a.task_objective &&
                    <p className="mt-0.5 truncate text-[11px] text-ink-500">{a.task_objective}</p>
                    }
                    </button>
                  </li>);

            })}
            </ul>
          }
        </Panel>

        <div className="space-y-5">
          {selected ?
          <Panel
            title={selected.summary}
            description={`${selected.capability} · asked ${timeAgo(selected.created_at)}`}>

              {/* WHAT WOULD RUN, first. The buttons are below the fold of the
                  argument list on purpose: a person who reads only the top of
                  this card should have read the part that matters. */}
              <div className="rounded-lg border border-line bg-panel px-3.5 py-3">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-400">
                  What would run
                </p>
                {Object.entries(selected.args_preview || {}).length === 0 ?
              <p className="text-[12px] text-ink-500">No arguments.</p> :

              Object.entries(selected.args_preview).map(([k, v]) =>
              <Argument key={k} name={k} value={v} />
              )
              }
              </div>

              {selected.policy_reason &&
            <p className="mt-3 flex items-start gap-2 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn-700">
                  <ShieldAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                  {selected.policy_reason}
                </p>
            }

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-400">
                <Link
                href={`/app/tasks/${selected.task_id}`}
                className="text-brand-700 hover:underline">

                  See the task
                </Link>
                {selected.expires_at &&
              <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" strokeWidth={2.2} />
                    {expiresIn(selected.expires_at)}
                  </span>
              }
                {/* The fingerprint of the exact call. A grant is about THIS, not
                    about the capability in general (P3-02). */}
                <span className="font-mono">{selected.args_hash.slice(0, 12)}…</span>
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[12px] font-medium text-ink-900">If you allow it, how far?</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SCOPES.map((s) =>
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setScope(s.value)}
                  className={`rounded-md border px-3 py-2 text-left transition-colors duration-150 ease-out ${
                  scope === s.value ?
                  'border-brand-200 bg-brand-50' :
                  'border-line bg-panel hover:bg-canvas'}`
                  }>

                      <span className="block text-[12px] font-medium text-ink-900">{s.label}</span>
                      {/* Said plainly. "Always allow" is decided in two seconds
                          and lived with for months. */}
                      <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">
                        {s.detail.replace('{capability}', selected.capability)}
                      </span>
                    </button>
                )}
                </div>

                <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A note for the record (optional)"
                className="mt-3 w-full rounded-md border border-line bg-panel px-3 py-2 text-[12px] text-ink-900 placeholder:text-ink-400" />


                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                  type="button"
                  disabled={busy}
                  onClick={() => answer(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-500 disabled:opacity-60">

                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                    {busy ? 'Working…' : 'Allow'}
                  </button>
                  <button
                  type="button"
                  disabled={busy}
                  onClick={() => answer(false)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3.5 py-2 text-[13px] font-medium text-ink-700 transition-colors duration-150 ease-out hover:bg-canvas disabled:opacity-60">

                    <XIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Decline
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-ink-400">
                  Declining does not fail the task — the step is marked failed and everything that
                  did not depend on it carries on.
                </p>
              </div>
            </Panel> :

          <Panel title="Nothing selected" description="Pick a question from the queue">
              <p className="py-8 text-center text-[12px] text-ink-500">
                {queue === null ? 'Loading…' : 'There is nothing waiting on you right now.'}
              </p>
            </Panel>
          }

          {grants.length > 0 &&
          <Panel
            title="Standing permissions"
            description={`${grants.length} thing${grants.length === 1 ? '' : 's'} you have already allowed`}>

              <ul className="space-y-2">
                {grants.map((g) =>
              <li key={g.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[12px] text-ink-900">{g.capability}</p>
                      <p className="text-[11px] text-ink-500">
                        {g.task_id ? 'for one task' : 'in any task'}
                        {g.args_hash ? ' · that exact call' : ' · any arguments'}
                        {' · '}{timeAgo(g.created_at)}
                      </p>
                    </div>
                    {/* Revocable from the place they are listed. A permission
                        you cannot find is one you cannot take back. */}
                    <button
                  type="button"
                  onClick={async () => { await approvalsApi.revokeGrant(g.id); load(); }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-ink-500 transition-colors duration-150 ease-out hover:bg-canvas hover:text-danger-700">

                      <TrashIcon className="h-3 w-3" strokeWidth={2.2} />
                      Revoke
                    </button>
                  </li>
              )}
              </ul>
            </Panel>
          }
        </div>
      </div>
    </div>);

}
