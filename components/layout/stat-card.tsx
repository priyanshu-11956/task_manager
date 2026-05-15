'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, trend, color = 'teal', className }: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  color?: string;
  className?: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'from-teal-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    orange: 'from-orange-500 to-amber-600',
    red: 'from-red-500 to-rose-600',
    slate: 'from-slate-500 to-slate-600',
  };

  return (
    <div className={cn('group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', colorMap[color] || colorMap.teal)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className={cn('absolute -bottom-1 -right-1 h-24 w-24 rounded-full opacity-[0.07] bg-gradient-to-br', colorMap[color] || colorMap.teal)} />
    </div>
  );
}
