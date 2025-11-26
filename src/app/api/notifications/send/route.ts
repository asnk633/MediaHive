// src/app/api/notifications/send/route.ts
// Endpoint to send notifications (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { broadcastEvent } from '../../_lib/realtime';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admins can send notifications
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can send notifications' }, { status: 403 });
    }

    // Get notification data from request body
    const { userId, title, body } = await req.json();

    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Create the notification
    const [notification] = await db.insert(notifications).values({
      userId: userId || user.id, // If no userId specified, send to self
      title,
      body,
      createdAt: new Date().toISOString()
    }).returning();

    // Broadcast the notification in realtime
    broadcastEvent('notification', {
      type: 'new',
      notification
    });

    // Return success
    return NextResponse.json(
      { 
        success: true, 
        message: 'Notification sent successfully',
        notification
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/notifications/send]', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
