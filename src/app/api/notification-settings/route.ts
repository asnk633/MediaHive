// src/app/api/notification-settings/route.ts
// Notification settings API endpoints

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../_lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/notification-settings - Get user's notification settings
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, you would have a separate notification_settings table
    // For now, we'll return mock settings
    const settings = {
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      categories: {
        task: true,
        event: true,
        system: true,
        marketing: false
      },
      channels: {
        email: true,
        push: true,
        sms: false
      },
      crossDeviceSync: true
    };

    return NextResponse.json(
      { settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/notification-settings]', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/notification-settings - Update user's notification settings
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { quietHours, categories, channels, crossDeviceSync } = body;

    // In a real implementation, you would update a notification_settings table
    // For now, we'll just validate the input and return success
    
    // Validate quiet hours format if provided
    if (quietHours && quietHours.startTime && quietHours.endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(quietHours.startTime) || !timeRegex.test(quietHours.endTime)) {
        return NextResponse.json(
          { error: 'Invalid time format. Use HH:MM format.' },
          { status: 400 }
        );
      }
    }

    // Return updated settings
    const updatedSettings = {
      quietHours: quietHours || {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      categories: categories || {
        task: true,
        event: true,
        system: true,
        marketing: false
      },
      channels: channels || {
        email: true,
        push: true,
        sms: false
      },
      crossDeviceSync: crossDeviceSync !== undefined ? crossDeviceSync : true
    };

    return NextResponse.json(
      { settings: updatedSettings },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/notification-settings]', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
