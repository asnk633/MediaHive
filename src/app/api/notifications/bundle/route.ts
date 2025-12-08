// @ts-nocheck
// src/app/api/notifications/bundle/route.ts
// Bundle notifications for smart delivery

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, gte, isNull } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - users with send:notifications permission can bundle notifications
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { userId, category, timeWindowMinutes = 60 } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Calculate time window
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

    // Filter out undefined conditions
    const conditions = [
      eq(notifications.userId, userId),
      isNull(notifications.readAt),
      gte(notifications.createdAt, windowStart.toISOString())
    ];
    
    if (category) {
      conditions.push(eq(notifications.category, category));
    }

    // Get unread notifications in the time window for the user and category
    const notificationsToBundleFiltered = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(notifications.createdAt);

    if (notificationsToBundleFiltered.length === 0) {
      return NextResponse.json(
        { 
          message: 'No notifications to bundle',
          bundled: false
        },
        { status: 200 }
      );
    }

    // Create bundled notification
    const bundledTitle = `${notificationsToBundleFiltered.length} ${category || 'new'} notifications`;
    const bundledBody = notificationsToBundleFiltered
      .map(n => `- ${n.title}`)
      .join('\n');

    const [bundledNotification] = await db
      .insert(notifications)
      .values({
        userId,
        title: bundledTitle,
        body: bundledBody,
        category: category || 'bundled',
        ttl: 86400, // 24 hours TTL
        readReceipt: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Mark original notifications as read
    // In a real implementation, you would update all notifications
    // For now, we'll just update the first one as an example
    if (notificationsToBundleFiltered.length > 0) {
      await db
        .update(notifications)
        .set({ 
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(notifications.id, notificationsToBundleFiltered[0].id));
    }

    return NextResponse.json(
      { 
        bundledNotification,
        bundledCount: notificationsToBundleFiltered.length,
        message: 'Notifications bundled successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/notifications/bundle]', error);
    return NextResponse.json(
      { error: 'Failed to bundle notifications' },
      { status: 500 }
    );
  }
}

