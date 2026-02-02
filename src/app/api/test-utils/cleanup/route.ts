// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { like } from 'drizzle-orm';
import { getUserFromRequest, isAdmin } from '@/app/api/_lib/auth';

// This endpoint is only available in development/test environments

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Only allow this endpoint in development or test environments
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      { error: 'Forbidden: This endpoint is only available in development/test environments' },
      { status: 403 }
    );
  }

  try {
    // Get user from request (session cookie or x-user-data header)
    const user = await getUserFromRequest(request);
    
    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can perform cleanup' },
        { status: 403 }
      );
    }

    // Delete test tasks (those with titles starting with "e2e seeded task")
    const deletedTasks = await db
      .delete(tasks)
      .where(like(tasks.title, 'e2e seeded task%'))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedTasks.length} test tasks`,
      deletedTasks: deletedTasks.map(task => ({ id: task.id, title: task.title }))
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during cleanup' },
      { status: 500 }
    );
  }
}
