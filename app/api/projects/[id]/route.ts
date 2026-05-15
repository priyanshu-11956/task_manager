import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { projectSchema } from '@/lib/validations';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } } },
        tasks: { include: { assignee: { select: { id: true, name: true, email: true, avatar: true } }, rescheduleReqs: true },
          orderBy: { createdAt: 'desc' } },
      },
    });

    if (!project) return apiNotFound('Project not found');

    if (auth.role !== 'ADMIN') {
      const isMember = project.members.some(m => m.userId === auth.userId);
      if (!isMember) return apiForbidden();
    }

    return apiSuccess(project);
  } catch {
    return apiError('Failed to fetch project', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();
    if (auth.role !== 'ADMIN') return apiForbidden();

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);

    const { name, description, deadline, status, memberIds } = parsed.data;

    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound();

    if (memberIds) {
      await prisma.projectMember.deleteMany({ where: { projectId: params.id } });
      for (const userId of memberIds) {
        await prisma.projectMember.create({
          data: { userId, projectId: params.id, role: 'MEMBER' },
        });
      }
      // Ensure creator is LEAD
      await prisma.projectMember.upsert({
        where: { userId_projectId: { userId: existing.creatorId, projectId: params.id } },
        update: { role: 'LEAD' },
        create: { userId: existing.creatorId, projectId: params.id, role: 'LEAD' },
      });
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { name, description, deadline: deadline ? new Date(deadline) : null, status },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'UPDATED_PROJECT', details: `Updated project: ${name}`, projectId: params.id },
    });

    return apiSuccess(project);
  } catch {
    return apiError('Failed to update project', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();
    if (auth.role !== 'ADMIN') return apiForbidden();

    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound();

    await prisma.project.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'DELETED_PROJECT', details: `Deleted project: ${existing.name}` },
    });

    return apiSuccess({ message: 'Project deleted' });
  } catch {
    return apiError('Failed to delete project', 500);
  }
}
