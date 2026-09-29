'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2Icon, ClipboardListIcon } from 'lucide-react';
import { ApiError, answerApi } from '@/lib/api';
import type { AnswerView } from '@/lib/types';
import { RowsEditor, filledRows, startRows, visible } from '@/components/collect/RowsEditor';

const box = 'w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

/**
 * What a colleague sees when they open their link: who asked, what is needed
 * and how, and a table to fill in — nothing else of the task. They answer
 * once; the task takes it from there.
 */
export function AnswerPage() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<AnswerView | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<'answered' | 'declined' | null>(null);

  useEffect(() => {
    answerApi.view(token).then((v) => {
      setView(v);
      // Gap rows carry `_gap`/`_about`; the page keeps them on the row it sends.
      const fields = [...(v.request.gaps ? [{ name: '_gap', type: 'number' as const }, { name: '_about', type: 'string' as const }] : []), ...v.request.fields];
      setRows(startRows(fields, v.request.prefill));
    }).catch((err) => setError(err instanceof ApiError ? err.message : 'This link could not be opened.'));
  }, [token]);

  if (error && !view) return <Shell><p role="alert" className="text-[14px] text-danger-700">{error}</p></Shell>;
  if (!view) return <Shell><p className="text-[13px] text-ink-500">Loading…</p></Shell>;
  const r = view.request;
  const fields = [...(r.gaps ? [{ name: '_gap', type: 'number' as const }, { name: '_about', type: 'string' as const }] : []), ...r.fields];
  const filled = filledRows(rows, fields);

  async function submit(decline: boolean) {
    setBusy(true);
    setError(null);
    try {
      await answerApi.send(token, decline ? { decline: true, notes: notes.trim() || undefined } : {
        ...(filled.length ? { records: filled } : {}),
        ...(text.trim() ? { text: text.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setSent(decline ? 'declined' : 'answered');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send it.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-[16px] font-semibold text-ink-900"><CheckCircle2Icon className="h-5 w-5 text-ok-700" /> Thank you{sent === 'answered' ? ' — your answer was received' : ''}.</p>
        <p className="mt-2 text-[13px] text-ink-500">{view.task.asked_by} will see it with the task. You can close this page.</p>
      </Shell>);
  }

  return (
    <Shell>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-warn-700">
        <ClipboardListIcon className="h-3.5 w-3.5" /> {view.task.asked_by} asked you{r.gaps ? ' to fill in a few things' : ''}
      </p>
      <h1 className="mt-2 whitespace-pre-line text-[18px] font-semibold leading-snug text-ink-900">{r.instructions}</h1>
      {view.task.objective && <p className="mt-1 text-[12px] text-ink-500">For: {view.task.objective}</p>}
      <p className="mt-1 text-[12px] text-ink-500">Open until {new Date(r.deadline).toLocaleString()}.</p>

      {!view.open ?
      <p className="mt-4 rounded-md border border-line bg-canvas px-3 py-2 text-[13px] text-ink-700">This request is closed{r.status === 'pending' ? ' for you — you already answered' : ''}. Thank you.</p> :
      <>
          {r.guide?.steps && r.guide.steps.length > 0 &&
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink-900">
              {r.guide.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
        }
          {r.guide?.where && r.guide.where.length > 0 && <p className="mt-2 text-[12px] text-ink-700">Where: {r.guide.where.join(', ')}</p>}
          {visible(fields).length > 0 && <dl className="mt-3 space-y-1 text-[12px]">
            {r.fields.map((f) => <div key={f.name}><dt className="inline font-mono font-medium text-ink-900">{f.name}</dt>{f.description && <dd className="inline text-ink-700"> — {f.description}</dd>}</div>)}
          </dl>}

          <RowsEditor fields={fields} rows={rows} setRows={setRows} maxItems={r.max_items} gaps={r.gaps} />
          <div className="mt-3 space-y-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={50000} placeholder="Or paste what you found (optional)" aria-label="Pasted text" className={`${box} resize-y`} />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} placeholder="Anything they should know (optional)" aria-label="Notes" className={`${box} resize-y`} />
          </div>
          {error && <p role="alert" className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => submit(true)} className="cursor-pointer rounded-md border border-line bg-panel px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">I can’t help with this</button>
            <button type="button" disabled={busy || (!filled.length && !text.trim())} onClick={() => submit(false)} className="cursor-pointer rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </>
      }
    </Shell>);

}

function Shell({ children }: {children: React.ReactNode;}) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-xl border border-line bg-panel p-6 shadow-sm">
        {children}
        <p className="mt-6 border-t border-line pt-3 text-[11px] text-ink-400">Sent through DutyCaptain. This link is only for you.</p>
      </div>
    </main>);
}
