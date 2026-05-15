'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { RequestStatusBadge } from '@/components/layout/status-badge';
import { EmptyState } from '@/components/layout/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RescheduleRequest {
  id: string;
  reason: string;
  newDueDate: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  task: { id: string; title: string; dueDate: string; status: string; project: { id: string; name: string } };
  requester: { id: string; name: string; email: string; avatar?: string };
}

export default function RequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    fetch('/api/requests')
      .then(r => r.json())
      .then(json => { if (json.success) setRequests(json.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReview = async (reqId: string, status: 'APPROVED' | 'DECLINED') => {
    const note = status === 'DECLINED' ? prompt('Reason for declining (optional):') : prompt('Admin note (optional):');
    const res = await fetch(`/api/requests/${reqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: note || undefined }),
    });
    const json = await res.json();
    if (json.success) {
      toast({ title: `Request ${status.toLowerCase()}` });
      fetchRequests();
    } else {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const pending = requests.filter(r => r.status === 'PENDING');
  const reviewed = requests.filter(r => r.status !== 'PENDING');

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-32 bg-muted rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reschedule Requests"
        description={isAdmin ? 'Review and manage reschedule requests from team members' : 'Track your reschedule request status'}
      />

      {requests.length === 0 ? (
        <EmptyState icon={Clock} title="No requests yet" description="Reschedule requests will appear here when team members submit them." />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Pending ({pending.length})
              </h2>
              {pending.map(req => (
                <Card key={req.id} className="border-amber-200 dark:border-amber-900/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{req.requester.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{req.requester.name}</span>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        <p className="text-sm font-medium">{req.task.title}</p>
                        <p className="text-sm text-muted-foreground">{req.task.project.name}</p>
                        <p className="text-sm text-muted-foreground">Reason: {req.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {format(new Date(req.task.dueDate), 'MMM d, yyyy')} &rarr; Requested: {format(new Date(req.newDueDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(req.createdAt), 'MMM d, h:mm a')}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" onClick={() => handleReview(req.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReview(req.id, 'DECLINED')}>
                            <XCircle className="h-4 w-4 mr-1" /> Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {reviewed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" /> Reviewed ({reviewed.length})
              </h2>
              {reviewed.map(req => (
                <Card key={req.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px] bg-gradient-to-br from-teal-500 to-emerald-600 text-white">{req.requester.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{req.requester.name}</span>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <p className="text-sm">{req.task.title}</p>
                      <p className="text-sm text-muted-foreground">Reason: {req.reason}</p>
                      <p className="text-sm text-muted-foreground">New date: {format(new Date(req.newDueDate), 'MMM d, yyyy')}</p>
                      {req.adminNote && <p className="text-sm text-muted-foreground">Note: {req.adminNote}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
