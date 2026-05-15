import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const taskWhere = auth.role === 'ADMIN' ? {} : { assigneeId: auth.userId };

    const [totalTasks, doneTasks, pendingTasks, overdueTasks, rescheduleRequested, projects, pendingRequests, recentActivities] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'DONE' } }),
      prisma.task.count({ where: { ...taskWhere, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
      prisma.task.count({ where: { ...taskWhere, dueDate: { lt: new Date() }, status: { not: 'DONE' } } }),
      prisma.task.count({ where: { ...taskWhere, status: 'RESCHEDULE_REQUESTED' } }),
      auth.role === 'ADMIN'
        ? prisma.project.findMany({ include: { _count: { select: { tasks: true } }, tasks: { select: { status: true } } }, orderBy: { createdAt: 'desc' } })
        : prisma.project.findMany({
            where: { members: { some: { userId: auth.userId } } },
            include: { _count: { select: { tasks: true } }, tasks: { select: { status: true } } },
            orderBy: { createdAt: 'desc' },
          }),
      prisma.rescheduleRequest.count({ where: auth.role === 'ADMIN' ? { status: 'PENDING' } : { status: 'PENDING', requesterId: auth.userId } }),
      prisma.activityLog.findMany({
        where: auth.role === 'ADMIN' ? {} : { userId: auth.userId },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const projectProgress = projects.map(p => {
      const total = p.tasks.length;
      const done = p.tasks.filter(t => t.status === 'DONE').length;
      return { id: p.id, name: p.name, status: p.status, total, done, progress: total > 0 ? Math.round((done / total) * 100) : 0 };
    });

    const tasksByStatus = [
      { status: 'TODO', count: await prisma.task.count({ where: { ...taskWhere, status: 'TODO' } }) },
      { status: 'IN_PROGRESS', count: await prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }) },
      { status: 'DONE', count: doneTasks },
      { status: 'OVERDUE', count: overdueTasks },
      { status: 'RESCHEDULE_REQUESTED', count: rescheduleRequested },
    ];

    return apiSuccess({
      totalTasks,
      doneTasks,
      pendingTasks,
      overdueTasks,
      rescheduleRequested,
      pendingRequests,
      projectProgress,
      tasksByStatus,
      recentActivities,
    });
  } catch {
    return apiError('Failed to fetch dashboard', 500);
  }
}
