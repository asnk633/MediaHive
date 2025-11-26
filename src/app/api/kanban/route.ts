// @ts-nocheck
// src/app/api/kanban/route.ts
// Kanban API endpoint returning grouped tasks by status

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - all roles can read kanban data
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || null;

    // Build the base query conditions
    const conditions = [eq(tasks.institutionId, user.institutionId)];
    
    // Add status condition if provided
    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    // Fetch tasks with conditions
    const allTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(tasks.createdAt)
      .limit(limit)
      .offset(offset);

    // If requesting all tasks (no status filter), group by status
    let groupedTasks: Record<string, any[]> = {};
    let counts: Record<string, number> = {};
    
    if (!status) {
      // Group tasks by status
      groupedTasks = {
        todo: allTasks.filter(task => task.status === 'todo'),
        in_progress: allTasks.filter(task => task.status === 'in_progress'),
        on_hold: allTasks.filter(task => task.status === 'on_hold'),
        done: allTasks.filter(task => task.status === 'done')
      };

      // Calculate counts per status
      counts = {
        todo: groupedTasks.todo.length,
        in_progress: groupedTasks.in_progress.length,
        on_hold: groupedTasks.on_hold.length,
        done: groupedTasks.done.length
      };
    } else {
      // If filtering by status, return tasks in a flat array
      groupedTasks = { [status]: allTasks };
      counts = { [status]: allTasks.length };
    }

    // Return the grouped tasks and metadata
    return NextResponse.json({
      tasks: groupedTasks,
      counts,
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalTasks: allTasks.length,
        limit,
        offset,
        hasMore: allTasks.length === limit
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
