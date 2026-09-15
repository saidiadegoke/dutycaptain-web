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