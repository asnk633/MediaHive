// src/app/api/notifications/read/route.ts
// Endpoint to mark notifications as read

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - all authenticated users can mark their notifications as read
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notification IDs from request body
    const { notificationIds } = await req.json();

    // Validate input
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400 }
      );
    }

    // Update notifications to mark them as read
    const readAt = new Date().toISOString();
    await db
      .update(notifications)
      .set({ readAt })
      .where(and(
        eq(notifications.userId, user.id),
        inArray(notifications.id, notificationIds)
      ));

    // Return success
    return NextResponse.json(
      { 
        success: true, 
        message: `${notificationIds.length} notifications marked as read`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/notifications/read]', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
