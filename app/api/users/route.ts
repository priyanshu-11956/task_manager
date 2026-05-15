import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();
    if (auth.role !== 'ADMIN') return apiForbidden();

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true,
        projects: { include: { project: { select: { id: true, name: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(users);
  } catch {
    return apiError('Failed to fetch users', 500);
  }
}
