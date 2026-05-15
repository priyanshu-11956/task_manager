# TaskFlow - Team Task Manager

A modern, full-stack team task management platform with role-based access control built with Next.js, TypeScript, Prisma, and MongoDB.

## Features

- **Authentication**: Secure signup/login with JWT and bcrypt password hashing
- **Role-Based Access Control**: Admin and Member roles with distinct permissions
- **Project Management**: Create, edit, and delete projects with team assignments
- **Task Management**: Full CRUD with status tracking, priorities, and due dates
- **Reschedule Requests**: Members can request deadline changes; admins approve/decline
- **Dashboard**: Real-time stats, project progress, and activity timeline
- **Search & Filter**: Find tasks by status, priority, or keyword
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Dark Mode Ready**: Teal/emerald themed with strong contrast

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + MongoDB
- JWT authentication
- Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string and JWT secret

5. Push the database schema:
   ```bash
   npm run db:push
   ```

6. Seed the database with sample data:
   ```bash
   npm run db:seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

### Test Accounts

| Role   | Email                  | Password   |
|--------|------------------------|------------|
| Admin  | admin@taskflow.com     | admin123   |
| Member | alice@taskflow.com     | member123  |
| Member | bob@taskflow.com       | member123  |
| Member | carol@taskflow.com     | member123  |
| Member | dave@taskflow.com      | member123  |

## Project Structure

```
app/
  (auth)/          - Auth pages (login, signup)
  (app)/           - Protected app pages
    dashboard/     - Main dashboard
    projects/      - Project list + detail
    tasks/         - Task list + detail
    team/          - Team members
    requests/      - Reschedule requests
    admin/         - Admin panel
    member/        - Member profile
  api/             - REST API routes
    auth/          - Authentication endpoints
    projects/      - Project CRUD
    tasks/         - Task CRUD
    users/         - User/team endpoints
    requests/      - Reschedule request endpoints
    dashboard/     - Dashboard stats
components/
  layout/          - App shell, sidebar, shared components
  ui/              - shadcn/ui components
lib/
  auth.ts          - JWT & password utilities
  auth-context.tsx - React auth context
  prisma.ts        - Prisma client singleton
  validations.ts   - Zod schemas
  constants.ts     - Status/priority color maps
  api-response.ts  - API response helpers
prisma/
  schema.prisma    - Database schema
  seed.ts          - Sample data seeder
```

## API Endpoints

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /api/auth/signup  | Register new user        |
| POST   | /api/auth/login   | Login                    |
| POST   | /api/auth/logout  | Logout                   |
| GET    | /api/auth/me      | Get current user         |
| GET    | /api/projects     | List projects            |
| POST   | /api/projects     | Create project (admin)   |
| GET    | /api/projects/:id | Get project detail       |
| PUT    | /api/projects/:id | Update project (admin)   |
| DELETE | /api/projects/:id | Delete project (admin)   |
| GET    | /api/tasks        | List tasks (filtered)    |
| POST   | /api/tasks        | Create task (admin)      |
| GET    | /api/tasks/:id    | Get task detail          |
| PUT    | /api/tasks/:id    | Update task              |
| DELETE | /api/tasks/:id    | Delete task (admin)      |
| GET    | /api/users        | List team members        |
| GET    | /api/requests     | List reschedule requests |
| POST   | /api/requests     | Create reschedule request|
| PUT    | /api/requests/:id | Review request (admin)   |
| GET    | /api/dashboard    | Dashboard statistics     |

## Deployment (Railway)

1. Connect your GitHub repo to Railway
2. Add a MongoDB addon or set the DATABASE_URL env var
3. Set JWT_SECRET env var
4. Railway will run `npm run build` automatically
5. Run `npm run db:push` and `npm run db:seed` after first deploy

## License

MIT
