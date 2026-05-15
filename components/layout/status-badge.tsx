'use client';

import { cn } from '@/lib/utils';
import { STATUS_COLORS, PRIORITY_COLORS, REQUEST_STATUS_COLORS, PROJECT_STATUS_COLORS } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLORS[status] || 'bg-muted text-muted-foreground')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', PRIORITY_COLORS[priority] || 'bg-muted text-muted-foreground')}>
      {priority}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', REQUEST_STATUS_COLORS[status] || 'bg-muted text-muted-foreground')}>
      {status}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', PROJECT_STATUS_COLORS[status] || 'bg-muted text-muted-foreground')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
