import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { taskSchema } from '@/lib/validations';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (auth.role !== 'ADMIN') where.assigneeId = auth.userId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, status: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        rescheduleReqs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(tasks);
  } catch {
    return apiError('Failed to fetch tasks', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);

    const { title, description, status, priority, dueDate, projectId, assigneeId } = parsed.data;

    // Check if user can create tasks: ADMIN or LEAD of the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) return apiError('Project not found', 404);
    const isLead = project.members.some(m => m.userId === auth.userId && m.role === 'LEAD');
    if (!isLead && auth.role !== 'ADMIN') return apiForbidden();

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'CREATED_TASK', details: `Created task: ${title}`, projectId, taskId: task.id },
    });

    return apiSuccess(task, 201);
  } catch {
    return apiError('Failed to create task', 500);
  }
}
