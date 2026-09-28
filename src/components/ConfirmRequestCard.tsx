'use client';

import { useState } from 'react';
import { HelpCircleIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { InputRequest } from '@/lib/types';

const field = 'w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

/**
 * A question only the owner can answer: did something happen? Either a send
 * whose outcome DutyCaptain couldn't tell (a timeout after the request left),
 * or a step on another system a restart cut off. Nothing is repeated until
 * they say — repeating blind is how a result arrives twice.
 */
export function ConfirmRequestCard({ taskId, request, onDone }: {taskId: string;request: InputRequest;onDone: () => void;}) {
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSend = request.subject?.type === 'delivery';
  const guide = request.guide;

  async function answer(happened: boolean) {
    setBusy(happened ? 'yes' : 'no');
    setError(null);
    try {
      await tasksApi.confirmInput(taskId, request.id, {
        happened,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {})
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your answer.');
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-warn-100 bg-warn-50/50 p-5">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-warn-700">
        <HelpCircleIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> {isSend ? 'Did it arrive?' : 'Did this happen?'}
      </p>
      <p className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-snug text-ink-900">{request.instructions}</p>

      {guide && (guide.steps?.length || guide.where?.length || guide.sample) &&
      <div className="mt-4 space-y-3 rounded-lg border border-line bg-panel p-4">
          {guide.steps?.length > 0 &&
        <div>
              <h3 className="text-[12px] font-semibold text-ink-700">How to check</h3>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[13px] text-ink-900">
                {guide.steps.map((s, i) => <li key={i} className="break-words">{s}</li>)}
              </ol>
            </div>
        }
          {guide.where?.length > 0 &&
        <p className="text-[12px] text-ink-700"><span className="font-semibold">Where: </span><span className="break-all font-mono">{guide.where.join(', ')}</span></p>
        }
          {guide.sample &&
        <div>
              <h3 className="text-[12px] font-semibold text-ink-700">{isSend ? 'What was sent' : 'What the step was doing'}</h3>
              <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md border border-line bg-canvas p-2.5 font-mono text-[11px] text-ink-700">{guide.sample}</pre>
            </div>
        }
        </div>
      }

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[12px] font-medium text-ink-700">
          Reference <span className="font-normal text-ink-400">(optional — an order number, a record id)</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={300} className={`${field} mt-1`} />
        </label>
        <label className="block text-[12px] font-medium text-ink-700">
          Notes <span className="font-normal text-ink-400">(optional)</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} className={`${field} mt-1`} />
        </label>
      </div>

      {error && <p className="mt-3 text-[12px] text-danger-600">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy !== null} onClick={() => answer(true)}
        className="cursor-pointer rounded-md bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-500 disabled:cursor-default disabled:opacity-60">
          {busy === 'yes' ? 'Saving…' : isSend ? 'Yes, it arrived' : 'Yes, it happened'}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => answer(false)}
        className="cursor-pointer rounded-md border border-line bg-panel px-3.5 py-2 text-[13px] font-semibold text-ink-900 hover:bg-canvas disabled:cursor-default disabled:opacity-60">
          {busy === 'no' ? 'Saving…' : isSend ? 'No — send it again' : 'No — run it again'}
        </button>
        <span className="text-[12px] text-ink-500">Waiting until {new Date(request.expires_at).toLocaleString()}.</span>
      </div>
    </section>);

}
