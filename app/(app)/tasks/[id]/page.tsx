'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge, PriorityBadge, RequestStatusBadge } from '@/components/layout/status-badge';
import { EmptyState } from '@/components/layout/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Clock, CircleCheck as CheckCircle, RotateCcw, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RescheduleReq {
  id: string;
  reason: string;
  newDueDate: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  requester: { id: string; name: string };
}

interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string };
  rescheduleReqs: RescheduleReq[];
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ reason: '', newDueDate: '' });

  const fetchTask = () => {
    fetch(`/api/tasks/${id}`)
      .then(r => r.json())
      .then(json => { if (json.success) setTask(json.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: `Task marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}` });
      fetchTask();
    } else {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: id, ...rescheduleForm }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: 'Reschedule request submitted' });
      setRescheduleOpen(false);
      setRescheduleForm({ reason: '', newDueDate: '' });
      fetchTask();
    } else {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      toast({ title: 'Task deleted' });
      window.history.back();
    }
  };

  const handleReview = async (reqId: string, status: 'APPROVED' | 'DECLINED', adminNote?: string) => {
    const res = await fetch(`/api/requests/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: `Request ${status.toLowerCase()}` });
      fetchTask();
    } else {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="h-96 bg-muted rounded-xl" /></div>;
  if (!task) return <EmptyState icon={ArrowLeft} title="Task not found" description="This task may have been deleted." action={<Link href="/tasks"><Button variant="outline">Back to Tasks</Button></Link>} />;

  const isAssignee = user?.id === task.assignee.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tasks"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{task.project.name}</p>
        </div>
        {isAdmin && <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.dueDate && <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>}
              </div>
              {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
              <div className="flex items-center gap-2 pt-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{task.assignee.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignee.name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {isAssignee && task.status !== 'DONE' && (
                <Button size="sm" onClick={() => handleStatusChange('DONE')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark Done
                </Button>
              )}
              {isAssignee && task.status === 'DONE' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange('TODO')}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reopen
                </Button>
              )}
              {isAssignee && task.status !== 'DONE' && task.status !== 'RESCHEDULE_REQUESTED' && (
                <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Clock className="h-4 w-4 mr-1" /> Request Reschedule</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Request Reschedule</DialogTitle></DialogHeader>
                    <form onSubmit={handleReschedule} className="space-y-4">
                      <div className="space-y-2"><Label>Reason</Label><Textarea value={rescheduleForm.reason} onChange={e => setRescheduleForm(f => ({...f, reason: e.target.value}))} required minLength={5} /></div>
                      <div className="space-y-2"><Label>New Due Date</Label><Input type="date" value={rescheduleForm.newDueDate} onChange={e => setRescheduleForm(f => ({...f, newDueDate: e.target.value}))} required /></div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white">Submit Request</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {isAdmin && task.status !== 'DONE' && (
                <>
                  <Button size="sm" onClick={() => handleStatusChange('IN_PROGRESS')} variant="outline">Set In Progress</Button>
                  <Button size="sm" onClick={() => handleStatusChange('DONE')} className="bg-emerald-600 text-white">Mark Done</Button>
                  <Button size="sm" onClick={() => handleStatusChange('OVERDUE')} variant="outline">Mark Overdue</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Reschedule History */}
          {task.rescheduleReqs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Reschedule History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {task.rescheduleReqs.map(req => (
                  <div key={req.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <RequestStatusBadge status={req.status} />
                      <span className="text-xs text-muted-foreground">{format(new Date(req.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm"><span className="font-medium">{req.requester.name}</span> requested reschedule</p>
                    <p className="text-sm text-muted-foreground">Reason: {req.reason}</p>
                    <p className="text-sm text-muted-foreground">New date: {format(new Date(req.newDueDate), 'MMM d, yyyy')}</p>
                    {req.adminNote && <p className="text-sm text-muted-foreground">Admin note: {req.adminNote}</p>}
                    {isAdmin && req.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => { const note = prompt('Admin note (optional):'); handleReview(req.id, 'APPROVED', note || undefined); }} className="bg-emerald-600 text-white">Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => { const note = prompt('Reason for declining:'); handleReview(req.id, 'DECLINED', note || undefined); }}>Decline</Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Task Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={task.status} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><PriorityBadge priority={task.priority} /></div>
              {task.dueDate && <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span>{task.project.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Assignee</span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[8px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{task.assignee.name[0]}</AvatarFallback></Avatar>
                  <span>{task.assignee.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
