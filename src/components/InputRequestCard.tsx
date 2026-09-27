'use client';

import { useRef, useState } from 'react';
import { ClipboardListIcon, FileTextIcon, PlusIcon, UploadIcon, XIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { InputRequest, SearchUpload } from '@/lib/types';

const ACCEPT = '.txt,.md,.csv,.html,.htm,.pdf';
const field = 'w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

type Row = Record<string, string>;

/**
 * A step asking its owner to collect data — from their own logins, somewhere
 * offline — and hand it back. Rows in the columns the step asked for, pasted
 * text, or uploaded files (a CSV with those columns becomes rows); any mix.
 * The task carries on with what they send.
 */
export function InputRequestCard({ taskId, request, onDone }: {taskId: string;request: InputRequest;onDone: () => void;}) {
  const fields = request.fields;
  const blank = (): Row => Object.fromEntries(fields.map((f) => [f.name, '']));
  const [rows, setRows] = useState<Row[]>(fields.length ? [blank(), blank(), blank()] : []);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [uploads, setUploads] = useState<SearchUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<'send' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const filled = rows.filter((r) => Object.values(r).some((v) => v.trim()));
  const hasSomething = filled.length > 0 || text.trim() || uploads.length > 0;
  const expires = new Date(request.expires_at);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const done = await tasksApi.uploadInputFile(taskId, request.id, file);
        setUploads((prev) => [...prev, done]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that file.');
    } finally {
      setUploading(false);
      if (picker.current) picker.current.value = '';
    }
  }

  async function send() {
    if (!hasSomething) return setError('Add a row, paste some text, or upload a file.');
    setBusy('send');
    setError(null);
    try {
      await tasksApi.answerInput(taskId, request.id, {
        ...(filled.length ? { records: filled } : {}),
        ...(text.trim() ? { text: text.trim() } : {}),
        ...(uploads.length ? { files: uploads.map((u) => u.file) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {})
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send it.');
      setBusy(null);
    }
    return undefined;
  }

  async function decline() {
    setBusy('decline');
    setError(null);
    try {
      await tasksApi.declineInput(taskId, request.id, notes.trim() || undefined);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that.');
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-warn-100 bg-warn-50/50 p-5">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-warn-700">
        <ClipboardListIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> This task needs you to collect something
      </p>
      <p className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-snug text-ink-900">{request.instructions}</p>
      <p className="mt-1 text-[12px] text-ink-500">
        Use your own browser and accounts — nothing is shared with the AI but what you send here.
        Waiting until {expires.toLocaleString()}; after that the task continues without it.
      </p>

      {fields.length > 0 &&
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-panel">
          <table className="w-full text-[12px]">
            <thead className="bg-canvas">
              <tr>
                {fields.map((f) =>
              <th key={f.name} className="px-2.5 py-2 text-left font-semibold text-ink-700" title={f.description || undefined}>
                    {f.name.replace(/_/g, ' ')}
                    {f.type === 'number' && <span className="ml-1 font-normal text-ink-400">(number)</span>}
                  </th>
              )}
                <th className="w-8" aria-label="Remove" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) =>
            <tr key={i}>
                  {fields.map((f) =>
              <td key={f.name} className="px-1.5 py-1.5">
                      <input
                  value={r[f.name]}
                  onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, [f.name]: e.target.value } : x))}
                  inputMode={f.type === 'number' ? 'decimal' : undefined}
                  placeholder={f.description || ''}
                  aria-label={`${f.name} row ${i + 1}`}
                  className={field} />
                    </td>
              )}
                  <td className="px-1">
                    <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove row ${i + 1}`}
                className="cursor-pointer rounded p-1 text-ink-400 hover:bg-canvas hover:text-ink-900">
                      <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </button>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
          {rows.length < request.max_items &&
        <button type="button" onClick={() => setRows([...rows, blank()])}
        className="m-2 inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">
              <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Add a row
            </button>
        }
        </div>
      }

      <div className="mt-3 space-y-2">
        {uploads.map((u, i) =>
        <div key={u.file} className="flex items-start gap-3 rounded-lg border border-line bg-panel p-3">
            <FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-ink-900">{u.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-700">{u.preview}</p>
            </div>
            <button type="button" onClick={() => setUploads(uploads.filter((_, j) => j !== i))} aria-label={`Remove ${u.name}`}
          className="cursor-pointer rounded p-1 text-ink-400 hover:bg-canvas hover:text-ink-900">
              <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={uploading} onClick={() => picker.current?.click()}
          className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500 disabled:cursor-wait disabled:opacity-60">
            <UploadIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> {uploading ? 'Uploading…' : 'Upload a file'}
          </button>
          <span className="text-[11px] text-ink-500">
            A CSV{fields.length ? ` with columns ${fields.map((f) => f.name).join(', ')}` : ''} becomes rows; pages, PDFs and text are read by the task.
          </span>
          <input ref={picker} type="file" accept={ACCEPT} multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={50000}
        placeholder="Or paste what you found (optional)" aria-label="Pasted text" className={`${field} resize-y`} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000}
        placeholder="Anything the task should know (optional)" aria-label="Notes" className={`${field} resize-y`} />
      </div>

      {error &&
      <p role="alert" className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">{error}</p>
      }

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy !== null} onClick={decline}
        className="cursor-pointer rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">
          {busy === 'decline' ? 'Sending…' : 'I couldn’t collect it'}
        </button>
        <button type="button" disabled={busy !== null || uploading || !hasSomething} onClick={send}
        className="cursor-pointer rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
          {busy === 'send' ? 'Sending…' : `Send${filled.length ? ` ${filled.length} row${filled.length === 1 ? '' : 's'}` : ''} and continue`}
        </button>
      </div>
    </section>);

}
