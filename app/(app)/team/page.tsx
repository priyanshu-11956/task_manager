'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, SquareCheck as CheckSquare } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  projects: { project: { id: string; name: string } }[];
  _count: { tasks: number };
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(json => { if (json.success) setMembers(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-muted rounded" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-40 bg-muted rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-8">
      <PageHeader title="Team" description="View and manage team members" />

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Team members will appear here once they sign up." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-semibold">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{m.name}</h3>
                      <Badge variant={m.role === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px]">
                        {m.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {m.email}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" /> {m._count.tasks} tasks</span>
                      <span>{m.projects.length} projects</span>
                    </div>
                    {m.projects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.projects.slice(0, 3).map(p => (
                          <Badge key={p.project.id} variant="outline" className="text-[10px]">{p.project.name}</Badge>
                        ))}
                        {m.projects.length > 3 && <Badge variant="outline" className="text-[10px]">+{m.projects.length - 3}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
