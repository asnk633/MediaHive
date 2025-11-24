// @ts-nocheck
// src/app/api/notifications/list/route.ts
// Endpoint to list notifications for a user

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authorizeByPermission } from '../../_lib/rbac';

export async function GET(req: NextRequest) {
  try {
    // Authorize user with RBAC - all authenticated users can list their notifications
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notifications for the user
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(notifications.createdAt);

    // Return the notifications
    return NextResponse.json(
      { 
        notifications: userNotifications,
        unreadCount: userNotifications.filter(n => !n.readAt).length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/notifications/list]', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
