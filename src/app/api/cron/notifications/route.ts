// src/app/api/cron/notifications/route.ts
// Smart Notifications Cron - runs daily to send media team reminders

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks, notifications, events, equipmentBookings } from '@/db/schema';
import { and, eq, or, lt, sql, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Strict cron authorization
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get('Authorization');
        
        if (!cronSecret) {
            console.warn('[CRON] CRON_SECRET is not configured. Rejecting request for security.');
            return NextResponse.json({ error: 'Cron secret not configured' }, { status: 501 });
        }
        
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[CRON] Starting daily notification dispatch...');

        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const in1h = new Date(now.getTime() + 60 * 60 * 1000);
        const in2h_eq = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);

        const notificationsToInsert: {
            userId: number;
            type: string;
            title: string;
            body: string;
            created_at: string;
        }[] = [];

        const db = await getDb();

        // ── 1. EVENT REMINDERS ────────────────────────────────────────────────

        // 24h reminder
        const events24h = await db.select({
            id: events.id,
            title: events.title,
            createdById: events.createdById,
        }).from(events)
        .where(and(
            sql`${events.startTime} BETWEEN ${in24h.toISOString()} AND ${in25h.toISOString()}`,
            or(eq(events.approval_status, 'scheduled'), eq(events.approval_status, 'approved'))
        ));

        for (const event of events24h) {
            if (event.createdById) {
                notificationsToInsert.push({
                    userId: event.createdById,
                    type: 'media_reminder',
                    title: 'Event Starting Tomorrow',
                    body: `"${event.title}" starts in 24 hours. Make sure your team is ready.`,
                    created_at: now.toISOString()
                });
            }
        }

        // 2h reminder
        const events2h = await db.select({
            id: events.id,
            title: events.title,
            createdById: events.createdById,
        }).from(events)
        .where(and(
            sql`${events.startTime} BETWEEN ${in2h.toISOString()} AND ${in3h.toISOString()}`,
            or(eq(events.approval_status, 'scheduled'), eq(events.approval_status, 'approved'))
        ));

        for (const event of events2h) {
            if (event.createdById) {
                notificationsToInsert.push({
                    userId: event.createdById,
                    type: 'media_reminder',
                    title: 'Event Starting Soon',
                    body: `"${event.title}" starts in 2 hours!`,
                    created_at: now.toISOString()
                });
            }
        }

        // ── 2. TASK DEADLINE ALERTS ──────────────────────────────────────────
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

        // Due tomorrow
        const tasksDueTomorrow = await db.select({
            id: tasks.id,
            title: tasks.title,
            createdById: tasks.createdById,
        }).from(tasks)
        .where(and(
            sql`${tasks.due_date} BETWEEN ${tomorrow.toISOString()} AND ${tomorrowEnd.toISOString()}`,
            ne(tasks.status, 'done'),
            ne(tasks.status, 'completed'),
            eq(tasks.isArchived, false)
        ));

        for (const task of tasksDueTomorrow) {
            if (task.createdById) {
                notificationsToInsert.push({
                    userId: task.createdById,
                    type: 'task_reminder',
                    title: 'Task Due Tomorrow',
                    body: `"${task.title}" is due tomorrow. Make sure it's completed on time.`,
                    created_at: now.toISOString()
                });
            }
        }

        // Overdue tasks
        const overdueTasks = await db.select({
            id: tasks.id,
            title: tasks.title,
            createdById: tasks.createdById,
        }).from(tasks)
        .where(and(
            lt(tasks.due_date, now.toISOString()),
            ne(tasks.status, 'done'),
            ne(tasks.status, 'completed'),
            eq(tasks.isArchived, false)
        ));

        for (const task of overdueTasks) {
            if (task.createdById) {
                notificationsToInsert.push({
                    userId: task.createdById,
                    type: 'task_reminder',
                    title: 'Overdue Task',
                    body: `"${task.title}" is overdue! Please update its status.`,
                    created_at: now.toISOString()
                });
            }
        }

        // ── 3. EQUIPMENT BOOKING REMINDERS ──────────────────────────────────
        const bookingsSoon = await db.select({
            id: equipmentBookings.id,
            equipmentId: equipmentBookings.equipment_id,
            bookedBy: equipmentBookings.booked_by,
        }).from(equipmentBookings)
        .where(and(
            sql`${equipmentBookings.start_time} BETWEEN ${in1h.toISOString()} AND ${in2h_eq.toISOString()}`
        ));

        for (const booking of bookingsSoon) {
            const parsedBookedBy = parseInt(booking.bookedBy, 10);
            if (!isNaN(parsedBookedBy)) {
                notificationsToInsert.push({
                    userId: parsedBookedBy,
                    type: 'equipment_reminder',
                    title: 'Equipment Reservation Starting Soon',
                    body: `Your reserved equipment starts in 1 hour. Make sure you're ready to pick it up.`,
                    created_at: now.toISOString()
                });
            }
        }

        // ── 4. INSERT ALL NOTIFICATIONS ──────────────────────────────────────
        if (notificationsToInsert.length > 0) {
            await db.insert(notifications).values(notificationsToInsert);
        }

        return NextResponse.json({
            success: true,
            sent: notificationsToInsert.length,
            breakdown: {
                events_24h: events24h.length,
                events_2h: events2h.length,
                tasks_due_tomorrow: tasksDueTomorrow.length,
                tasks_overdue: overdueTasks.length,
                equipment_reminders: bookingsSoon.length
            }
        });
    } catch (error) {
        console.error('[CRON /api/cron/notifications]', error);
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }
}
