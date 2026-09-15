import React from 'react';
import {
  DownloadIcon,
  FileImageIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FileTextIcon } from
'lucide-react';
import { Artifact } from '@/types';
import { artifacts } from '@/data/artifacts';
import { count } from '@/utils/format';

const icons: Record<Artifact['kind'], React.ElementType> = {
  excel: FileSpreadsheetIcon,
  csv: FileSpreadsheetIcon,
  json: FileJsonIcon,
  pdf: FileTextIcon,
  image: FileImageIcon
};

export function Artifacts() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">Artifacts</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-500">
          Every file an agent produced, traced back to the job that created it.
        </p>
      </div>

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel shadow-panel">
        {artifacts.map((a) => {
          const Icon = icons[a.kind];
          return (
            <li
              key={a.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-canvas">
              
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas">
                <Icon className="h-4 w-4 text-ink-700" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] font-medium text-ink-900">{a.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-ink-500">{a.jobName}</p>
              </div>
              <div className="hidden w-[150px] shrink-0 sm:block">
                <p className="tabular text-[12px] text-ink-700">
                  {a.rows > 0 ? `${count(a.rows)} rows` : '—'}
                </p>
                <p className="text-[11px] text-ink-500">{a.size}</p>
              </div>
              <p className="hidden w-[120px] shrink-0 text-[12px] text-ink-500 md:block">
                {a.createdAt}
              </p>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 text-[12px] font-medium text-ink-900 transition-colors duration-150 ease-out hover:bg-canvas">
                
                <DownloadIcon className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Download</span>
              </button>
            </li>);

        })}
      </ul>
    </div>);

}