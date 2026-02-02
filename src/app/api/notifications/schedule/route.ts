// src/app/api/notifications/schedule/route.ts
// Schedule notifications with smart features

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - users with send:notifications permission can schedule notifications
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { userId, title, body: notificationBody, category, scheduledAt, ttl } = body;

    // Validate required fields
    if (!userId || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    // Validate scheduled time (must be in the future)
    if (scheduledAt) {
      const scheduledTime = new Date(scheduledAt);
      if (scheduledTime <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
    }

    // Create notification
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        body: notificationBody,
        category: category || 'general',
        ttl: ttl || 86400, // Default 24 hours TTL
        readReceipt: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // In a real implementation, you would schedule this notification
    // using a job queue or background task system
    console.log(`Scheduled notification for user ${userId} at ${scheduledAt || 'now'}`);

    return NextResponse.json(
      { 
        notification,
        message: 'Notification scheduled successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/notifications/schedule]', error);
    return NextResponse.json(
      { error: 'Failed to schedule notification' },
      { status: 500 }
    );
  }
}
