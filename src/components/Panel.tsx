import React from 'react';

interface PanelProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
}

export function Panel({
  title,
  description,
  action,
  children,
  padded = true,
  className = ''
}: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-line bg-panel shadow-panel ${className}`}>
      
      {(title || action) &&
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div>
            {title &&
          <h2 className="text-[13px] font-semibold tracking-tight text-ink-900">
                {title}
              </h2>
          }
            {description &&
          <p className="mt-0.5 text-xs text-ink-500">{description}</p>
          }
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      }
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>);

}