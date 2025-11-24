import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications, files, mediaReports, events, tasks, attendance, institutions } from '@/db/schema';

export async function GET(request: NextRequest) {
  const checks = {
    database: false,
    notifications: false,
    storage: false,
    schema: {
      users: false,
      mediaReports: false,
      events: false,
      tasks: false,
      attendance: false,
      institutions: false,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connectivity
    try {
      const dbCheck = await db.select().from(users).limit(1);
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check notifications system
    try {
      const notifCheck = await db.select().from(notifications).limit(1);
      checks.notifications = true;
    } catch (error) {
      console.error('Notifications health check failed:', error);
    }

    // Check storage/files system
    try {
      const storageCheck = await db.select().from(files).limit(1);
      checks.storage = true;
    } catch (error) {
      console.error('Storage health check failed:', error);
    }

    // Check critical table schemas
    try {
      await db.select().from(users).limit(1);
      checks.schema.users = true;
    } catch (error) {
      console.error('Users table schema check failed:', error);
    }

    try {
      await db.select().from(mediaReports).limit(1);
      checks.schema.mediaReports = true;
    } catch (error) {
      console.error('Media reports table schema check failed:', error);
    }

    try {
      await db.select().from(events).limit(1);
      checks.schema.events = true;
    } catch (error) {
      console.error('Events table schema check failed:', error);
    }

    try {
      await db.select().from(tasks).limit(1);
      checks.schema.tasks = true;
    } catch (error) {
      console.error('Tasks table schema check failed:', error);
    }

    try {
      await db.select().from(attendance).limit(1);
      checks.schema.attendance = true;
    } catch (error) {
      console.error('Attendance table schema check failed:', error);
    }

    try {
      await db.select().from(institutions).limit(1);
      checks.schema.institutions = true;
    } catch (error) {
      console.error('Institutions table schema check failed:', error);
    }

    // Determine overall status
    const allHealthy = checks.database && checks.notifications && checks.storage && 
      checks.schema.users && checks.schema.mediaReports && checks.schema.events && 
      checks.schema.tasks && checks.schema.attendance && checks.schema.institutions;
    const status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(
      {
        status,
        checks,
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        checks,
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
