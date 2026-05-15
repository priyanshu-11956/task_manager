'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { ProgressBar } from '@/components/layout/progress-bar';
import { EmptyState } from '@/components/layout/empty-state';
import { StatusBadge } from '@/components/layout/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SquareCheck as CheckSquare, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, LayoutDashboard, Activity, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardData {
  totalTasks: number;
  doneTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  rescheduleRequested: number;
  pendingRequests: number;
  projectProgress: { id: string; name: string; status: string; total: number; done: number; progress: number }[];
  tasksByStatus: { status: string; count: number }[];
  recentActivities: { id: string; action: string; details: string; createdAt: string; user: { name: string; avatar: string | null } }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!data) return <EmptyState icon={LayoutDashboard} title="No data yet" description="Start by creating a project and adding tasks." />;

  const completionRate = data.totalTasks > 0 ? Math.round((data.doneTasks / data.totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title={user?.role === 'ADMIN' ? 'Admin Dashboard' : 'My Dashboard'}
        description={`Welcome back, ${user?.name}. Here's your overview.`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={CheckSquare} label="Total Tasks" value={data.totalTasks} color="teal" />
        <StatCard icon={CheckCircle} label="Completed" value={data.doneTasks} color="blue" trend={`${completionRate}% completion`} />
        <StatCard icon={Clock} label="Pending" value={data.pendingTasks} color="orange" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data.overdueTasks} color="red" />
        <StatCard icon={Clock} label="Reschedule Requests" value={data.pendingRequests} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.tasksByStatus.map(item => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <StatusBadge status={item.status} />
                  <span className="font-semibold">{item.count}</span>
                </div>
                <ProgressBar value={item.count} max={data.totalTasks || 1} size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.projectProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
            ) : (
              data.projectProgress.map(p => (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-2">{p.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{p.done}/{p.total}</span>
                  </div>
                  <ProgressBar value={p.done} max={p.total || 1} size="sm" />
                  <p className="text-xs text-right text-muted-foreground">{p.progress}%</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {data.recentActivities.map(a => (
                  <div key={a.id} className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">{a.user?.name?.[0] || '?'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm"><span className="font-medium">{a.user?.name}</span> {a.action.replace(/_/g, ' ').toLowerCase()}</p>
                      {a.details && <p className="text-xs text-muted-foreground truncate">{a.details}</p>}
                      <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(a.createdAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
