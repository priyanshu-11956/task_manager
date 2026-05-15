'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge, PriorityBadge, ProjectStatusBadge } from '@/components/layout/status-badge';
import { ProgressBar } from '@/components/layout/progress-bar';
import { EmptyState } from '@/components/layout/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Trash2, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ProjectDetail {
  id: string;
  name: string;
  description?: string;
  deadline?: string;
  status: string;
  members: { userId: string; role: string; user: { id: string; name: string; email: string; avatar?: string } }[];
  tasks: { id: string; title: string; status: string; priority: string; dueDate?: string; assignee: { id: string; name: string; email: string } }[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setProject(json.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast({ title: 'Project deleted' });
      router.push('/projects');
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="h-96 bg-muted rounded-xl" /></div>;
  if (!project) return <EmptyState icon={ArrowLeft} title="Project not found" description="This project may have been deleted." action={<Link href="/projects"><Button variant="outline">Back to Projects</Button></Link>} />;

  const total = project.tasks.length;
  const done = project.tasks.filter(t => t.status === 'DONE').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
        </div>
        {user?.role === 'ADMIN' && (
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tasks ({total})</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-semibold">{progress}%</span>
            </div>
          </div>
          <ProgressBar value={done} max={total || 1} />
          {project.tasks.length === 0 ? (
            <EmptyState icon={Plus} title="No tasks yet" description="Add tasks to this project to get started." />
          ) : (
            <div className="space-y-2">
              {project.tasks.map(task => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <Card className="hover:shadow-md hover:border-teal-500/30 transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                          {task.dueDate && <span className="text-xs text-muted-foreground">{format(new Date(task.dueDate), 'MMM d')}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{task.assignee.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{task.assignee.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tasks:</span>
                <span>{done} / {total} completed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Team ({project.members.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {project.members.map(m => (
                <div key={m.userId} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{m.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
