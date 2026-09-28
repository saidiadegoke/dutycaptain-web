'use client';

import Link from 'next/link';
import { CheckIcon, MinusIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import type { Check, ScenarioResult } from '../core/types';

const MARK: Record<Check['status'], { icon: typeof CheckIcon; cls: string }> = {
  pass: { icon: CheckIcon, cls: 'text-ok-600' },
  fail: { icon: XIcon, cls: 'text-danger-600' },
  warn: { icon: TriangleAlertIcon, cls: 'text-warn-600' },
  skip: { icon: MinusIcon, cls: 'text-ink-400' },
};

const show = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v, null, 2));

/** What a scenario checked, what it logged, and every request it made. */
export function ResultPanel({ result }: {result: ScenarioResult;}) {
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {result.links.length > 0 &&
      <div className="flex flex-wrap gap-2">
          {result.links.map((l) =>
        <Link key={l.href} href={l.href} target="_blank" className="rounded-md border border-line px-2.5 py-1 text-[12px] font-medium text-brand-700 hover:bg-canvas">
              {l.label} ↗
            </Link>
        )}
        </div>
      }

      {result.error && <p className="rounded-md border border-danger-100 bg-danger-50 px-3 py-2 text-[12px] text-danger-700">{result.error}</p>}

      {result.checks.length > 0 &&
      <ul className="space-y-1.5">
          {result.checks.map((c, i) => {
          const m = MARK[c.status];
          return (
            <li key={i} className="flex items-start gap-2 text-[13px]">
                <m.icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${m.cls}`} strokeWidth={2.6} />
                <div className="min-w-0 flex-1">
                  <p className="text-ink-900">{c.name}</p>
                  {c.note && <p className="text-[12px] text-ink-500">{c.note}</p>}
                  {c.status !== 'pass' && (c.expected !== undefined || c.actual !== undefined) &&
                <div className="mt-1 grid gap-1 text-[11px] sm:grid-cols-2">
                      <pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-canvas px-2 py-1 font-mono text-ink-700"><span className="text-ink-400">expected </span>{show(c.expected)}</pre>
                      <pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-canvas px-2 py-1 font-mono text-ink-700"><span className="text-ink-400">actual </span>{show(c.actual)}</pre>
                    </div>
                }
                </div>
              </li>);

        })}
        </ul>
      }

      <details>
        <summary className="cursor-pointer text-[12px] font-medium text-ink-700">Log ({result.log.length})</summary>
        <pre className="mt-1.5 max-h-56 overflow-auto rounded-md bg-canvas p-2.5 font-mono text-[11px] leading-relaxed text-ink-700">{result.log.join('\n')}</pre>
      </details>

      <details>
        <summary className="cursor-pointer text-[12px] font-medium text-ink-700">Requests ({result.exchanges.length}) — the same calls the screens make</summary>
        <ul className="mt-1.5 space-y-1.5">
          {result.exchanges.map((e, i) =>
          <li key={i}>
              <details className="rounded-md border border-line">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-2.5 py-1.5 font-mono text-[11px]">
                  <span className="font-semibold text-ink-900">{e.method}</span>
                  <span className="min-w-0 flex-1 break-all text-ink-700">{e.path}</span>
                  <span className={e.status && e.status < 400 ? 'text-ok-700' : 'text-danger-700'}>{e.status ?? '—'}</span>
                  <span className="text-ink-400">{e.durationMs}ms</span>
                </summary>
                <div className="grid gap-2 border-t border-line p-2 sm:grid-cols-2">
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-ink-700">{e.requestBody === undefined ? '(no body)' : show(e.requestBody)}</pre>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-ink-700">{show(e.responseBody)}</pre>
                </div>
              </details>
            </li>
          )}
        </ul>
      </details>
    </div>);

}
