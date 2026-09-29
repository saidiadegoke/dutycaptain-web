'use client';

import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  ClockIcon,
  MinusCircleIcon,
  RotateCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  XCircleIcon } from
'lucide-react';
import { CapabilityTag, StepStatusBadge } from '@/components/StatusBadge';
import type { Observation, Step } from '@/lib/types';

/** How long something took, the way a person says it: "4s", "2m 1s". */
export function duration(from?: string | null, to?: string | null): string | null {
  if (!from) return null;
  const ms = (to ? Date.parse(to) : Date.now()) - Date.parse(from);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** One icon per step state, as GitHub Actions marks its jobs. */
export function StepIcon({ step, className = 'h-4 w-4' }: {step: Step;className?: string;}) {
  const failedCheck = step.verification && !step.verification.passed;
  switch (step.status) {
    case 'done':
      return failedCheck ?
      <XCircleIcon className={`${className} shrink-0 text-danger-600`} strokeWidth={2.2} aria-label="did not verify" /> :
      <CheckCircle2Icon className={`${className} shrink-0 text-ok-600`} strokeWidth={2.2} aria-label="done" />;
    case 'partial':
      return <CheckCircle2Icon className={`${className} shrink-0 text-warn-600`} strokeWidth={2.2} aria-label="partly done" />;
    case 'failed':
      return <XCircleIcon className={`${className} shrink-0 text-danger-600`} strokeWidth={2.2} aria-label="failed" />;
    case 'running':
      return <CircleDashedIcon className={`${className} shrink-0 animate-spin text-brand-600 [animation-duration:2s]`} strokeWidth={2.2} aria-label="running" />;
    case 'waiting':
      return <ClockIcon className={`${className} shrink-0 text-warn-600`} strokeWidth={2.2} aria-label="waiting" />;
    case 'skipped':
    case 'cancelled':
      return <MinusCircleIcon className={`${className} shrink-0 text-ink-400`} strokeWidth={2.2} aria-label={step.status} />;
    case 'ready':
      return <CircleDotIcon className={`${className} shrink-0 text-ink-400`} strokeWidth={2.2} aria-label="ready" />;
    default:
      return <CircleIcon className={`${className} shrink-0 text-ink-400`} strokeWidth={2.2} aria-label="pending" />;
  }
}

/**
 * Everything one step did: its goal, what it observed (rendered, not
 * summarised away — the structured result is what the next step and the
 * verifier rely on), how it was checked, retries, cost and time.
 */
export function StepDetail({ step }: {step: Step;}) {
  const obs = step.observation as Observation | null;
  const trail = step.escalations || [];
  const retries = trail.filter((e) => e.kind === 'retry').length;
  const escalation = [...trail].reverse().find((e) => e.kind === 'escalate');
  const took = duration(step.started_at, step.finished_at);

  return (
    <div>
      <div className="flex items-start gap-3">
        <StepIcon step={step} className="mt-1 h-5 w-5" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink-900">{step.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StepStatusBadge status={step.status} />
            <CapabilityTag capability={step.capability} runtime={step.runtime} />
            {took && <span className="text-[11px] text-ink-500">{took}</span>}
            {retries > 0 &&
            <span className="inline-flex items-center gap-1 text-[11px] text-warn-700">
                <RotateCwIcon className="h-3 w-3" strokeWidth={2.4} /> {retries} retr{retries === 1 ? 'y' : 'ies'}
              </span>
            }
            {escalation &&
            <span className="inline-flex items-center gap-1 text-[11px] text-warn-700" title={escalation.reason}>
                <ArrowUpRightIcon className="h-3 w-3" strokeWidth={2.4} /> level {escalation.from} → {escalation.to}
              </span>
            }
            {step.attempt > 1 && retries === 0 && !escalation &&
            <span className="text-[11px] text-ink-400">attempt {step.attempt}</span>
            }
            {step.verification &&
            <span
              className={`inline-flex items-center gap-1 text-[11px] ${step.verification.passed ? 'text-ok-700' : 'text-danger-700'}`}
              title={step.verification.reason || undefined}>
                {step.verification.passed ?
              <ShieldCheckIcon className="h-3 w-3" strokeWidth={2.4} /> :
              <ShieldAlertIcon className="h-3 w-3" strokeWidth={2.4} />}
                {step.verification.passed ? 'verified' : 'did not verify'}
              </span>
            }
          </div>
          {step.depends_on.length > 0 &&
          <p className="mt-2 text-[12px] text-ink-500">
              Ran after <span className="font-mono">{step.depends_on.join(', ')}</span>
            </p>
          }
        </div>
      </div>

      {step.goal &&
      <div className="mt-5">
          <h3 className="text-[12px] font-semibold text-ink-700">What it was asked to do</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-800">{step.goal}</p>
        </div>
      }

      {obs ?
      <div className="mt-5">
          <h3 className="text-[12px] font-semibold text-ink-700">What happened</h3>
          <p className="mt-1 text-[13px] text-ink-800">{obs.summary}</p>

          {step.verification && !step.verification.passed &&
        <div className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5">
              <p className="text-[12px] font-medium text-danger-700">It ran without error and did not verify</p>
              <ul className="mt-1 space-y-0.5">
                {step.verification.checks.filter((c) => !c.passed).map((c) =>
            <li key={c.name} className="text-[12px] text-danger-700">
                    <span className="font-mono">{c.name}</span> — {c.detail}
                  </li>
            )}
              </ul>
            </div>
        }
          {obs.error &&
        <p className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5 text-[12px] text-danger-700">
              <span className="font-medium">{obs.error.code}</span> — {obs.error.message}
              {obs.error.retryable && <span className="text-ink-500"> (retryable)</span>}
            </p>
        }

          <details className="group mt-4 rounded-lg border border-line">
            <summary className="cursor-pointer select-none px-3.5 py-2.5 text-[12px] font-medium text-ink-700 hover:bg-canvas">
              Raw result
            </summary>
            <pre className="max-h-96 overflow-auto border-t border-line bg-canvas p-3 font-mono text-[11px] leading-relaxed text-ink-700">
              {JSON.stringify(obs.data, null, 2)}
            </pre>
          </details>

          <p className="mt-3 text-[11px] text-ink-400">
            {obs.runtime} · {obs.durationMs}ms
            {step.cost_usd ? ` · $${step.cost_usd.toFixed(5)}` : ''}
            {step.timings ? ` · ${step.timings.decideMs}ms deciding, ${step.timings.dispatchMs}ms running${
          step.timings.verifyMs ? `, ${step.timings.verifyMs}ms verifying` : ''}` : ''}
          </p>
        </div> :

      <p className="mt-5 text-[13px] text-ink-500">
          {step.status === 'running' ? 'Running now…' : step.status === 'skipped' ? 'Skipped — a step it depended on did not finish.' : 'Not run yet.'}
        </p>
      }
    </div>);

}
