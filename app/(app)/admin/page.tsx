'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { StatusBadge, PriorityBadge } from '@/components/layout/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Users, SquareCheck as CheckSquare, TriangleAlert as AlertTriangle, Clock, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalTasks: 0, overdueTasks: 0, pendingRequests: 0 });
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    if (!user) return;

    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/tasks?status=OVERDUE').then(r => r.json()),
    ]).then(([dashJson, taskJson]) => {
      if (dashJson.success) {
        const d = dashJson.data;
        setStats({ totalUsers: 0, totalProjects: d.projectProgress.length, totalTasks: d.totalTasks, overdueTasks: d.overdueTasks, pendingRequests: d.pendingRequests });
      }
      if (taskJson.success) setOverdueTasks(taskJson.data);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') return null;
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-28 bg-muted rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Panel" description="System overview and management controls" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Projects" value={stats.totalProjects} color="teal" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats.totalTasks} color="blue" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdueTasks} color="red" />
        <StatCard icon={Clock} label="Pending Requests" value={stats.pendingRequests} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No overdue tasks</p>
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 10).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/tasks/${task.id}`)}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{task.assignee?.name?.[0]}</AvatarFallback></Avatar>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{task.assignee?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/projects')}>
              <FolderKanban className="h-4 w-4 mr-2" /> Manage Projects
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/tasks')}>
              <CheckSquare className="h-4 w-4 mr-2" /> Manage Tasks
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/team')}>
              <Users className="h-4 w-4 mr-2" /> View Team
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/requests')}>
              <Clock className="h-4 w-4 mr-2" /> Review Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
