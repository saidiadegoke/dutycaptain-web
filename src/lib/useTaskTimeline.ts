'use client';

import { useEffect, useRef, useState } from 'react';
import { tasksApi, streamTaskEvents, ApiError, type StreamHandle } from './api';
import type { TimelineEvent } from './types';

export type TimelineState = 'loading' | 'live' | 'reconnecting' | 'ended' | 'error';

/**
 * A task's timeline, from the event log and nothing else (P1-16).
 *
 * HISTORY FIRST, THEN THE STREAM, AND THE CURSOR JOINS THEM. A page that only
 * streams shows nothing for a task that finished before it opened; one that
 * only polls is not live. So it fetches the log, then attaches the stream
 * `after` the last sequence it received — which closes the window between the
 * two, where an event written mid-fetch would otherwise be missed by both.
 *
 * DEDUPED BY `seq`, because a reconnect can legitimately re-deliver. The stream
 * resumes from the last event the CLIENT saw, and if a frame arrived but its
 * handler had not run when the connection dropped, the server will send it
 * again — correctly. The set is what stops it rendering twice.
 *
 * This is the whole Phase 1 exit criterion: kill the browser mid-task, reopen,
 * and the timeline rebuilds. It rebuilds because nothing here holds state the
 * log does not — there is no in-memory model of "what the task is doing" to
 * lose, only events and the order they arrived in.
 */
export function useTaskTimeline(taskId: string) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [state, setState] = useState<TimelineState>('loading');
  const [error, setError] = useState<string | null>(null);

  // A ref, not state: it is consulted inside the stream callback, which closes
  // over whatever it saw when it was created. State here would compare against
  // a stale set and let duplicates through.
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let handle: StreamHandle | null = null;
    seen.current = new Set();
    setEvents([]);
    setState('loading');
    setError(null);

    (async () => {
      try {
        const history = await tasksApi.timeline(taskId);
        if (cancelled) return;

        history.events.forEach((e) => seen.current.add(e.seq));
        setEvents(history.events);
        setState('live');

        handle = streamTaskEvents(taskId, {
          onEvent: (event) => {
            if (cancelled || seen.current.has(event.seq)) return;
            seen.current.add(event.seq);
            // Appended, not sorted: the log is gapless and ordered, and a
            // reconnect resumes from a cursor rather than replaying. Sorting
            // would hide a real ordering bug rather than surface it.
            setEvents((prev) => [...prev, event]);
            setState('live');
          },
          onEnd: () => { if (!cancelled) setState('ended'); },
          onError: (err) => {
            if (cancelled) return;
            // The client reconnects on its own, so this is a notice rather than
            // a failure — the timeline keeps whatever it already has.
            setError(err.message);
            setState('reconnecting');
          },
        }, { after: history.last_seq });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not reach the API.');
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
      handle?.close();
    };
  }, [taskId]);

  return { events, state, error };
}
