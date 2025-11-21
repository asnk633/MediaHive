// src/app/api/kanban/route.ts
// Kanban API endpoint returning grouped tasks by status

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authorizeByPermission } from '../_lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - all roles can read kanban data
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all tasks for the user's institution
    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.institutionId, user.institutionId))
      .orderBy(tasks.createdAt);

    // Group tasks by status
    const groupedTasks = {
      todo: allTasks.filter(task => task.status === 'todo'),
      in_progress: allTasks.filter(task => task.status === 'in_progress'),
      on_hold: allTasks.filter(task => task.status === 'on_hold'),
      done: allTasks.filter(task => task.status === 'done')
    };

    // Calculate counts per status
    const counts = {
      todo: groupedTasks.todo.length,
      in_progress: groupedTasks.in_progress.length,
      on_hold: groupedTasks.on_hold.length,
      done: groupedTasks.done.length
    };

    // Return the grouped tasks and metadata
    return NextResponse.json({
      tasks: groupedTasks,
      counts,
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalTasks: allTasks.length
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/kanban]', error);
    return NextResponse.json(
      { error: 'Failed to fetch kanban data' },
      { status: 500 }
    );
  }
}