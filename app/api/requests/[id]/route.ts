import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { reviewRequestSchema } from '@/lib/validations';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api-response';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();
    if (auth.role !== 'ADMIN') return apiForbidden('Only admins can review requests');

    const body = await req.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);

    const { status, adminNote } = parsed.data;

    const existing = await prisma.rescheduleRequest.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound('Request not found');
    if (existing.status !== 'PENDING') return apiError('Request already reviewed', 400);

    const request = await prisma.rescheduleRequest.update({
      where: { id: params.id },
      data: { status, adminNote, reviewedBy: auth.userId, reviewedAt: new Date() },
      include: { task: { select: { id: true, title: true } }, requester: { select: { id: true, name: true } } },
    });

    if (status === 'APPROVED') {
      await prisma.task.update({
        where: { id: existing.taskId },
        data: { dueDate: existing.newDueDate, status: 'TODO' },
      });
    } else {
      await prisma.task.update({
        where: { id: existing.taskId },
        data: { status: 'TODO' },
      });
    }

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'REVIEWED_RESCHEDULE', details: `${status} reschedule for task`, taskId: existing.taskId },
    });

    return apiSuccess(request);
  } catch {
    return apiError('Failed to review request', 500);
  }
}
