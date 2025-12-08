// src/app/api/tasks/[id]/activity/route.ts
// Endpoint to get task activity timeline

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskActivity, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = parseInt(id, 10);

    if (!taskId || isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Check if task exists
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get task activity timeline
    const activities = await db
      .select()
      .from(taskActivity)
      .where(eq(taskActivity.taskId, taskId))
      .orderBy(taskActivity.createdAt);

    // Return the activities
    return NextResponse.json(
      { 
        activities
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/tasks/[id]/activity]', error);
    return NextResponse.json(
      { error: 'Failed to fetch task activity' },
      { status: 500 }
    );
  }
}