import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { projectSchema } from '@/lib/validations';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();

    let projects;
    if (auth.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: { members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }, tasks: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      const memberLinks = await prisma.projectMember.findMany({
        where: { userId: auth.userId },
        select: { projectId: true },
      });
      const projectIds = memberLinks.map(m => m.projectId);
      projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: { members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }, tasks: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return apiSuccess(projects);
  } catch {
    return apiError('Failed to fetch projects', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return apiUnauthorized();
    if (auth.role !== 'ADMIN') return apiForbidden();

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);

    const { name, description, deadline, status, memberIds } = parsed.data;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        status,
        creatorId: auth.userId,
        members: {
          create: (memberIds || []).map((userId: string) => ({ userId, role: 'MEMBER' })),
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    // Add creator as LEAD
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: auth.userId, role: 'LEAD' },
    });

    await prisma.activityLog.create({
      data: { userId: auth.userId, action: 'CREATED_PROJECT', details: `Created project: ${name}`, projectId: project.id },
    });

    return apiSuccess(project, 201);
  } catch {
    return apiError('Failed to create project', 500);
  }
}
