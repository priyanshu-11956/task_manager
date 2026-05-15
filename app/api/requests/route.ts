import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { rescheduleRequestSchema } from '@/lib/validations';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    let where = {};
    if (auth.role !== 'ADMIN') where = { requesterId: auth.userId };

    const requests = await prisma.rescheduleRequest.findMany({
      where,
      include: {
        task: { select: { id: true, title: true, dueDate: true, status: true, project: { select: { id: true, name: true } } } },
        requester: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(requests);
  } catch {
    return apiError('Failed to fetch requests', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const body = await req.json();
    const parsed = rescheduleRequestSchema.safeParse(body);
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);

    const { taskId, reason, newDueDate } = parsed.data;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return apiError('Task not found', 404);
    if (auth.role !== 'ADMIN' && task.assigneeId !== auth.userId) return apiForbidden();

    const request = await prisma.rescheduleRequest.create({
      data: { taskId, requesterId: auth.userId, reason, newDueDate: new Date(newDueDate) },
      include: { task: { select: { id: true, title: true } }, requester: { select: { id: true, name: true } } },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'RESCHEDULE_REQUESTED' },
    });

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'RESCHEDULE_REQUESTED', details: `Requested reschedule for: ${task.title}`, taskId, projectId: task.projectId },
    });

    return apiSuccess(request, 201);
  } catch {
    return apiError('Failed to create request', 500);
  }
}
