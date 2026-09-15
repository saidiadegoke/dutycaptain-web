'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  tone?: 'brand' | 'ok' | 'warn' | 'neutral';
  size?: 'sm' | 'md';
  label?: string;
}

const tones = {
  brand: 'bg-brand-600',
  ok: 'bg-ok-600',
  warn: 'bg-warn-600',
  neutral: 'bg-ink-400'
};

export function ProgressBar({ value, tone = 'brand', size = 'md', label }: ProgressBarProps) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-line ${size === 'sm' ? 'h-1' : 'h-1.5'}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}>
      
      <motion.div
        className={`h-full rounded-full ${tones[tone]}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }} />
      
    </div>);

}