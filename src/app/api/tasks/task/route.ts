import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authorize } from '../../_lib/rbac';
import { hasRole } from '@/lib/permissions';
import { TaskStatus, TaskPriority } from '@/types';
import { getUserFromRequest, canChangeTaskStatus } from '../../_lib/auth';

// Configure for static export
export const dynamic = 'force-dynamic';
export const revalidate = false;

/**
 * GET /api/tasks/task?id={taskId}
 * Get single task details
 */
export async function GET(request: NextRequest) {
  try {
    // Authorize user with RBAC - all roles can read tasks
    const user = await authorize(request, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get task ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const taskId = parseInt(id || '', 10);

    if (!taskId || isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check institution access (Crucial multi-tenancy check)
    if (task.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: task }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/tasks/task]', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/task?id={taskId}
 * Update task with role-based field restrictions
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authorize user with RBAC - only roles with edit:tasks permission can update tasks
    const user = await authorize(req, 'edit:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get task ID from query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const taskId = parseInt(id || '', 10);

    if (!taskId || isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!existingTask) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check institution access for the task being modified
    if (existingTask.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check permission - Only Admin or Creator can initiate a PATCH
    // Note: Field-level restrictions apply AFTER this initial check.
    if (!hasRole(user, ['admin']) && existingTask.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const delta = await req.json();
    const now = new Date().toISOString();

    // Build update object based on role
    const updates: any = {
      updatedAt: now,
    };

    // Fields anyone who passes canModify can update (Creator, Team, Admin)
    if (delta.title !== undefined) updates.title = delta.title;
    if (delta.description !== undefined) updates.description = delta.description;
    if (delta.dueDate !== undefined) updates.dueDate = delta.dueDate;

    // Fields only team/admin can update
    if (hasRole(user, ['team', 'admin'])) {
      if (delta.priority !== undefined) updates.priority = delta.priority as TaskPriority;
      if (delta.assignedToId !== undefined) updates.assignedToId = delta.assignedToId;
    }

    // Fields only admin can update
    if (hasRole(user, ['admin'])) {
      if (delta.status !== undefined) updates.status = delta.status as TaskStatus;
      // New field: reviewStatus - restricted to Admin
      if (delta.reviewStatus !== undefined) updates.reviewStatus = delta.reviewStatus;
    }

    // Check if any fields other than 'updatedAt' were actually set for update
    if (Object.keys(updates).length === 1 && updates.updatedAt === now) {
      return NextResponse.json({ error: 'Nothing to update or no permission to update the requested fields' }, { status: 400 });
    }

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();

    // The query above will always return one element if successful because the WHERE clause is on a unique ID.
    // However, including a check for 'updated' safety is good practice, though unlikely to fail here.
    if (!updated) {
      return NextResponse.json({ error: 'Update failed or task vanished' }, { status: 500 });
    }

    // Send notifications to task creator when task is modified by others
    if (existingTask.createdById !== user.id) {
      // Check if this update involved assignment, status change, or priority change
      const isAssignment = delta.assignedToId !== undefined;
      const isStatusChange = delta.status !== undefined;
      const isPriorityChange = delta.priority !== undefined;

      if (isAssignment || isStatusChange || isPriorityChange) {
        // Get the task creator
        const [creator] = await db
          .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email
          })
          .from(users)
          .where(eq(users.id, existingTask.createdById));

        if (creator) {
          let notificationTitle = '';
          let notificationBody = '';

          if (isAssignment) {
            const assignedUser = delta.assignedToId ?
              await db.select({ fullName: users.fullName })
                .from(users)
                .where(eq(users.id, delta.assignedToId))
                .then((res: any) => res[0]?.fullName || 'Unknown User') :
              'Unassigned';

            notificationTitle = 'Task Assigned';
            notificationBody = `Your task "${updated.title}" has been assigned to ${assignedUser} by ${user.fullName}.`;
          } else if (isStatusChange) {
            notificationTitle = 'Task Status Changed';
            notificationBody = `The status of your task "${updated.title}" has been changed to "${delta.status}" by ${user.fullName}.`;
          } else if (isPriorityChange) {
            notificationTitle = 'Task Priority Changed';
            notificationBody = `The priority of your task "${updated.title}" has been changed to "${delta.priority}" by ${user.fullName}.`;
          }

          // Create notification for task creator
          const now = new Date().toISOString();
          await db.insert(notifications).values({
            userId: creator.id,
            type: 'task_update',
            title: notificationTitle,
            body: notificationBody,
            readAt: null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/tasks/task]', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/task?id={taskId}
 * Delete task (admin or creator only)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authorize user with RBAC - only roles with delete:tasks permission can delete tasks
    const user = await authorize(req, 'delete:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get task ID from query parameters
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const taskId = parseInt(id || '', 10);

    if (!taskId || isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check institution access
    if (task.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only admin or creator can delete
    if (!hasRole(user, ['admin']) && task.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/tasks/task]', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}