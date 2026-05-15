import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']).default('ACTIVE'),
  memberIds: z.array(z.string()).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE', 'RESCHEDULE_REQUESTED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  assigneeId: z.string().min(1, 'Assignee is required'),
});

export const rescheduleRequestSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  newDueDate: z.string().min(1, 'New due date is required'),
});

export const reviewRequestSchema = z.object({
  status: z.enum(['APPROVED', 'DECLINED']),
  adminNote: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type RescheduleRequestInput = z.infer<typeof rescheduleRequestSchema>;
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
