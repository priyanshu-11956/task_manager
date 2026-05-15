import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return apiError('Invalid email or password', 401);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    await setAuthCookie(token);

    return apiSuccess({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    return apiError('Login failed', 500);
  }
}
