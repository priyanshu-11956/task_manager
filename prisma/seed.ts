import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@taskflow.com', password: adminPassword, role: 'ADMIN' },
  });

  // Create member users
  const memberPassword = await bcrypt.hash('member123', 12);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@taskflow.com' },
    update: {},
    create: { name: 'Alice Chen', email: 'alice@taskflow.com', password: memberPassword, role: 'MEMBER' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@taskflow.com' },
    update: {},
    create: { name: 'Bob Martinez', email: 'bob@taskflow.com', password: memberPassword, role: 'MEMBER' },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@taskflow.com' },
    update: {},
    create: { name: 'Carol Kim', email: 'carol@taskflow.com', password: memberPassword, role: 'MEMBER' },
  });

  const dave = await prisma.user.upsert({
    where: { email: 'dave@taskflow.com' },
    update: {},
    create: { name: 'Dave Wilson', email: 'dave@taskflow.com', password: memberPassword, role: 'MEMBER' },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design and improved UX',
      deadline: new Date('2026-07-15'),
      status: 'ACTIVE',
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'LEAD' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Build a cross-platform mobile app for iOS and Android',
      deadline: new Date('2026-09-01'),
      status: 'ACTIVE',
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'LEAD' },
          { userId: carol.id, role: 'MEMBER' },
          { userId: dave.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Integration',
      description: 'Integrate third-party APIs for payment processing and analytics',
      deadline: new Date('2026-06-30'),
      status: 'ACTIVE',
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'LEAD' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: dave.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create tasks
  const tasks = [
    { title: 'Design homepage mockup', description: 'Create high-fidelity mockup for the new homepage', status: 'DONE', priority: 'HIGH', dueDate: new Date('2026-05-10'), projectId: project1.id, assigneeId: alice.id },
    { title: 'Implement responsive navigation', description: 'Build mobile-first responsive nav component', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: new Date('2026-05-20'), projectId: project1.id, assigneeId: bob.id },
    { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deployments', status: 'TODO', priority: 'MEDIUM', dueDate: new Date('2026-05-25'), projectId: project1.id, assigneeId: alice.id },
    { title: 'Write unit tests for auth', description: 'Cover login, signup, and password reset flows', status: 'TODO', priority: 'MEDIUM', dueDate: new Date('2026-06-01'), projectId: project1.id, assigneeId: bob.id },
    { title: 'Design app wireframes', description: 'Create wireframes for all main screens', status: 'DONE', priority: 'URGENT', dueDate: new Date('2026-05-05'), projectId: project2.id, assigneeId: carol.id },
    { title: 'Set up React Native project', description: 'Initialize the mobile app with proper configuration', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: new Date('2026-05-18'), projectId: project2.id, assigneeId: dave.id },
    { title: 'Implement push notifications', description: 'Add push notification support for iOS and Android', status: 'TODO', priority: 'MEDIUM', dueDate: new Date('2026-06-15'), projectId: project2.id, assigneeId: carol.id },
    { title: 'Integrate Stripe payments', description: 'Set up Stripe SDK and payment flow', status: TaskStatus.IN_PROGRESS, priority: Priority.URGENT, dueDate: new Date('2026-05-12'), projectId: project3.id, assigneeId: alice.id },
    { title: 'Set up analytics tracking', description: 'Implement Mixpanel or Amplitude for user analytics', status: TaskStatus.TODO, priority: Priority.LOW, dueDate: new Date('2026-06-20'), projectId: project3.id, assigneeId: dave.id },
    { title: 'API documentation', description: 'Write OpenAPI spec and developer docs', status: TaskStatus.OVERDUE, priority: Priority.HIGH, dueDate: new Date('2026-05-01'), projectId: project3.id, assigneeId: alice.id },
    { title: 'Performance optimization', description: 'Optimize page load times and bundle size', status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: new Date('2026-06-10'), projectId: project1.id, assigneeId: bob.id },
    { title: 'Accessibility audit', description: 'Run WCAG 2.1 compliance check and fix issues', status: TaskStatus.TODO, priority: Priority.LOW, dueDate: new Date('2026-07-01'), projectId: project1.id, assigneeId: alice.id },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  // Create a reschedule request
  const overdueTask = await prisma.task.findFirst({ where: { status: 'OVERDUE' } });
  if (overdueTask) {
    await prisma.rescheduleRequest.create({
      data: {
        taskId: overdueTask.id,
        requesterId: alice.id,
        reason: 'Need more time to complete the API documentation due to unexpected complexity in the payment integration flow.',
        newDueDate: new Date('2026-05-20'),
        status: 'PENDING',
      },
    });
  }

  // Create activity logs
  const activityLogs = [
    { userId: admin.id, action: 'CREATED_PROJECT', details: 'Created project: Website Redesign', projectId: project1.id },
    { userId: admin.id, action: 'CREATED_PROJECT', details: 'Created project: Mobile App Development', projectId: project2.id },
    { userId: admin.id, action: 'CREATED_PROJECT', details: 'Created project: API Integration', projectId: project3.id },
    { userId: admin.id, action: 'CREATED_TASK', details: 'Created task: Design homepage mockup', projectId: project1.id },
    { userId: alice.id, action: 'UPDATED_TASK_STATUS', details: 'Marked task as DONE', projectId: project1.id },
    { userId: alice.id, action: 'RESCHEDULE_REQUESTED', details: 'Requested reschedule for: API documentation', projectId: project3.id },
  ];

  for (const log of activityLogs) {
    await prisma.activityLog.create({ data: log });
  }

  console.log('Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('  Admin:  admin@taskflow.com / admin123');
  console.log('  Member: alice@taskflow.com / member123');
  console.log('  Member: bob@taskflow.com / member123');
  console.log('  Member: carol@taskflow.com / member123');
  console.log('  Member: dave@taskflow.com / member123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
