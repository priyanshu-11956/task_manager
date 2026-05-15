import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { signupSchema } from '@/lib/validations';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation failed', 400, parsed.error.flatten().fieldErrors);
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError('Email already registered', 409);
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    await setAuthCookie(token);

    return apiSuccess({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    }, 201);
  } catch (error) {
    return apiError('Signup failed', 500);
  }
}
