'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FileTextIcon } from
'lucide-react';
import { ApiError, artifactsApi, tasksApi } from '@/lib/api';
import type { ArtifactRow } from '@/lib/types';
import { TaskStatusBadge } from '@/components/StatusBadge';
import { ago, bytes } from '@/utils/format';

const PAGE = 25;

/** An icon by what the file is, from its type or its name. */
export function iconFor(a: Pick<ArtifactRow, 'mime' | 'filename' | 'kind'>): React.ElementType {
  const name = (a.filename || '').toLowerCase();
  const mime = (a.mime || '').toLowerCase();
  if (a.kind === 'screenshot' || mime.startsWith('image/')) return FileImageIcon;
  if (/csv|spreadsheet|excel/.test(mime) || /\.(csv|xlsx?)$/.test(name)) return FileSpreadsheetIcon;
  if (/json/.test(mime) || name.endsWith('.json')) return FileJsonIcon;
  if (/pdf|text|markdown/.test(mime) || /\.(pdf|txt|md)$/.test(name)) return FileTextIcon;
  return FileIcon;
}

/** Download one file, and say so if it could not be. */
export function useDownload() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const download = useCallback(async (a: Pick<ArtifactRow, 'id' | 'task_id' | 'filename' | 'kind'>) => {
    setBusy(a.id);
    setError(null);
    try {
      await tasksApi.download(a.task_id, a.id, a.filename || a.kind);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not download that file.');
    } finally {
      setBusy(null);
    }
  }, []);
  return { download, busy, error };
}

export function Artifacts() {
  const [rows, setRows] = useState<ArtifactRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { download, busy, error } = useDownload();

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const out = await artifactsApi.list({ page: p, limit: PAGE });
      setRows((prev) => (p === 1 ? out.artifacts : [...prev, ...out.artifacts]));
      setPage(out.pagination.page);
      setTotalPages(out.pagination.totalPages);
      setTotal(out.pagination.total);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load your files.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Artifacts</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          Every file your tasks produced, traced back to the task that created it.
          {total > 0 && ` ${total} file${total === 1 ? '' : 's'}.`}
        </p>
      </div>

      {(error || loadError) &&
      <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
          {error || loadError}
        </p>
      }

      {loading && !rows.length ?
      <div className="mt-5 h-40 animate-pulse rounded-xl border border-line bg-panel shadow-panel" aria-label="Loading" /> :
      !rows.length && !loadError ?
      <div className="mt-5 rounded-xl border border-line bg-panel px-6 py-16 text-center shadow-panel">
          <p className="text-[13px] font-medium text-ink-900">No files yet</p>
          <p className="mt-1 text-[12px] text-ink-500">
            When a task writes a file — a CSV, a report, a spreadsheet — it appears here.
          </p>
        </div> :

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
          {rows.map((a) => {
          const Icon = iconFor(a);
          return (
            <li
              key={a.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-canvas">

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas">
                  <Icon className="h-4 w-4 text-ink-700" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <button
                  type="button"
                  onClick={() => download(a)}
                  className="block max-w-full cursor-pointer truncate text-left font-mono text-[12px] font-medium text-ink-900 hover:text-brand-700 hover:underline">

                    {a.filename || a.kind}
                  </button>
                  <Link
                  href={`/app/tasks/${a.task_id}`}
                  className="mt-0.5 block truncate text-[12px] text-ink-500 hover:text-brand-700">

                    {a.task_objective}
                  </Link>
                </div>
                <div className="hidden shrink-0 md:block">
                  <TaskStatusBadge status={a.task_status} />
                </div>
                <div className="hidden w-[90px] shrink-0 sm:block">
                  <p className="tabular text-[12px] text-ink-700">{bytes(a.bytes)}</p>
                  <p className="text-[11px] text-ink-500">{a.origin === 'device' ? 'your computer' : 'cloud'}</p>
                </div>
                <p className="hidden w-[110px] shrink-0 text-[12px] text-ink-500 md:block" title={new Date(a.created_at).toLocaleString()}>
                  {ago(a.created_at)}
                </p>
                <button
                type="button"
                disabled={busy === a.id}
                onClick={() => download(a)}
                aria-label={`Download ${a.filename || a.kind}`}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas disabled:cursor-wait disabled:opacity-60">

                  <DownloadIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">{busy === a.id ? 'Downloading…' : 'Download'}</span>
                </button>
              </li>);

        })}
        </ul>
      }

      {page < totalPages &&
      <div className="mt-4 text-center">
          <button
          type="button"
          disabled={loading}
          onClick={() => load(page + 1)}
          className="cursor-pointer rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-900 hover:bg-canvas disabled:opacity-60">

            {loading ? 'Loading…' : 'Show more'}
          </button>
        </div>
      }
    </div>);

}
