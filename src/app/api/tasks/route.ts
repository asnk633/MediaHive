import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { authorizeByPermission, hasRole } from '../_lib/rbac';
import { TaskStatus, TaskPriority } from '@/types';

/**
 * GET /api/tasks
 * List tasks with filters based on user role
 * Query params: filter (mine|team|all|review), search, institutionId
 */
export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - all roles can read tasks
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Build query conditions
    let conditions = [eq(tasks.institutionId, user.institutionId)];

    // Apply role-based filters
    if (filter === 'mine') {
      conditions.push(eq(tasks.assignedToId, user.id));
    } else if (filter === 'review' && !hasRole(user, ['admin'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
    
    // Apply search filter
    let data = result;
    if (search) {
      const term = search.toLowerCase();
      data = data.filter(t => 
        t.title.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term)
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/tasks]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create new task with role-based restrictions
 * Body: { title, description?, priority?, dueDate?, assignedToId? }
 */
export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only roles with write:tasks permission can create tasks
    const user = await authorizeByPermission(req, 'write:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body?.title || String(body.title).trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Role-based field restrictions
    let priority: TaskPriority = 'medium';
    let assignedToId: number | null = null;
    let status: TaskStatus = 'todo';

    if (hasRole(user, ['admin'])) {
      // Admin can set everything
      priority = (body.priority as TaskPriority) || 'medium';
      assignedToId = body.assignedToId || null;
      status = (body.status as TaskStatus) || 'todo';
    } else if (hasRole(user, ['team'])) {
      // Team can set priority and assign
      priority = (body.priority as TaskPriority) || 'medium';
      assignedToId = body.assignedToId || null;
    } else {
      // Guest: create with defaults only
      priority = 'medium';
      assignedToId = null;
      status = 'todo';
    }

    const [newTask] = await db.insert(tasks).values({
      title: String(body.title).trim(),
      description: body.description || null,
      status,
      priority,
      assignedToId,
      createdById: user.id,
      institutionId: user.institutionId,
      dueDate: body.dueDate || null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ data: newTask }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks]', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks (bulk update endpoint if needed)
 */
export async function PUT(req: NextRequest) {
  return NextResponse.json(
    { error: 'Use PUT /api/tasks/[id] for updates' },
    { status: 400 }
  );
}

/**
 * DELETE /api/tasks (requires task ID in body for safety)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authorize user with RBAC - only roles with write:tasks permission can delete tasks
    const user = await authorizeByPermission(req, 'write:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const taskId = body.id;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    // Fetch task to check ownership
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only admin or creator can delete
    if (!hasRole(user, ['admin']) && task.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/tasks]', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}