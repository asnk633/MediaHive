import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest, canChangeTaskStatus } from '../../../_lib/auth';
import { TaskStatus } from '@/types';

// Configure for static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

// For static export with dynamic routes
export async function generateStaticParams() {
  return [];
}

/**
 * POST /api/tasks/[id]/status
 * Change task status with role-based validation
 * Body: { status: TaskStatus }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const { id } = await context.params;
    const taskId = parseInt(id, 10);

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Validate transition based on role
    if (!canChangeTaskStatus(user, task.status as TaskStatus, newStatus)) {
      return NextResponse.json(
        { error: 'You do not have permission to make this status change' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const [updated] = await db
      .update(tasks)
      .set({
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Send notification to task creator when status is changed by someone else
    if (task.createdById !== user.id) {
      // Get the task creator
      const [creator] = await db
        .select({
          id: users.id,
          fullName: users.fullName
        })
        .from(users)
        .where(eq(users.id, task.createdById));

      if (creator) {
        // Create notification for task creator
        const notificationTitle = 'Task Status Changed';
        const notificationBody = `The status of your task "${updated.title}" has been changed to "${newStatus}" by ${user.fullName}.`;

        const now = new Date().toISOString();
        await db.insert(notifications).values({
          userId: creator.id,
          type: 'task_status_changed',
          title: notificationTitle,
          body: notificationBody,
          readAt: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/tasks/[id]/status]', error);
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}
