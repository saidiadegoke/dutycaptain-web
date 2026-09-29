'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import type { InputRequest } from '@/lib/types';

export type Row = Record<string, string>;
type Field = InputRequest['fields'][number];

const cell = 'w-full rounded-md border border-line bg-panel px-2.5 py-1.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';

/** Fields a person fills in: `_gap` and `_about` are the task's own (phase 6 gap rows). */
export const visible = (fields: Field[]) => fields.filter((f) => !f.name.startsWith('_'));

/** Starting rows: the gaps, pre-filled with what was found (phase 6), or three blanks. */
export function startRows(fields: Field[], prefill: Record<string, unknown>[] = []): Row[] {
  const blank = (): Row => Object.fromEntries(fields.map((f) => [f.name, '']));
  if (prefill.length) {
    return prefill.map((p) => Object.fromEntries(fields.map((f) => [f.name, p[f.name] === null || p[f.name] === undefined ? '' : String(p[f.name])])));
  }
  return visible(fields).length ? [blank(), blank(), blank()] : [];
}

/** Rows with something in them — a gap row counts only when a value a person fills is set. */
export const filledRows = (rows: Row[], fields: Field[]) => rows.filter((r) => visible(fields).some((f) => String(r[f.name] || '').trim()));

/**
 * The rows table: the columns a step asked for, one row each. A gap request's
 * rows are fixed — one per gap, each saying what is wanted — and keep their
 * hidden `_gap` number so the answer is merged into the right place.
 */
export function RowsEditor({ fields, rows, setRows, maxItems, gaps = false }: {
  fields: Field[]; rows: Row[]; setRows: (rows: Row[]) => void; maxItems: number; gaps?: boolean;
}) {
  const shown = visible(fields);
  const blank = (): Row => Object.fromEntries(fields.map((f) => [f.name, '']));
  if (!shown.length) return null;
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-panel">
      <table className="w-full text-[12px]">
        <thead className="bg-canvas">
          <tr>
            {gaps && <th className="px-2.5 py-2 text-left font-semibold text-ink-700">What is wanted</th>}
            {shown.map((f) =>
            <th key={f.name} className="px-2.5 py-2 text-left font-semibold text-ink-700" title={f.description || undefined}>
                {f.name.replace(/_/g, ' ')}
                {f.type === 'number' && <span className="ml-1 font-normal text-ink-400">(number)</span>}
              </th>
            )}
            {!gaps && <th className="w-8" aria-label="Remove" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) =>
          <tr key={i}>
              {gaps && <td className="max-w-[260px] px-2.5 py-1.5 align-top text-[12px] leading-snug text-ink-700">{r._about}</td>}
              {shown.map((f) =>
            <td key={f.name} className="px-1.5 py-1.5">
                  <input
                value={r[f.name] ?? ''}
                onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, [f.name]: e.target.value } : x))}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                placeholder={f.example ? `e.g. ${f.example}` : f.description || ''}
                aria-label={`${f.name} row ${i + 1}`}
                className={cell} />
                </td>
            )}
              {!gaps &&
            <td className="px-1">
                  <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove row ${i + 1}`}
              className="cursor-pointer rounded p-1 text-ink-400 hover:bg-canvas hover:text-ink-900">
                    <XIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </td>
            }
            </tr>
          )}
        </tbody>
      </table>
      {!gaps && rows.length < maxItems &&
      <button type="button" onClick={() => setRows([...rows, blank()])}
      className="m-2 inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-500">
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Add a row
        </button>
      }
    </div>);

}
