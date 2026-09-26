'use client';

import { useRef, useState } from 'react';
import { ExternalLinkIcon, FileTextIcon, PlusIcon, SearchIcon, UploadIcon, XIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { SearchRequest, SearchUpload } from '@/lib/types';

const ACCEPT = '.txt,.md,.csv,.html,.htm,.pdf';
const MAX_FINDINGS = 10;

interface Finding {
  url: string;
  title: string;
  content: string;
}

const empty = (): Finding => ({ url: '', title: '', content: '' });

/**
 * A search the task handed to its owner: open it in your own browser, paste the
 * links (and the text that answers it) or upload what you saved — a page, a
 * PDF, a CSV — and the task continues.
 */
export function SearchRequestCard({
  taskId,
  request,
  onDone



}: {taskId: string;request: SearchRequest;onDone: () => void;}) {
  const [findings, setFindings] = useState<Finding[]>([empty()]);
  const [notes, setNotes] = useState('');
  const [uploads, setUploads] = useState<SearchUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<'answer' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const update = (i: number, key: keyof Finding, value: string) =>
  setFindings(findings.map((f, j) => j === i ? { ...f, [key]: value } : f));

  const usable = findings.filter((f) => f.url.trim() || f.content.trim());
  const count = usable.length + uploads.length;
  const expires = new Date(request.expires_at);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (usable.length + uploads.length >= MAX_FINDINGS) {
          setError(`At most ${MAX_FINDINGS} findings per search.`);
          break;
        }
        const done = await tasksApi.uploadSearchFile(taskId, request.id, file);
        setUploads((prev) => [...prev, done]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that file.');
    } finally {
      setUploading(false);
      if (picker.current) picker.current.value = '';
    }
  }

  async function answer() {
    if (!count) return setError('Add at least one link, paste the text that answers it, or upload a file.');
    setBusy('answer');
    setError(null);
    try {
      await tasksApi.answerSearch(taskId, request.id, {
        results: [
          ...usable.map((f) => ({
            ...(f.url.trim() ? { url: f.url.trim() } : {}),
            ...(f.title.trim() ? { title: f.title.trim() } : {}),
            ...(f.content.trim() ? { content: f.content.trim() } : {})
          })),
          ...uploads.map((u) => ({ file: u.file, title: u.name }))
        ].slice(0, MAX_FINDINGS),
        ...(notes.trim() ? { notes: notes.trim() } : {})
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your answer.');
      setBusy(null);
    }
    return undefined;
  }

  async function decline() {
    setBusy('decline');
    setError(null);
    try {
      await tasksApi.declineSearch(taskId, request.id, notes.trim() || undefined);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that.');
      setBusy(null);
    }
  }

  const field =
  'w-full rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

  return (
    <section className="mt-3 rounded-xl border border-warn-100 bg-warn-50/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-warn-700">
            <SearchIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> This task needs you to look something up
          </p>
          <p className="mt-2 text-[16px] font-semibold text-ink-900">“{request.query}”</p>
          <p className="mt-1 text-[12px] text-ink-500">
            Waiting until {expires.toLocaleString()} — after that the task continues without it.
          </p>
        </div>
        <a
          href={request.search_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500">

          Open the search <ExternalLinkIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </a>
      </div>

      <div className="mt-4 space-y-3">
        {findings.map((f, i) =>
        <div key={i} className="rounded-lg border border-line bg-panel p-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium text-ink-900">What you found {findings.length > 1 ? i + 1 : ''}</p>
              {findings.length > 1 &&
            <button
              type="button"
              onClick={() => setFindings(findings.filter((_, j) => j !== i))}
              aria-label="Remove"
              className="rounded p-1 text-ink-400 hover:bg-canvas hover:text-ink-900">

                  <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
            }
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
              value={f.url}
              onChange={(e) => update(i, 'url', e.target.value)}
              placeholder="Link, e.g. https://…"
              aria-label="Link"
              className={field} />

              <input
              value={f.title}
              onChange={(e) => update(i, 'title', e.target.value)}
              placeholder="Page title (optional)"
              aria-label="Page title"
              className={field} />

            </div>
            <textarea
            value={f.content}
            onChange={(e) => update(i, 'content', e.target.value)}
            rows={3}
            maxLength={8000}
            placeholder="Paste the part of the page that answers it (optional, but it helps most)"
            aria-label="Text from the page"
            className={`${field} mt-2 resize-y`} />

          </div>
        )}
        {uploads.map((u, i) =>
        <div key={u.file} className="flex items-start gap-3 rounded-lg border border-line bg-panel p-3">
            <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-ink-900">{u.name}</p>
              <p className="text-[11px] text-ink-500">{u.chars.toLocaleString()} characters of text</p>
              <p className="mt-1 line-clamp-2 text-[12px] text-ink-700">{u.preview}</p>
            </div>
            <button
            type="button"
            onClick={() => setUploads(uploads.filter((_, j) => j !== i))}
            aria-label={`Remove ${u.name}`}
            className="cursor-pointer rounded p-1 text-ink-400 hover:bg-canvas hover:text-ink-900">

              <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4">
          {findings.length + uploads.length < MAX_FINDINGS &&
          <button
            type="button"
            onClick={() => setFindings([...findings, empty()])}
            className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">

              <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Add another
            </button>
          }
          {count < MAX_FINDINGS &&
          <button
            type="button"
            disabled={uploading}
            onClick={() => picker.current?.click()}
            className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500 disabled:cursor-wait disabled:opacity-60">

              <UploadIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> {uploading ? 'Uploading…' : 'Upload a file'}
            </button>
          }
          <span className="text-[11px] text-ink-500">Saved pages, PDFs, text or CSV — up to 10 MB each.</span>
          <input
            ref={picker}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => upload(e.target.files)} />

        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Anything else the task should know (optional)"
          aria-label="Notes"
          className={`${field} resize-y`} />

      </div>

      {error &&
      <p role="alert" className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
          {error}
        </p>
      }

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={decline}
          className="rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">

          {busy === 'decline' ? 'Sending…' : 'I couldn’t find it'}
        </button>
        <button
          type="button"
          disabled={busy !== null || uploading || !count}
          onClick={answer}
          className="rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">

          {busy === 'answer' ? 'Sending…' : 'Send and continue'}
        </button>
      </div>
      <p className="mt-2 text-right text-[11px] text-ink-500">
        What you paste is treated as information from the web, never as instructions to the task.
      </p>
    </section>);

}
