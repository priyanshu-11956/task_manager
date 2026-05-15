'use client';

import { cn } from '@/lib/utils';

export function ProgressBar({ value, max = 100, className, size = 'md' }: {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className={cn('w-full rounded-full bg-muted overflow-hidden', heights[size], className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-teal-500' : pct >= 25 ? 'bg-amber-500' : 'bg-red-500')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
