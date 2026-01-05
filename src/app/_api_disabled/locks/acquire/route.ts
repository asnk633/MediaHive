// src/app/api/locks/acquire/route.ts
// Endpoint to acquire a task edit lock

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { editLocks, tasks } from '@/db/schema';
import { eq, gt, and } from 'drizzle-orm';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC
    const user = await authorizeByPermission(req, 'edit:tasks');
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

    // Check if there's already an active lock for this task
    const now = new Date().toISOString();
    const existingLocks = await db
      .select()
      .from(editLocks)
      .where(and(
        eq(editLocks.taskId, taskId),
        gt(editLocks.expiresAt, now)
      ));

    const existingLock = existingLocks.length > 0 ? existingLocks[0] : null;

    if (existingLock && existingLock.userId !== user.id) {
      // Another user has the lock
      return NextResponse.json(
        {
          error: 'Task is currently being edited by another user',
          lockedBy: existingLock.userId
        },
        { status: 409 }
      );
    }

    // Acquire or renew the lock
    const acquiredAt = now;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now

    const [lock] = await db
      .insert(editLocks)
      .values({
        taskId,
        userId: user.id,
        acquiredAt,
        expiresAt,
        createdAt: now
      })
      .onConflictDoUpdate({
        target: [editLocks.taskId],
        set: {
          userId: user.id,
          acquiredAt,
          expiresAt
        }
      })
      .returning();

    // Return success
    return NextResponse.json(
      {
        success: true,
        lock
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/locks/acquire]', error);
    return NextResponse.json(
      { error: 'Failed to acquire lock' },
      { status: 500 }
    );
  }
}