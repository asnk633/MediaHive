// src/app/api/locks/release/route.ts
// Endpoint to release a task edit lock

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editLocks, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { authorizeByPermission } from '../../_lib/rbac';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'write:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get task ID from request body
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
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

    // Release the lock if it belongs to the user
    const result = await db
      .delete(editLocks)
      .where(and(
        eq(editLocks.taskId, taskId),
        eq(editLocks.userId, user.id)
      ));

    // Return success
    return NextResponse.json(
      { 
        success: true,
        message: 'Lock released successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/locks/release]', error);
    return NextResponse.json(
      { error: 'Failed to release lock' },
      { status: 500 }
    );
  }
}