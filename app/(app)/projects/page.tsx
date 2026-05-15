'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectStatusBadge } from '@/components/layout/status-badge';
import { ProgressBar } from '@/components/layout/progress-bar';
import { EmptyState } from '@/components/layout/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderKanban, Plus, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description?: string;
  deadline?: string;
  status: string;
  members: { userId: string; user: { id: string; name: string; email: string } }[];
  tasks: { id: string; status: string }[];
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });

  const fetchProjects = () => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(json => { if (json.success) setProjects(json.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: 'Project created' });
      setOpen(false);
      setForm({ name: '', description: '', deadline: '' });
      fetchProjects();
    } else {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-48 bg-muted rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Manage your team projects and track progress"
        action={
          user?.role === 'ADMIN' ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                  <Plus className="h-4 w-4 mr-2" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white">Create Project</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start managing tasks." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const total = p.tasks.length;
            const done = p.tasks.filter(t => t.status === 'DONE').length;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="group hover:shadow-lg hover:border-teal-500/30 transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{p.name}</h3>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    {p.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.description}</p>}
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <ProgressBar value={done} max={total || 1} size="sm" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.members.length} members</span>
                        {p.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(p.deadline), 'MMM d, yyyy')}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
