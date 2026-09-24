'use client';

import { useState } from 'react';
import {
  CheckIcon,
  ChevronRightIcon,
  CircleDotIcon,
  FlagIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon } from
'lucide-react';
import type { TimelineEvent } from '@/lib/types';
import type { TimelineState } from '@/lib/useTaskTimeline';

/**
 * The live step timeline (P1-16).
 *
 * RENDERED PURELY FROM THE EVENT STREAM. It is handed events and reads nothing
 * else — not the task, not its steps. That is the stated exit criterion, and it
 * is also the honest thing: the runtime's own claim is that the timeline and
 * the audit trail are projections of the log, and a component that quietly
 * joined against `task.steps` would make that claim untestable.
 *
 * It shows what happened, in the order it happened, including the parts a
 * step-shaped view would drop: a proposal the policy engine denied, a plan
 * revision, a step that ran twice. After a replan the step rows describe the
 * CURRENT plan, while the log still describes what actually ran — and this
 * shows the latter.
 */

/**
 * How each event type reads on a timeline. Unknown types fall through to
 * FALLBACK rather than disappearing — a type this console has not been taught
 * about is still something that happened, and hiding it would make the panel
 * quietly lie about being the whole log.
 *
 * Only tokens that exist in globals.css: Tailwind v4 has no JS config, so a
 * `text-ok-500` that is not declared in @theme renders as no colour at all.
 */
const CHROME: Record<string, { icon: typeof CheckIcon; tone: string }> = {
  'task.created': { icon: FlagIcon, tone: 'text-ink-500' },
  'task.planning': { icon: CircleDotIcon, tone: 'text-brand-700' },
  'task.started': { icon: PlayIcon, tone: 'text-brand-700' },
  'task.resumed': { icon: PlayIcon, tone: 'text-brand-700' },
  'task.paused': { icon: PauseIcon, tone: 'text-ink-700' },
  'task.suspended': { icon: PauseIcon, tone: 'text-warn-700' },
  'task.finished': { icon: CheckIcon, tone: 'text-ok-700' },
  'task.failed': { icon: TriangleAlertIcon, tone: 'text-danger-700' },
  'task.cancelled': { icon: XIcon, tone: 'text-ink-500' },
  'plan.created': { icon: CircleDotIcon, tone: 'text-brand-700' },
  'plan.revised': { icon: CircleDotIcon, tone: 'text-warn-700' },
  'step.proposed': { icon: ChevronRightIcon, tone: 'text-ink-500' },
  'policy.decided': { icon: ShieldCheckIcon, tone: 'text-ink-500' },
  'step.started': { icon: PlayIcon, tone: 'text-brand-600' },
  observation: { icon: CheckIcon, tone: 'text-ok-700' },
  'step.failed': { icon: TriangleAlertIcon, tone: 'text-danger-700' },
  'step.escalated': { icon: ChevronRightIcon, tone: 'text-warn-700' },
  verification: { icon: ShieldCheckIcon, tone: 'text-ok-700' },
  'approval.requested': { icon: ShieldCheckIcon, tone: 'text-warn-700' },
  'device.required': { icon: TriangleAlertIcon, tone: 'text-warn-700' },
  'device.available': { icon: PlayIcon, tone: 'text-brand-700' },
  // §8.4's auditable crossing. Given its own chrome rather than the fallback
  // dot because "a document left your computer" is the one line on this
  // timeline a privacy-minded person is actually scanning for.
  'device.contents': { icon: UploadIcon, tone: 'text-warn-700' },
};

const FALLBACK = { icon: CircleDotIcon, tone: 'text-ink-500' };

const time = (iso: string) =>
new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Events worth opening: the ones carrying something a person would read. */
const hasDetail = (e: TimelineEvent) =>
e.type === 'observation' ||
e.type === 'step.proposed' ||
e.type === 'step.failed' ||
e.type === 'task.failed';

function Status({ state, error }: {state: TimelineState;error: string | null;}) {
  if (state === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok-600 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok-600" />
        </span>
        Live
      </span>);

  }
  if (state === 'reconnecting') {
    return (
      <span className="text-[11px] text-warn-700" title={error || undefined}>
        Reconnecting…
      </span>);

  }
  if (state === 'ended') {
    return <span className="text-[11px] text-ink-400">Stream closed</span>;
  }
  if (state === 'error') {
    return <span className="text-[11px] text-danger-700">{error}</span>;
  }
  return <span className="text-[11px] text-ink-400">Connecting…</span>;
}

export function TaskTimeline({
  events,
  state,
  error




}: {events: TimelineEvent[];state: TimelineState;error: string | null;}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-ink-500">
          {events.length} event{events.length === 1 ? '' : 's'}
        </p>
        <Status state={state} error={error} />
      </div>

      {state === 'loading' && events.length === 0 &&
      <p className="py-8 text-center text-[12px] text-ink-500">Loading the timeline…</p>
      }

      {state === 'error' && events.length === 0 &&
      <p className="py-8 text-center text-[12px] text-danger-700">{error}</p>
      }

      <ol className="relative">
        {events.map((event, i) =>
        <Row key={event.seq} event={event} last={i === events.length - 1} />
        )}
      </ol>
    </div>);

}

function Row({ event, last }: {event: TimelineEvent;last: boolean;}) {
  const [open, setOpen] = useState(false);
  const chrome = CHROME[event.type] ?? FALLBACK;
  const Icon = chrome.icon;
  const openable = hasDetail(event);

  return (
    <li className="relative flex gap-3 pb-3">
      {/* The rail. Stops at the last event so a finished task does not look
          like it is still going. */}
      {!last &&
      <span className="absolute left-[11px] top-6 h-full w-px bg-line" aria-hidden="true" />
      }

      <span
        className={`relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-line bg-panel ${chrome.tone}`}>

        <Icon className="h-3 w-3" strokeWidth={2.4} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <button
            type="button"
            onClick={() => openable && setOpen(!open)}
            aria-expanded={openable ? open : undefined}
            className={`min-w-0 text-left ${openable ? 'cursor-pointer' : 'cursor-default'}`}>

            <p className={`truncate text-[13px] ${chrome.tone}`}>{event.summary}</p>
            <p className="mt-0.5 font-mono text-[10px] text-ink-400">
              {event.type}
              {event.stepKey ? ` · ${event.stepKey}` : ''}
              {openable ? (open ? ' · hide' : ' · detail') : ''}
            </p>
          </button>
          <span className="tabular shrink-0 text-[11px] text-ink-400">{time(event.at)}</span>
        </div>

        {open && openable &&
        <pre className="mt-2 max-h-64 overflow-auto rounded border border-line bg-canvas p-2.5 font-mono text-[11px] leading-relaxed text-ink-700">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        }
      </div>
    </li>);

}
