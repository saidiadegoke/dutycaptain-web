import React from 'react';
import { CheckIcon, LoaderIcon, LockIcon, XIcon } from 'lucide-react';
import { TaskNode, WorkflowStage } from '@/types';
import { AgentTag } from './StatusBadge';

function centers(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i + 0.5) / n * 100);
}

function Connector({ from, to }: {from: number;to: number;}) {
  const a = centers(from);
  const b = centers(to);
  const pairs: Array<[number, number]> = [];

  if (from === to) {
    a.forEach((x, i) => pairs.push([x, b[i]]));
  } else if (from === 1) {
    b.forEach((x) => pairs.push([a[0], x]));
  } else if (to === 1) {
    a.forEach((x) => pairs.push([x, b[0]]));
  } else {
    a.forEach((x, i) => pairs.push([x, b[Math.min(i, b.length - 1)]]));
  }

  return (
    <svg
      className="h-7 w-full"
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true">
      
      {pairs.map(([x1, x2], i) =>
      <path
        key={i}
        d={`M ${x1} 0 C ${x1} 14, ${x2} 14, ${x2} 28`}
        fill="none"
        stroke="#cdd4e0"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke" />

      )}
    </svg>);

}

const statusChrome: Record<
  TaskNode['status'],
  {card: string;icon: React.ReactNode;note: string;}> =
{
  done: {
    card: 'border-line bg-panel',
    icon: <CheckIcon className="h-3 w-3 text-ok-700" strokeWidth={3} />,
    note: 'text-ink-500'
  },
  running: {
    card: 'border-brand-200 bg-brand-50 ring-1 ring-brand-200',
    icon: <LoaderIcon className="h-3 w-3 animate-spin text-brand-600" strokeWidth={2.6} />,
    note: 'text-brand-700'
  },
  queued: {
    card: 'border-dashed border-line-strong bg-canvas',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />,
    note: 'text-ink-500'
  },
  failed: {
    card: 'border-danger-100 bg-danger-50',
    icon: <XIcon className="h-3 w-3 text-danger-600" strokeWidth={3} />,
    note: 'text-danger-700'
  },
  blocked: {
    card: 'border-warn-100 bg-warn-50',
    icon: <LockIcon className="h-3 w-3 text-warn-700" strokeWidth={2.4} />,
    note: 'text-warn-700'
  }
};

function NodeCard({ node }: {node: TaskNode;}) {
  const chrome = statusChrome[node.status];
  return (
    <article
      className={`flex h-full flex-col rounded-lg border px-3 py-2.5 ${chrome.card}`}>
      
      <div className="flex items-center justify-between gap-2">
        <AgentTag agent={node.agent} />
        <span className="flex h-4 w-4 items-center justify-center">{chrome.icon}</span>
      </div>
      <h4 className="mt-1.5 text-[13px] font-semibold leading-snug tracking-tight text-ink-900">
        {node.label}
      </h4>
      <p className={`mt-1 text-[11px] leading-snug ${chrome.note}`}>{node.detail}</p>
      <p className="mt-auto pt-2 font-mono text-[10px] text-ink-400">
        ×{node.parallelism} · {node.retries} retries
      </p>
    </article>);

}

export function WorkflowGraph({ stages }: {stages: WorkflowStage[];}) {
  return (
    <div>
      {stages.map((stage, i) =>
      <div key={stage.id}>
          <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${stage.nodes.length}, minmax(0, 1fr))` }}>
          
            {stage.nodes.map((node) =>
          <NodeCard key={node.id} node={node} />
          )}
          </div>
          {i < stages.length - 1 &&
        <Connector from={stage.nodes.length} to={stages[i + 1].nodes.length} />
        }
        </div>
      )}
    </div>);

}