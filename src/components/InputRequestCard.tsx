'use client';

import { useRef, useState } from 'react';
import { ClipboardListIcon, DownloadIcon, FileTextIcon, UploadIcon, UsersIcon, XIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { InputRequest, SearchUpload } from '@/lib/types';
import { RowsEditor, filledRows, startRows, visible } from '@/components/collect/RowsEditor';

const ACCEPT = '.txt,.md,.csv,.html,.htm,.pdf';
const field = 'w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

/**
 * A step asking its owner to collect data — from their own logins, somewhere
 * offline — and hand it back. Rows in the columns the step asked for, pasted
 * text, or uploaded files (a CSV with those columns becomes rows); any mix.
 * The task carries on with what they send.
 */
export function InputRequestCard({ taskId, request, onDone }: {taskId: string;request: InputRequest;onDone: () => void;}) {
  const fields = request.fields;
  // Phase 6: a request for a step's gaps (rows fixed, pre-filled), and one
  // shared with colleagues or a pool (the owner may still answer).
  const gaps = Boolean(request.gaps);
  const shared = Boolean(request.audience && ((request.audience.people || []).length || request.audience.pool));
  const othersOnly = shared && !request.audience?.owner;
  const [answering, setAnswering] = useState(!othersOnly);
  const [rows, setRows] = useState(() => startRows(fields, request.guide?.prefill || []));
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [uploads, setUploads] = useState<SearchUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<'send' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const filled = filledRows(rows, fields);
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

  async function closeNow() {
    setBusy('send');
    setError(null);
    try {
      await tasksApi.closeInput(taskId, request.id);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not close it.');
      setBusy(null);
    }
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
        {othersOnly ? <UsersIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> : <ClipboardListIcon className="h-3.5 w-3.5" strokeWidth={2.2} />}
        {othersOnly ? `Waiting for ${askedNames(request)}` : gaps ? 'This task needs you to fill in what it could not get' : 'This task needs you to collect something'}
      </p>
      <p className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-snug text-ink-900">{request.instructions}</p>
      <p className="mt-1 text-[12px] text-ink-500">
        {othersOnly ? 'Each was sent a private link to answer. The rest of the task keeps running meanwhile.' : 'Use your own browser and accounts — nothing is shared with the AI but what you send here.'}
        {' '}Waiting until {expires.toLocaleString()}; {request.on_deadline === 'owner' ? 'after that it comes to you' : request.on_deadline === 'fail' ? 'after that the step fails' : 'after that the task continues with what came in'}.
      </p>

      {shared && request.people && <PeopleStatus request={request} />}
      {othersOnly &&
      <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy !== null || !(request.people?.answers.length)} onClick={closeNow}
        className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 text-[12px] font-medium text-ink-800 hover:bg-canvas disabled:opacity-60">
            Use what came in now
          </button>
          {!answering && <button type="button" onClick={() => setAnswering(true)} className="cursor-pointer text-[12px] font-medium text-brand-700 hover:text-brand-500">Answer it yourself</button>}
        </div>
      }

      {answering && <>
      <Guide request={{ ...request, fields: visible(fields) }} />

      <RowsEditor fields={fields} rows={rows} setRows={setRows} maxItems={request.max_items} gaps={gaps} />
      {visible(fields).length > 0 &&
      <p className="mx-2 mt-1 text-[11px] text-ink-500">
          {filled.length} row{filled.length === 1 ? '' : 's'}{gaps ? ` of ${rows.length} filled in` : ` · asked for ${request.min_items && request.min_items > 1 ? `${request.min_items} to ` : 'up to '}${request.max_items}`}
          {!gaps && request.min_items && filled.length > 0 && filled.length < request.min_items ? ' — fewer than asked; send anyway if that is all there is' : ''}
        </p>
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
        {!shared && !gaps &&
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
        }
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={50000}
        placeholder="Or paste what you found (optional)" aria-label="Pasted text" className={`${field} resize-y`} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000}
        placeholder="Anything the task should know (optional)" aria-label="Notes" className={`${field} resize-y`} />
      </div>

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
      </>}

      {error &&
      <p role="alert" className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">{error}</p>
      }
    </section>);

}

/** Who a shared request went to, in words. */
function askedNames(request: InputRequest) {
  const a = request.audience || {};
  const names = [...(a.people || []).map((p) => p.name), ...(a.pool ? [`the ${a.pool.name} pool`] : [])];
  return names.join(', ') || 'the people asked';
}

/** Who was asked, whether it reached them, and each answer as it arrives (phase 6). */
function PeopleStatus({ request }: {request: InputRequest;}) {
  const p = request.people;
  if (!p) return null;
  const answersFrom = (name: string) => p.answers.filter((a) => a.by.name === name);
  return (
    <div className="mt-3 rounded-lg border border-line bg-panel p-3 text-[12px]">
      <ul className="space-y-1">
        {p.asked.map((a) =>
        <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-ink-900">{a.to.kind === 'pool' ? `${a.to.name} (pool)` : a.to.name}</span>
            <span className={a.status === 'failed' ? 'text-danger-700' : 'text-ink-500'} title={a.error || undefined}>
              {a.status === 'failed' ? `could not be reached${a.error ? `: ${a.error}` : ''}` :
            a.to.kind === 'pool' ? `${p.answers.filter((x) => x.by.kind === 'pool').length} answer(s) so far` :
            a.status === 'answered' ? `answered — ${answersFrom(a.to.name).reduce((n, x) => n + x.records, 0)} row(s)` :
            a.status === 'declined' ? 'could not help' :
            a.opened_at ? 'opened the link' : a.sent === 'skipped (simulation)' ? 'link ready (simulation — not emailed)' : 'sent'}
            </span>
          </li>
        )}
      </ul>
      {p.answers.filter((a) => a.by.kind === 'pool').length > 0 &&
      <p className="mt-2 text-ink-500">From the pool: {p.answers.filter((a) => a.by.kind === 'pool').map((a) => `${a.by.name} (${a.records})`).join(', ')}</p>
      }
    </div>);

}

/** A CSV template: the columns asked for, and the sample row. */
function templateCsv(request: InputRequest): string {
  const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const cols = request.fields.map((f) => f.name);
  const sample = request.guide?.examples?.[0] || {};
  return `${cols.map(esc).join(',')}\n${cols.map((c) => esc(String(sample[c] ?? ''))).join(',')}\n`;
}

function downloadTemplate(request: InputRequest) {
  const blob = new Blob([templateCsv(request)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const isUrl = (s: string) => /^https?:\/\//i.test(s);

/** How to do it, where, what each column means, and what one row looks like. */
function Guide({ request }: {request: InputRequest;}) {
  const guide = request.guide;
  const sample = guide?.examples?.[0];
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-line bg-panel p-4 md:grid-cols-2">
      {guide?.steps && guide.steps.length > 0 &&
      <div>
          <h3 className="text-[12px] font-semibold text-ink-700">How to do it</h3>
          <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink-900">
            {guide.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          {guide.where.length > 0 &&
        <p className="mt-2 text-[12px] text-ink-700">
              Where:{' '}
              {guide.where.map((w, i) =>
          <span key={i}>{i > 0 && ', '}{isUrl(w) ?
            <a href={w} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline hover:text-brand-500">{w}</a> :
            w}</span>
          )}
            </p>
        }
        </div>
      }
      {request.fields.length > 0 &&
      <div>
          <h3 className="text-[12px] font-semibold text-ink-700">What to send — one row each</h3>
          <dl className="mt-1.5 space-y-1.5 text-[12px]">
            {request.fields.map((f) =>
          <div key={f.name}>
                <dt className="inline font-mono font-medium text-ink-900">{f.name}</dt>
                <span className="text-ink-400"> · {f.type}</span>
                {f.description && <dd className="inline text-ink-700"> — {f.description}</dd>}
                {f.example && <dd className="text-ink-500">e.g. <span className="font-mono text-ink-700">{f.example}</span></dd>}
              </div>
          )}
          </dl>
          <p className="mt-2 text-[12px] text-ink-500">
            How many: {request.min_items && request.min_items > 1 ? `${request.min_items} to ${request.max_items}` : `up to ${request.max_items}`} rows.
          </p>
        </div>
      }
      {sample &&
      <div className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[12px] font-semibold text-ink-700">Example</h3>
            <button type="button" onClick={() => downloadTemplate(request)}
          className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">
              <DownloadIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Download a CSV template
            </button>
          </div>
          <div className="mt-1.5 overflow-x-auto rounded-md border border-line">
            <table className="w-full text-[12px]">
              <thead className="bg-canvas">
                <tr>{request.fields.map((f) => <th key={f.name} className="px-2.5 py-1.5 text-left font-semibold text-ink-700">{f.name}</th>)}</tr>
              </thead>
              <tbody>
                <tr>{request.fields.map((f) => <td key={f.name} className="px-2.5 py-1.5 font-mono text-ink-700">{sample[f.name] ?? ''}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink-500">
            Send it any of these ways: fill the table below; upload a CSV with these columns (it becomes rows); or upload/paste a page, PDF or text and the task reads it.
          </p>
        </div>
      }
    </div>);

}
