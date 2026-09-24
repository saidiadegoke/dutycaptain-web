'use client';

import { useEffect, useState } from 'react';
import {
  ArrowUpRightIcon,
  CheckIcon,
  RotateCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserCheckIcon,
  XIcon } from
'lucide-react';
import { tasksApi, ApiError } from '@/lib/api';
import type { AuditChain as Chain, AuditTrailResponse } from '@/lib/types';

/**
 * The audit trail (P3-09) — proposal → policy → approval → execution.
 *
 * THIS IS NOT A LOG VIEWER. The timeline already shows what happened in order.
 * What an audit has to answer is the question a log cannot: **did what ran
 * match what was approved?** §7.1 asks for every grant to be recorded with who,
 * when and what argument hash, and a hash that is stored and never compared is
 * decoration. So each chain leads with that verdict.
 *
 * "CANNOT TELL" IS ITS OWN ANSWER, shown differently from "no". One of the two
 * fingerprints missing means nobody can say either way, and an audit that
 * reported a mismatch when it meant uncertainty would send somebody chasing an
 * incident that did not happen.
 *
 * Read from the EVENT LOG rather than the step rows: the rows hold the current
 * state, and an audit is about what happened — including the attempt that was
 * later retried over and the arguments a repair replaced.
 */

const time = (iso: string) =>
new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function Verdict({ chain }: {chain: Chain;}) {
  if (!chain.approval.requested) return null;

  if (chain.approvalMatched === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-ok-100 bg-ok-50 px-1.5 py-0.5 text-[10px] text-ok-700">
        <ShieldCheckIcon className="h-3 w-3" strokeWidth={2.4} />
        ran as approved
      </span>);

  }
  if (chain.approvalMatched === false) {
    // The failure the whole phase exists to prevent: approved for one thing,
    // executed against another.
    return (
      <span className="inline-flex items-center gap-1 rounded border border-danger-100 bg-danger-50 px-1.5 py-0.5 text-[10px] text-danger-700">
        <TriangleAlertIcon className="h-3 w-3" strokeWidth={2.4} />
        ran with DIFFERENT arguments
      </span>);

  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-ink-500">
      <ShieldAlertIcon className="h-3 w-3" strokeWidth={2.4} />
      cannot be confirmed
    </span>);

}

function Link_({ label, detail, at, tone = 'text-ink-700', icon: Icon }: {
  label: string;detail?: string | null;at?: string;tone?: string;icon: typeof CheckIcon;
}) {
  return (
    <li className="flex gap-2.5">
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center ${tone}`}>
        <Icon className="h-3 w-3" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-[12px] ${tone}`}>{label}</p>
          {at && <span className="tabular shrink-0 text-[10px] text-ink-400">{time(at)}</span>}
        </div>
        {detail && <p className="mt-0.5 break-words text-[11px] leading-snug text-ink-500">{detail}</p>}
      </div>
    </li>);

}

function ChainCard({ chain }: {chain: Chain;}) {
  const [open, setOpen] = useState(false);
  const decided = chain.decided?.payload;
  const asked = chain.approval.requested?.payload;
  const answered = chain.approval.answered;

  return (
    <li className="rounded-lg border border-line bg-canvas px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-900">
            {chain.title || chain.stepKey}
          </p>
          <p className="font-mono text-[10px] text-ink-400">
            {chain.stepKey} · {chain.capability}
          </p>
        </div>
        <Verdict chain={chain} />
      </div>

      <ol className="mt-2.5 space-y-1.5">
        {chain.proposed &&
        <Link_
          icon={ArrowUpRightIcon}
          label="The model proposed it"
          detail={chain.proposed.payload.rationale || null}
          at={chain.proposed.created_at} />
        }

        {decided &&
        <Link_
          icon={decided.decision === 'deny' ? XIcon : ShieldCheckIcon}
          tone={
          decided.decision === 'deny' ?
          'text-danger-700' :
          decided.decision === 'approve' ?
          'text-warn-700' :
          'text-ink-700'
          }
          label={`Policy said ${decided.decision}`}
          detail={[decided.policy, decided.reason].filter(Boolean).join(' — ') || null}
          at={chain.decided!.created_at} />
        }

        {asked &&
        <Link_
          icon={UserCheckIcon}
          tone="text-warn-700"
          label="It asked you"
          detail={asked.reason || null}
          at={chain.approval.requested!.created_at} />
        }

        {answered &&
        <Link_
          icon={answered.type === 'approval.granted' ? CheckIcon : XIcon}
          tone={answered.type === 'approval.granted' ? 'text-ok-700' : 'text-danger-700'}
          label={
          answered.payload.expired ?
          'Nobody answered, and it expired' :
          answered.type === 'approval.granted' ?
          `You allowed it (${answered.payload.scope || 'once'})` :
          'You declined it'
          }
          detail={answered.payload.note || answered.payload.reason || null}
          at={answered.created_at} />
        }

        {chain.recovery.map((r) =>
        <Link_
          key={r.seq}
          icon={r.type === 'step.retried' ? RotateCwIcon : ArrowUpRightIcon}
          tone="text-warn-700"
          label={r.type === 'step.retried' ? 'Retried' : `Escalated level ${r.payload.from} → ${r.payload.to}`}
          detail={r.payload.reason || null}
          at={r.created_at} />
        )}

        {chain.started.map((st) =>
        <Link_
          key={st.seq}
          icon={CheckIcon}
          label={`It ran${st.payload.runtime ? ` on ${st.payload.runtime}` : ''}`}
          at={st.created_at} />
        )}

        {chain.observations.map((o) =>
        <Link_
          key={o.seq}
          icon={o.payload.status === 'failure' ? TriangleAlertIcon : CheckIcon}
          tone={o.payload.status === 'failure' ? 'text-danger-700' : 'text-ok-700'}
          label={o.payload.summary || 'It reported back'}
          at={o.created_at} />
        )}

        {chain.verification &&
        <Link_
          icon={chain.verification.payload.passed ? ShieldCheckIcon : ShieldAlertIcon}
          tone={chain.verification.payload.passed ? 'text-ok-700' : 'text-danger-700'}
          label={chain.verification.payload.passed ? 'It verified' : 'It did not verify'}
          detail={chain.verification.payload.detail || null}
          at={chain.verification.created_at} />
        }

        {chain.repair.map((r) =>
        <Link_
          key={r.seq}
          icon={ShieldAlertIcon}
          tone="text-warn-700"
          label={`Triage chose to ${r.payload.choice}`}
          detail={r.payload.reason || null}
          at={r.created_at} />
        )}
      </ol>

      {(chain.approvedHash || chain.executedHash) &&
      <>
          <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-2 text-[11px] text-ink-500 hover:text-ink-900">

            {open ? 'Hide' : 'Show'} the fingerprints
          </button>
          {open &&
        <dl className="mt-1.5 space-y-1 rounded border border-line bg-panel p-2 font-mono text-[10px]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-400">approved</dt>
                <dd className="truncate text-ink-700">{chain.approvedHash || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-400">executed</dt>
                <dd className="truncate text-ink-700">{chain.executedHash || '—'}</dd>
              </div>
            </dl>
        }
        </>
      }
    </li>);

}

export function AuditChain({ taskId, revision }: {taskId: string;revision: number;}) {
  const [data, setData] = useState<AuditTrailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    tasksApi.audit(taskId).
    then((d) => { if (!cancelled) setData(d); }).
    catch((err) => {
      if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the audit trail.');
    });
    return () => { cancelled = true; };
  }, [taskId, revision]);

  if (error) return <p className="text-[12px] text-danger-700">{error}</p>;
  if (!data) return <p className="text-[12px] text-ink-500">Loading…</p>;
  if (!data.steps.length) {
    return <p className="py-6 text-center text-[12px] text-ink-500">Nothing has been proposed yet.</p>;
  }

  const unmatched = data.steps.filter((c) => c.approvalMatched === false).length;

  return (
    <div>
      {unmatched > 0 &&
      <p className="mb-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">
          {unmatched} step{unmatched === 1 ? '' : 's'} ran with arguments that do not match what
          was approved. That should not be possible — worth investigating.
        </p>
      }
      <ul className="space-y-2.5">
        {data.steps.map((chain) => <ChainCard key={chain.stepKey} chain={chain} />)}
      </ul>
    </div>);

}
