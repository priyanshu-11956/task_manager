'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge, PriorityBadge } from '@/components/layout/status-badge';
import { EmptyState } from '@/components/layout/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SquareCheck as CheckSquare, Plus, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string };
}

interface Project { id: string; name: string }
interface TeamMember { id: string; name: string; email: string }

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', projectId: '', assigneeId: '' });

  const fetchData = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (search) params.set('search', search);

    fetch(`/api/tasks?${params}`)
      .then(r => r.json())
      .then(json => { if (json.success) setTasks(json.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/projects').then(r => r.json()).then(json => { if (json.success) setProjects(json.data); });
      fetch('/api/users').then(r => r.json()).then(json => { if (json.success) setMembers(json.data); });
    }
  }, [user?.role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: 'Task created' });
      setOpen(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', projectId: '', assigneeId: '' });
      fetchData();
    } else {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    }
  };

  const filtered = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="h-10 bg-muted rounded" /><div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-20 bg-muted rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={user?.role === 'ADMIN' ? 'Manage all tasks across projects' : 'Your assigned tasks'}
        action={
          user?.role === 'ADMIN' ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                  <Plus className="h-4 w-4 mr-2" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Priority</Label>
                      <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Project</Label>
                      <Select value={form.projectId} onValueChange={v => setForm(f => ({...f, projectId: v}))}>
                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                        <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Assignee</Label>
                      <Select value={form.assigneeId} onValueChange={v => setForm(f => ({...f, assigneeId: v}))}>
                        <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                        <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white">Create Task</Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="TODO">Todo</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="RESCHEDULE_REQUESTED">Reschedule</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks found" description="Try adjusting your filters or create a new task." />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <Card className="hover:shadow-md hover:border-teal-500/30 transition-all cursor-pointer mb-2">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-muted-foreground">{task.project.name}</span>
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
  );
}
