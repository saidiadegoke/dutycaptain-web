'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckIcon,
  CopyIcon,
  LaptopIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
  XIcon } from
'lucide-react';
import { Panel } from '@/components/Panel';
import { CapabilityTag } from '@/components/StatusBadge';
import { devicesApi, ApiError } from '@/lib/api';
import type { Device, DeviceGrant, DeviceEnrolment } from '@/lib/types';

/**
 * Devices (P4-08) — §8.5's permissions panel.
 *
 * THE SCREEN'S JOB IS TO KEEP TWO THINGS APART, and almost every mistake in a
 * UI like this comes from merging them. What a computer CAN do is a fact it
 * advertises about itself (§8.3's manifest). What it is ALLOWED to do is a
 * decision the user made (§8.5's grants). A single "permissions" list showing
 * both is how "DutyCaptain has access to my filesystem" comes to mean nothing
 * in particular — and §8.5 opens by saying this is never "full access to the
 * computer". So they are two sections, labelled differently, and only one of
 * them has revoke buttons.
 *
 * "CONNECTED" IS SHOWN WITH ITS EVIDENCE. The API derives it from the last
 * heartbeat rather than storing it, so the dot is never more certain than the
 * timestamp behind it. Showing "offline · last seen 4h ago" costs one line and
 * answers the question a bare grey dot raises.
 *
 * THE ENROLMENT CODE IS SHOWN ONCE. The API keeps only a hash and has no
 * endpoint that reads one back, so this component holds it in state and says
 * plainly that closing the panel loses it. A UI that implied it could be
 * recovered would be lying about the API it is talking to.
 *
 * REVOKING IS THE ONE IRREVERSIBLE THING HERE, so it confirms — and it says
 * what else goes with it, because revoking a computer also revokes every
 * permission it held.
 */

const timeAgo = (iso: string | null) => {
  if (!iso) return 'never';
  const secs = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const countdown = (iso: string) => {
  const secs = Math.round((Date.parse(iso) - Date.now()) / 1000);
  if (secs <= 0) return 'expired';
  const m = Math.floor(secs / 60);
  return `${m}:${String(secs % 60).padStart(2, '0')} left`;
};

/**
 * A scope rendered as the sentence it means.
 *
 * The raw rule (`{ root: { under: ['~/Documents'] } }`) is exact and
 * unreadable; a summary alone is readable and unverifiable. Both are shown —
 * the sentence to scan, the rule underneath it to check — because "what
 * exactly did I allow" is the question this panel exists to answer.
 */
function scopeSentence(scope: DeviceGrant['scope']): string {
  const parts: string[] = [];
  for (const [field, test] of Object.entries(scope || {})) {
    if (test.under?.length) parts.push(`${field} under ${test.under.join(' or ')}`);
    else if (Array.isArray(test.equals)) parts.push(`${field} is one of ${test.equals.join(', ')}`);
    else if (test.equals !== undefined) parts.push(`${field} is ${String(test.equals)}`);
    else if (test.matches) parts.push(`${field} matches ${test.matches}`);
  }
  // An empty scope is a real choice a user may make — "yes, open applications"
  // without naming one — so it gets a sentence rather than a blank.
  return parts.length ? parts.join(' and ') : 'anywhere on this computer';
}

function StatusDot({ device }: {device: Device;}) {
  if (device.status === 'revoked') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />
        Revoked
      </span>);

  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
        device.connected ? 'bg-emerald-500' : 'bg-amber-500'}`
        } />

      <span className={device.connected ? 'text-emerald-700' : 'text-ink-500'}>
        {device.connected ? 'Connected' : 'Offline'}
      </span>
      {/* The evidence behind the dot. */}
      <span className="text-ink-400">· last seen {timeAgo(device.last_seen_at)}</span>
    </span>);

}

/**
 * The manifest, as chips.
 *
 * Read-only on purpose: there is no button here, because nothing on this screen
 * can change what a machine is capable of. The as-of time is shown because a
 * manifest is only as current as the last `hello`.
 */
function Capabilities({ device }: {device: Device;}) {
  const entries = Object.entries(device.capabilities || {});
  const offered = entries.filter(([, v]) => v === true || (Array.isArray(v) && v.length > 0));

  if (!offered.length) {
    return (
      <p className="text-xs text-ink-500">
        {device.capabilities_at ?
        'This computer advertises nothing it can do.' :
        'Not advertised yet — the agent reports this when it connects.'}
      </p>);

  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {offered.map(([key, value]) =>
        <span
          key={key}
          className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] text-ink-700">

            {key.replace(/_/g, ' ')}
            {Array.isArray(value) &&
          <span className="text-ink-400"> · {value.join(', ')}</span>
          }
          </span>
        )}
      </div>
      {device.capabilities_at &&
      <p className="text-[11px] text-ink-400">As reported {timeAgo(device.capabilities_at)}.</p>
      }
    </div>);

}

function Grants({
  grants, onRevoke




}: {grants: DeviceGrant[];onRevoke: (id: string) => void;}) {
  if (!grants.length) {
    return (
      <p className="text-xs text-ink-500">
        Nothing yet. DutyCaptain will ask before it uses this computer, and what you
        allow appears here.
      </p>);

  }

  return (
    <ul className="space-y-2">
      {grants.map((grant) =>
      <li
        key={grant.id}
        className="flex items-start justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CapabilityTag capability={grant.capability} runtime="device" />
              <span className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-500">
                {grant.grant_scope === 'always' ? 'Always' : 'This task only'}
              </span>
              {grant.expires_at &&
            <span className="text-[11px] text-ink-400">expires {timeAgo(grant.expires_at)}</span>
            }
            </div>
            <p className="mt-1 text-xs text-ink-700">{scopeSentence(grant.scope)}</p>
            {/* The exact rule, for anyone who wants to check the sentence. */}
            <pre className="mt-1 overflow-x-auto text-[10px] leading-relaxed text-ink-400">
              {JSON.stringify(grant.scope || {})}
            </pre>
          </div>
          <button
          type="button"
          onClick={() => onRevoke(grant.id)}
          className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] text-ink-700 hover:bg-surface-hover"
          aria-label={`Revoke ${grant.capability}`}>

            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </li>
      )}
    </ul>);

}

/** The code, shown once, with a countdown that makes "short-lived" visible. */
function EnrolmentCode({
  enrolment, onDismiss




}: {enrolment: DeviceEnrolment;onDismiss: () => void;}) {
  const [left, setLeft] = useState(() => countdown(enrolment.expires_at));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLeft(countdown(enrolment.expires_at)), 1000);
    return () => clearInterval(t);
  }, [enrolment.expires_at]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(enrolment.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // A clipboard the browser refused is not a failure worth a dialog — the
      // code is on screen and can be typed, which is what it was designed for.
    }
  };

  return (
    <Panel
      title="Connect a computer"
      description="Install DutyCaptain on the machine, then enter this code."
      action={
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md border border-line px-2 py-1 text-xs text-ink-700 hover:bg-surface-hover">

          <XIcon className="h-3.5 w-3.5" />
        </button>
      }>

      <div className="flex flex-wrap items-center gap-4">
        <code className="rounded-lg border border-line bg-surface px-4 py-3 font-mono text-2xl tracking-[0.2em] text-ink-900">
          {enrolment.code}
        </code>
        <div className="space-y-1">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-700 hover:bg-surface-hover">

            {copied ?
            <CheckIcon className="h-3.5 w-3.5" /> :

            <CopyIcon className="h-3.5 w-3.5" />
            }
            {copied ? 'Copied' : 'Copy'}
          </button>
          <p className={`text-xs ${left === 'expired' ? 'text-rose-600' : 'text-ink-500'}`}>
            {left === 'expired' ? 'This code has expired — issue another.' : left}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-500">
        The code is single use and is shown only here. Close this and it is gone — issue
        another if you need one. It lets a computer join your account; it is not a password
        and it stops working the moment it is used.
      </p>
    </Panel>);

}

function DeviceCard({
  device, grants, onRevokeGrant, onRevokeDevice, onRename





}: {device: Device;grants: DeviceGrant[];onRevokeGrant: (id: string) => void;onRevokeDevice: (device: Device) => void;onRename: (device: Device, name: string) => void;}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(device.name);

  return (
    <Panel
      title={undefined}
      padded={false}
      className={device.status === 'revoked' ? 'opacity-60' : ''}>

      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="flex items-start gap-3">
          <LaptopIcon className="mt-0.5 h-5 w-5 text-ink-400" />
          <div>
            {editing ?
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) onRename(device, draft.trim());
                setEditing(false);
              }}
              className="flex items-center gap-2">

                <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-ink-900" />

                <button type="submit" className="text-xs text-ink-700 hover:underline">Save</button>
                <button
                type="button"
                onClick={() => {setEditing(false);setDraft(device.name);}}
                className="text-xs text-ink-500 hover:underline">

                  Cancel
                </button>
              </form> :

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-semibold tracking-tight text-ink-900 hover:underline">

                {device.name}
              </button>
            }
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusDot device={device} />
              {device.platform &&
              <span className="text-[11px] text-ink-400">{device.platform}</span>
              }
              {device.agent_version &&
              <span className="text-[11px] text-ink-400">agent {device.agent_version}</span>
              }
            </div>
            {/* The key, so two machines with the same name are still tellable
                apart — and so a person can check the one in front of them
                before revoking it. */}
            {device.key_fingerprint &&
            <p className="mt-1 font-mono text-[10px] text-ink-400">{device.key_fingerprint}</p>
            }
          </div>
        </div>

        {device.status === 'active' &&
        <button
          type="button"
          onClick={() => onRevokeDevice(device)}
          className="shrink-0 rounded-md border border-line px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50">

            Revoke
          </button>
        }
      </div>

      {device.status === 'revoked' ?
      <div className="px-5 py-4">
          <p className="text-xs text-ink-500">
            Revoked {timeAgo(device.revoked_at)}
            {device.revoked_reason ? ` — ${device.revoked_reason}` : ''}. It cannot connect
            and every permission it held was revoked with it.
          </p>
        </div> :

      <div className="grid gap-5 px-5 py-4 md:grid-cols-2">
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              What it can do
            </h3>
            <Capabilities device={device} />
          </section>
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <ShieldIcon className="h-3.5 w-3.5" />
              What you have allowed
            </h3>
            <Grants grants={grants} onRevoke={onRevokeGrant} />
          </section>
        </div>
      }
    </Panel>);

}

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [grants, setGrants] = useState<DeviceGrant[]>([]);
  const [enrolment, setEnrolment] = useState<DeviceEnrolment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Device | null>(null);

  const load = useCallback(async () => {
    try {
      // Together, because a device card is meaningless without its grants and
      // showing one before the other makes the panel flicker between two
      // different claims about what is allowed.
      const [d, g] = await Promise.all([
      devicesApi.list({ includeRevoked: true }),
      devicesApi.grants()]
      );
      setDevices(d);
      setGrants(g);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your computers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Liveness comes from a heartbeat the API records, so this screen is only
    // as fresh as its last read. Polled rather than streamed: a device list
    // changes a few times a day, and a socket for it would be a socket to keep
    // working for almost no movement.
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const connect = async () => {
    try {
      setEnrolment(await devicesApi.enrol());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not issue a code');
    }
  };

  const revokeGrant = async (id: string) => {
    // Optimistic: a permission disappearing instantly is the whole point of a
    // revoke button. Reconciled by the next load if the server disagreed.
    setGrants((prev) => prev.filter((g) => g.id !== id));
    try {
      await devicesApi.revokeGrant(id);
    } catch {
      load();
    }
  };

  const revokeDevice = async (device: Device) => {
    setConfirming(null);
    try {
      await devicesApi.revoke(device.id);
    } finally {
      load();
    }
  };

  const rename = async (device: Device, name: string) => {
    setDevices((prev) => prev.map((d) => d.id === device.id ? { ...d, name } : d));
    try {
      await devicesApi.rename(device.id, name);
    } catch {
      load();
    }
  };

  const active = devices.filter((d) => d.status === 'active');
  const revoked = devices.filter((d) => d.status === 'revoked');

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink-900">Computers</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Machines that can run work locally. DutyCaptain only does what you have
            allowed, on the computers you have connected.
          </p>
        </div>
        <button
          type="button"
          onClick={connect}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-xs font-medium text-white hover:bg-ink-800">

          <PlusIcon className="h-3.5 w-3.5" />
          Connect a computer
        </button>
      </header>

      {error &&
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      }

      {enrolment &&
      <EnrolmentCode enrolment={enrolment} onDismiss={() => setEnrolment(null)} />
      }

      {loading ?
      <Panel><p className="text-sm text-ink-500">Loading…</p></Panel> :
      !devices.length ?
      <Panel>
          <div className="py-8 text-center">
            <LaptopIcon className="mx-auto h-8 w-8 text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-900">No computers connected</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
              Some work can only happen on your own machine — searching your files, opening
              an application. Connect a computer and DutyCaptain can do that work there
              instead of asking you to upload anything.
            </p>
          </div>
        </Panel> :

      <div className="space-y-4">
          {active.map((device) =>
        <DeviceCard
          key={device.id}
          device={device}
          grants={grants.filter((g) => g.device_id === device.id)}
          onRevokeGrant={revokeGrant}
          onRevokeDevice={setConfirming}
          onRename={rename} />

        )}
          {revoked.length > 0 &&
        <>
              <h2 className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Revoked
              </h2>
              {revoked.map((device) =>
          <DeviceCard
            key={device.id}
            device={device}
            grants={[]}
            onRevokeGrant={revokeGrant}
            onRevokeDevice={setConfirming}
            onRename={rename} />

          )}
            </>
        }
        </div>
      }

      {confirming &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 px-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-panel p-5 shadow-panel">
            <h2 className="text-sm font-semibold tracking-tight text-ink-900">
              Revoke {confirming.name}?
            </h2>
            {/* What else goes with it. A confirm that only asks "are you sure"
                makes the user guess at the consequence. */}
            <p className="mt-2 text-sm text-ink-700">
              It disconnects immediately and cannot reconnect. Every permission it holds is
              revoked with it, and any task waiting on it will wait for another computer.
              You can connect it again later, but it will need a new code and new
              permissions.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
              type="button"
              onClick={() => setConfirming(null)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-700 hover:bg-surface-hover">

                Cancel
              </button>
              <button
              type="button"
              onClick={() => revokeDevice(confirming)}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700">

                Revoke this computer
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
