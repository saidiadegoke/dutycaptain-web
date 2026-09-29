'use client';

import { useEffect, useState } from 'react';
import { EndpointsPanel } from '@/components/settings/EndpointsPanel';
import { ApiKeysPanel } from '@/components/settings/ApiKeysPanel';
import { PersonSitesPanel } from '@/components/settings/PersonSitesPanel';
import { PeoplePanel } from '@/components/settings/PeoplePanel';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { adminApi, ApiError, configApi, notificationsApi, searchApi, session } from '@/lib/api';
import type { NotificationPreferences, SearchSettings } from '@/lib/types';
import { Panel } from '@/components/Panel';

/**
 * Early-access mode (admin): whether the website's "Create an account" shows
 * the early-access form or the sign-up form. Registration stays open either way.
 */
function EarlyAccessPanel() {
  const [earlyAccess, setEarlyAccess] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    configApi.get().
    then((c) => setEarlyAccess(c.early_access)).
    catch(() => setError('Could not read the current setting.'));
  }, []);

  async function toggle() {
    if (earlyAccess === null) return;
    const next = !earlyAccess;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await adminApi.setSetting(
        'early_access_mode',
        next,
        'When on, "Create an account" on the website shows the early-access form'
      );
      setEarlyAccess(next);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403 ?
        'Only an admin can change this.' :
        err instanceof ApiError ? err.message : 'Could not save the setting.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
      <Panel title="Early access · platform">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[14px] font-medium text-ink-900">Early-access mode</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              When on, “Create an account” on the website shows the early-access request form.
              When off, people can create an account straight away. Signing in, and resetting a
              password, work the same either way.
            </p>
            {earlyAccess !== null &&
            <p className="mt-3 text-[12px] text-ink-700">
                Currently <span className="font-semibold">{earlyAccess ? 'on' : 'off'}</span>
                {earlyAccess ? ' — visitors see the request form.' : ' — visitors can sign up.'}
              </p>
            }
            {saved && <p className="mt-2 text-[12px] text-ok-700">Saved. The website picks it up on the next page load.</p>}
            {error && <p role="alert" className="mt-2 text-[12px] text-danger-700">{error}</p>}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={!!earlyAccess}
            aria-label="Early-access mode"
            disabled={earlyAccess === null || saving}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 ease-out ${
            earlyAccess ? 'bg-brand-600' : 'bg-line-strong'} disabled:opacity-60`
            }>
            
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ease-out ${
              earlyAccess ? 'translate-x-5' : 'translate-x-0.5'}`
              } />
            
          </button>
        </div>
      </Panel>);

}

const KIND: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Uses platform credit', cls: 'border-brand-200 bg-brand-50 text-brand-700' },
  free: { label: 'Free', cls: 'border-ok-100 bg-ok-50 text-ok-700' },
  you: { label: 'You search', cls: 'border-warn-100 bg-warn-50 text-warn-700' }
};

/**
 * An ordered list of providers with a switch each — shared by the account's
 * choice and the platform's. Order is the order they are tried in.
 */
function ProviderOrder({
  info,
  order,
  candidates,
  onChange





}: {info: SearchSettings['providers'];order: string[];candidates: string[];onChange: (next: string[]) => void;}) {
  // Enabled first, in order; then the ones switched off, so they can be added back.
  const rows = [...order, ...candidates.filter((n) => !order.includes(n))];
  const byName = Object.fromEntries(info.map((p) => [p.name, p]));
  const move = (name: string, by: number) => {
    const i = order.indexOf(name);
    const j = i + by;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const toggle = (name: string) =>
  onChange(order.includes(name) ? order.filter((n) => n !== name) : [...order, name]);

  return (
    <ol className="divide-y divide-line rounded-lg border border-line">
      {rows.map((name) => {
        const p = byName[name];
        if (!p) return null;
        const on = order.includes(name);
        const position = order.indexOf(name);
        return (
          <li key={name} className={`flex items-center gap-3 px-3 py-2.5 ${on ? '' : 'opacity-60'}`}>
            <input
              id={`provider-${name}`}
              type="checkbox"
              checked={on}
              onChange={() => toggle(name)}
              className="h-3.5 w-3.5 accent-brand-600" />
            
            <label htmlFor={`provider-${name}`} className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-ink-900">
                {on && <span className="tabular font-mono text-[11px] text-ink-400">{position + 1}.</span>}
                {p.label}
                <span className={`rounded border px-1.5 py-[1px] text-[10px] font-medium ${KIND[p.kind].cls}`}>
                  {KIND[p.kind].label}
                </span>
                {!p.installed && <span className="text-[11px] text-ink-500">(no key on this server)</span>}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-500">{p.note}</span>
            </label>
            {on &&
            <span className="flex shrink-0 gap-1">
                <button type="button" aria-label={`Move ${p.label} up`} disabled={position === 0}
              onClick={() => move(name, -1)}
              className="rounded border border-line p-1 text-ink-700 hover:bg-canvas disabled:opacity-40">
                  <ArrowUpIcon className="h-3 w-3" strokeWidth={2.4} />
                </button>
                <button type="button" aria-label={`Move ${p.label} down`} disabled={position === order.length - 1}
              onClick={() => move(name, 1)}
              className="rounded border border-line p-1 text-ink-700 hover:bg-canvas disabled:opacity-40">
                  <ArrowDownIcon className="h-3 w-3" strokeWidth={2.4} />
                </button>
              </span>
            }
          </li>);

      })}
    </ol>);

}

/** The account's own choice of search providers, among the platform's. */
function AccountSearchPanel({ data, onSaved }: {data: SearchSettings;onSaved: (d: SearchSettings) => void;}) {
  const [order, setOrder] = useState<string[]>(data.effective);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => setOrder(data.effective), [data]);

  async function save(next: string[]) {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await searchApi.saveSettings(next);
      onSaved(saved);
      setMessage({ ok: true, text: next.length ? 'Saved. New searches use this order.' : 'Back to the platform’s order.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : 'Could not save.' });
    } finally {
      setBusy(false);
    }
  }

  const changed = order.join() !== data.effective.join();
  return (
    <Panel title="Web search">
      <p className="text-[13px] leading-relaxed text-ink-500">
        When a task needs to find something on the web, these are tried in order until one answers.
        Switch off the ones you do not want — for example, leave only the free ones and “You”
        to keep costs down; the task then waits for you when the free ones cannot answer.
      </p>
      <div className="mt-4">
        <ProviderOrder info={data.providers} order={order} candidates={data.platform} onChange={setOrder} />
      </div>
      {!order.length &&
      <p className="mt-2 text-[12px] text-warn-700">With nothing switched on, searches use the platform’s order.</p>
      }
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-500">
          {data.account ? 'Your own order.' : 'Using the platform’s order.'}
        </p>
        <div className="flex gap-2">
          {data.account &&
          <button type="button" disabled={busy} onClick={() => save([])}
          className="rounded-md border border-line px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">
              Use the platform’s order
            </button>
          }
          <button type="button" disabled={busy || !changed} onClick={() => save(order)}
          className="rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {message && <p role="status" className={`mt-2 text-[12px] ${message.ok ? 'text-ok-700' : 'text-danger-700'}`}>{message.text}</p>}
    </Panel>);

}

/** Admin: which providers the platform offers at all, and its default order. */
function PlatformSearchPanel({ data, onSaved }: {data: SearchSettings;onSaved: () => void;}) {
  const [order, setOrder] = useState<string[]>(data.platform);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setOrder(data.platform), [data]);

  async function save() {
    if (!order.length) return setMessage({ ok: false, text: 'Keep at least one provider switched on.' });
    setBusy(true);
    setMessage(null);
    try {
      await adminApi.setSetting('search', { providers: order }, 'Web search providers offered to accounts, in default order');
      onSaved();
      setMessage({ ok: true, text: 'Saved. Accounts can choose only among these.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : 'Could not save.' });
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  return (
    <Panel title="Web search · platform">
      <p className="text-[13px] leading-relaxed text-ink-500">
        The providers this platform offers, and the default order for accounts that have not chosen
        their own. Accounts can switch these off and reorder them, but cannot use one that is off here.
      </p>
      <div className="mt-4">
        <ProviderOrder info={data.providers} order={order} candidates={data.providers.map((p) => p.name)} onChange={setOrder} />
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" disabled={busy || order.join() === data.platform.join()} onClick={save}
        className="rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
          {busy ? 'Saving…' : 'Save platform order'}
        </button>
      </div>
      {message && <p role="status" className={`mt-2 text-[12px] ${message.ok ? 'text-ok-700' : 'text-danger-700'}`}>{message.text}</p>}
    </Panel>);

}


const EMAIL_SWITCHES: { key: 'tasks_email' | 'approvals_email' | 'devices_email'; label: string; note: string }[] = [
{ key: 'tasks_email', label: 'A task needs you to look something up', note: 'When a search is waiting for you.' },
{ key: 'approvals_email', label: 'A task needs your approval', note: 'Before anything consequential runs.' },
{ key: 'devices_email', label: 'A task needs your computer', note: 'When the companion program has to be connected.' }];


/** Which emails this account gets. */
function EmailPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const user = session.user();
    setVerified(user && user.email_verified !== undefined ? !!user.email_verified : null);
    notificationsApi.preferences().then(setPrefs).catch(() => setError('Could not load your email settings.'));
  }, []);

  async function flip(key: keyof NotificationPreferences) {
    if (!prefs) return;
    const next = !prefs[key];
    setPrefs({ ...prefs, [key]: next });
    try {
      setPrefs(await notificationsApi.update({ [key]: next }));
    } catch (err) {
      setPrefs({ ...prefs, [key]: !next });
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    }
  }

  return (
    <Panel title="Email">
      <p className="text-[13px] leading-relaxed text-ink-500">
        DutyCaptain emails you when a task is waiting for you. Each email also has a one-click link to stop that kind.
      </p>
      {verified === false &&
      <p className="mt-3 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn-700">
          Your email isn’t confirmed yet, so none of these will be sent. Use the banner at the top of the page to confirm it.
        </p>
      }
      {error && <p role="alert" className="mt-3 text-[12px] text-danger-700">{error}</p>}
      {prefs &&
      <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
          {EMAIL_SWITCHES.map((sw) =>
        <li key={sw.key} className="flex items-center justify-between gap-4 px-3 py-2.5">
              <div>
                <p className="text-[13px] font-medium text-ink-900">{sw.label}</p>
                <p className="text-[12px] text-ink-500">{sw.note}</p>
              </div>
              <button
            type="button"
            role="switch"
            aria-checked={!!prefs[sw.key]}
            aria-label={sw.label}
            onClick={() => flip(sw.key)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 ease-out ${prefs[sw.key] ? 'bg-brand-600' : 'bg-line-strong'}`}>
            
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ease-out ${prefs[sw.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </li>
        )}
        </ul>
      }
    </Panel>);

}

/** Settings: every account's own choices, and the platform's for admins. */
export function Settings() {
  const [data, setData] = useState<SearchSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);

  const load = () => searchApi.settings().then(setData).catch((err) =>
  setError(err instanceof ApiError ? err.message : 'Could not load your settings.'));

  useEffect(() => {
    const user = session.user();
    setAdmin(!!user && [user.role, ...(user.roles || [])].some((r) => r === 'admin' || r === 'super_admin'));
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Your choices for this account{admin ? ', and the platform’s (admins only)' : ''}.
        </p>
      </div>
      {error && <p role="alert" className="text-[13px] text-danger-700">{error}</p>}
      {data && <AccountSearchPanel data={data} onSaved={setData} />}
      <PersonSitesPanel />
      <PeoplePanel />
      <EndpointsPanel />
      <ApiKeysPanel />
      <EmailPanel />
      {admin && data && <PlatformSearchPanel data={data} onSaved={load} />}
      {admin && <EarlyAccessPanel />}
    </div>);

}
