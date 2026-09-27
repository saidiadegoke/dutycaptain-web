'use client';

import { useEffect, useState } from 'react';
import { XIcon } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ApiError, personSitesApi } from '@/lib/api';
import type { PersonSites } from '@/lib/types';

/**
 * Sites you collect from yourself. The AI never fetches or browses them — a
 * step that tries is refused and becomes a request to you, so your logins
 * stay yours and the platforms see normal use from your own browser.
 */
export function PersonSitesPanel() {
  const [data, setData] = useState<PersonSites | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { personSitesApi.get().then(setData).catch(() => setError('Could not load the list.')); }, []);

  async function save(sites: string[] | null) {
    setBusy(true);
    setError(null);
    try {
      setData(await personSitesApi.set(sites));
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const more = draft.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!more.length || !data) return;
    save([...data.sites, ...more]);
  }

  return (
    <Panel title="Sites I collect myself" description="The AI never visits these. Anything a task needs from them becomes a request to you.">
      <p className="text-[13px] leading-relaxed text-ink-500">
        Good for social platforms and anything behind your own logins: you gather it in your own browser, the task does the rest.
      </p>
      {error && <p role="alert" className="mt-3 text-[12px] text-danger-700">{error}</p>}
      {data &&
      <>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {data.sites.map((site) =>
          <li key={site} className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[12px] text-ink-900">
                {site}
                <button type="button" disabled={busy} onClick={() => save(data.sites.filter((s) => s !== site))} aria-label={`Remove ${site}`}
            className="cursor-pointer rounded p-0.5 text-ink-400 hover:text-ink-900 disabled:opacity-60">
                  <XIcon className="h-3 w-3" strokeWidth={2.4} />
                </button>
              </li>
          )}
            {data.sites.length === 0 && <li className="text-[12px] text-ink-500">None — the AI may visit any site the task needs.</li>}
          </ul>
          <form onSubmit={add} className="mt-3 flex flex-wrap items-center gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="supplier-portal.com"
          className="w-[240px] rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[12px] text-ink-900" aria-label="Add a site" />
            <button type="submit" disabled={busy || !draft.trim()} className="cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">Add</button>
            {data.custom &&
          <button type="button" disabled={busy} onClick={() => save(null)} className="cursor-pointer text-[12px] font-medium text-brand-700 hover:text-brand-500">
                Back to the defaults ({data.defaults.join(', ')})
              </button>
          }
          </form>
        </>
      }
    </Panel>);

}
