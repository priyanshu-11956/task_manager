'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function MemberPage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8">
      <PageHeader title="My Profile" description="Your account information" />

      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3 flex-1">
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-1">
                    {user.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {user.email}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" /> Role: {user.role}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
