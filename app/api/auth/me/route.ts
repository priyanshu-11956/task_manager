import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiUnauthorized } from '@/lib/api-response';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    if (!user) return apiUnauthorized();

    return apiSuccess(user);
  } catch {
    return apiUnauthorized();
  }
}
