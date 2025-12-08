import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest, isAdmin } from '../../../_lib/auth';

/**
 * POST /api/tasks/[id]/assign
 * Assign task to user (admin only)
 * Body: { assignedToId: number }
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

    // Only admin can assign tasks
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only admins can assign tasks' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const taskId = parseInt(id, 10);

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const { assignedToId } = body;

    if (assignedToId !== null && typeof assignedToId !== 'number') {
      return NextResponse.json(
        { error: 'assignedToId must be a number or null' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const [updated] = await db
      .update(tasks)
      .set({
        assignedToId,
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/tasks/[id]/assign]', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}
