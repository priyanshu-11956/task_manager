import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { taskSchema } from '@/lib/validations';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, status: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        rescheduleReqs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!task) return apiNotFound('Task not found');
    if (auth.role !== 'ADMIN' && task.assigneeId !== auth.userId) return apiForbidden();

    return apiSuccess(task);
  } catch {
    return apiError('Failed to fetch task', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const existing = await prisma.task.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound();

    const body = await req.json();

    if (auth.role === 'ADMIN') {
      const parsed = taskSchema.safeParse(body);
      if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);

      const { title, description, status, priority, dueDate, projectId, assigneeId } = parsed.data;
      const task = await prisma.task.update({
        where: { id: params.id },
        data: { title, description, status, priority, dueDate: dueDate ? new Date(dueDate) : null, projectId, assigneeId },
        include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true, email: true } } },
      });

      await prisma.activityLog.create({
        data: { userId: auth.userId, action: 'UPDATED_TASK', details: `Updated task: ${title}`, projectId, taskId: task.id },
      });

      return apiSuccess(task);
    } else {
      if (existing.assigneeId !== auth.userId) return apiForbidden();
      const allowedStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
      const newStatus = body.status;
      if (!newStatus || !allowedStatuses.includes(newStatus)) return apiError('Members can only update task status', 400);

      const task = await prisma.task.update({
        where: { id: params.id },
        data: { status: newStatus },
        include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true, email: true } } },
      });

      await prisma.activityLog.create({
        data: { userId: auth.userId, action: 'UPDATED_TASK_STATUS', details: `Marked task as ${newStatus}`, taskId: task.id, projectId: task.projectId },
      });

      return apiSuccess(task);
    }
  } catch {
    return apiError('Failed to update task', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();
    if (auth.role !== 'ADMIN') return apiForbidden();

    const existing = await prisma.task.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound();

    await prisma.task.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'DELETED_TASK', details: `Deleted task: ${existing.title}`, projectId: existing.projectId },
    });

    return apiSuccess({ message: 'Task deleted' });
  } catch {
    return apiError('Failed to delete task', 500);
  }
}
