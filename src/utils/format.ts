export function naira(value: number): string {
  return '₦' + value.toLocaleString('en-NG');
}

export function pct(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(done / total * 100);
}

export function count(value: number): string {
  return value.toLocaleString('en-US');
}

export function delta(current: number, proposed: number): string {
  if (current === 0 || current === proposed) return '0%';
  const change = (proposed - current) / current * 100;
  return (change > 0 ? '+' : '') + change.toFixed(1) + '%';
}
/** A file size a person reads: "47 B", "3.2 KB", "1.4 MB". */
export function bytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10 * 1024 ? 1 : 0)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

/** "just now", "5 min ago", "3 h ago", "yesterday", then a date. */
export function ago(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 172800) return 'yesterday';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
