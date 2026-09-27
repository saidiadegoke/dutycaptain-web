'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2Icon, ClockIcon, RotateCcwIcon, SendIcon, XCircleIcon } from 'lucide-react';
import { ApiError, tasksApi } from '@/lib/api';
import type { Delivery } from '@/lib/types';
import { ago } from '@/utils/format';

const LABEL: Record<Delivery['status'], string> = {
  pending: 'Queued',
  waiting_approval: 'Waiting for your approval',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Failed',
  denied: 'Not sent — you declined',
  expired: 'Not sent — the approval expired'
};

const TRIGGER: Record<Delivery['trigger'], string> = {
  completion: 'when the task finished',
  step: 'by a step',
  resend: 'resent by you',
  test: 'test'
};

function Icon({ status }: {status: Delivery['status'];}) {
  if (status === 'sent') return <CheckCircle2Icon className="h-4 w-4 shrink-0 text-ok-600" strokeWidth={2.2} />;
  if (status === 'waiting_approval' || status === 'pending' || status === 'sending') return <ClockIcon className="h-4 w-4 shrink-0 text-warn-600" strokeWidth={2.2} />;
  return <XCircleIcon className="h-4 w-4 shrink-0 text-danger-600" strokeWidth={2.2} />;
}

/**
 * Where the task sent its result, and what came back. Each send is listed;
 * a failed or declined one can be sent again with one click.
 */
export function Deliveries({ taskId, deliveries, pendingTo, onChanged }: {
  taskId: string;
  deliveries: Delivery[];
  /** The endpoint the result will go to when the task finishes, if it has not yet. */
  pendingTo?: string | null;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  if (!deliveries.length && !pendingTo) return null;

  async function resend(d: Delivery) {
    setBusy(d.id);
    setError(null);
    try {
      await tasksApi.resendDelivery(taskId, d.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send it again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4">
      <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700">
        <SendIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> Sent to
      </h3>
      {error && <p role="alert" className="mt-2 text-[12px] text-danger-700">{error}</p>}
      {pendingTo && !deliveries.some((d) => d.trigger === 'completion') &&
      <p className="mt-2 text-[12px] text-ink-500">
          The result will be sent to <span className="font-mono text-ink-900">{pendingTo}</span> when the task finishes.
        </p>
      }
      <ul className="mt-2 space-y-2">
        {deliveries.map((d) => {
          const status = d.response?.status;
          const canResend = ['sent', 'failed', 'denied', 'expired'].includes(d.status) && d.endpoint_id;
          const reply = d.response && (d.response.json !== undefined ? JSON.stringify(d.response.json, null, 2) : d.response.body);
          return (
            <li key={d.id} className="rounded-lg border border-line bg-panel">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Icon status={d.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink-900">
                    <span className="font-mono font-medium">{d.endpoint_name || 'a deleted endpoint'}</span>
                    <span className="text-ink-500"> · {LABEL[d.status]}{status ? ` (HTTP ${status})` : ''}</span>
                  </p>
                  <p className="text-[11px] text-ink-500">
                    {TRIGGER[d.trigger]} · {ago(d.sent_at || d.created_at)}
                    {d.request?.method && d.request?.url ? ` · ${d.request.method} ${d.request.url}` : ''}
                  </p>
                  {d.error && d.status !== 'denied' && d.status !== 'expired' && <p className="mt-1 text-[12px] text-danger-700">{d.error}</p>}
                </div>
                {d.status === 'waiting_approval' && d.approval_id &&
                <Link href={`/app/approvals?approval=${d.approval_id}`} className="rounded-md bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-ink-800">
                    Review
                  </Link>
                }
                {reply &&
                <button type="button" onClick={() => setOpen(open === d.id ? null : d.id)} className="cursor-pointer rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">
                    {open === d.id ? 'Hide reply' : 'Reply'}
                  </button>
                }
                {canResend &&
                <button type="button" disabled={busy === d.id} onClick={() => resend(d)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-canvas disabled:opacity-60">
                    <RotateCcwIcon className="h-3.5 w-3.5" strokeWidth={2.2} /> {busy === d.id ? 'Sending…' : 'Send again'}
                  </button>
                }
              </div>
              {open === d.id && reply &&
              <pre className="max-h-48 overflow-auto border-t border-line bg-canvas px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-700">{reply}</pre>
              }
            </li>);

        })}
      </ul>
    </div>);

}
