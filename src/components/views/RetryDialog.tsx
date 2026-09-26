'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, tasksApi } from '@/lib/api';

/**
 * Retry a task as a new attempt, optionally reworded and with a note.
 *
 * `active` means the original is still running: the retry will stop it first,
 * and the dialog says so before anything happens.
 */
export function RetryDialog({
  taskId,
  objective,
  active,
  edit,
  onClose,
  onRetried







}: {taskId: string;objective: string;active: boolean;edit: boolean;onClose: () => void;onRetried: (newTaskId: string) => void;}) {
  const [text, setText] = useState(objective);
  const [note, setNote] = useState('');
  const [learn, setLearn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLTextAreaElement | HTMLButtonElement | null>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (edit && !text.trim()) return setError('Describe the task.');
    setBusy(true);
    setError(null);
    try {
      const created = await tasksApi.retry(taskId, {
        ...(edit && text.trim() !== objective ? { objective: text.trim() } : {}),
        ...(edit && note.trim() ? { note: note.trim() } : {}),
        learn,
        ...(active ? { stop_current: true } : {})
      });
      onRetried(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start the retry.');
      setBusy(false);
    }
    return undefined;
  }

  const field =
  'mt-1.5 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[13px] leading-relaxed text-ink-900 focus:border-brand-500 focus:bg-panel focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="retry-title"
      onMouseDown={(e) => {if (e.target === e.currentTarget && !busy) onClose();}}>
      
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-pop">
        <h2 id="retry-title" className="text-[17px] font-semibold tracking-tight text-ink-900">
          {edit ? 'Edit and retry' : 'Retry this task'}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          This starts a new attempt. The current one stays as it is, so you can compare them.
        </p>

        {active &&
        <p className="mt-4 rounded-md border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] leading-relaxed text-warn-700">
            This task is still running. Retrying will stop it first, so the two do not both do
            the work.
          </p>
        }

        {edit &&
        <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="retry-objective" className="block text-[12px] font-medium text-ink-900">Task</label>
              <textarea
              id="retry-objective"
              ref={(el) => {first.current = el;}}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`${field} resize-y`} />
            
            </div>
            <div>
              <label htmlFor="retry-note" className="block text-[12px] font-medium text-ink-900">
                Note for this attempt <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <textarea
              id="retry-note"
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. The Abuja site blocks automated requests — use the NNPC price board instead."
              className={`${field} resize-y`} />
            
            </div>
          </div>
        }

        <label htmlFor="retry-learn" className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-700">
          <input
            id="retry-learn"
            type="checkbox"
            checked={learn}
            onChange={(e) => setLearn(e.target.checked)}
            className="mt-1 h-3.5 w-3.5 accent-brand-600" />
          
          <span>
            <span className="font-medium text-ink-900">Learn from the last attempt</span>
            <span className="block text-[12px] text-ink-500">
              Tells the planner what was tried, what failed and why, what was found, and what
              already happened — so it does not repeat mistakes or send the same email twice.
            </span>
          </span>
        </label>

        {error &&
        <p role="alert" className="mt-4 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
            {error}
          </p>
        }

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-line px-3 py-2 text-[13px] font-medium text-ink-700 hover:bg-canvas">
            
            Cancel
          </button>
          <button
            type="submit"
            ref={edit ? undefined : (el) => {first.current = el;}}
            disabled={busy}
            className="rounded-md bg-brand-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-brand-500 disabled:opacity-60">
            
            {busy ? 'Starting…' : active ? 'Stop and retry' : 'Start retry'}
          </button>
        </div>
      </form>
    </div>);

}
