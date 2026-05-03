// @ts-nocheck
// src/app/api/cron/notifications/route.ts
// Smart Notifications Cron - runs daily to send media team reminders

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, notifications, events, equipmentBookings } from '@/db/schema';
import { sql, and, gt, lt, eq, or, not } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Basic cron auth
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const in1h = new Date(now.getTime() + 60 * 60 * 1000);
        const in2h_eq = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000); // slight window

        const notificationsToInsert: any[] = [];

        // ── 1. EVENT REMINDERS ────────────────────────────────────────────────

        // 24h reminder
        const events24h = await db.execute(sql`
            SELECT id, title, start_at, created_by, tenant_id
            FROM events
            WHERE start_at BETWEEN ${in24h.toISOString()}::timestamptz AND ${in25h.toISOString()}::timestamptz
            AND (status = 'scheduled' OR status = 'approved')
        `);

        for (const event of (events24h.rows || [])) {
            const userId = (event.created_by as any);
            const tenantId = (event.tenant_id as any);
            if (userId && tenantId) {
                notificationsToInsert.push({
                    user_id: userId,
                    tenant_id: tenantId,
                    type: 'media_reminder',
                    title: 'Event Starting Tomorrow',
                    body: `"${event.title}" starts in 24 hours. Make sure your team is ready.`,
                    metadata: { eventId: event.id, reminder: '24h', group: 'Media Reminders' }
                });
            }
        }

        // 2h reminder
        const events2h = await db.execute(sql`
            SELECT id, title, start_at, created_by, tenant_id
            FROM events
            WHERE start_at BETWEEN ${in2h.toISOString()}::timestamptz AND ${in3h.toISOString()}::timestamptz
            AND (status = 'scheduled' OR status = 'approved')
        `);

        for (const event of (events2h.rows || [])) {
            const userId = (event.created_by as any);
            const tenantId = (event.tenant_id as any);
            if (userId && tenantId) {
                notificationsToInsert.push({
                    user_id: userId,
                    tenant_id: tenantId,
                    type: 'media_reminder',
                    title: 'Event Starting Soon',
                    body: `"${event.title}" starts in 2 hours!`,
                    metadata: { eventId: event.id, reminder: '2h', group: 'Media Reminders' }
                });
            }
        }

        // ── 2. TASK DEADLINE ALERTS ──────────────────────────────────────────
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

        // Due tomorrow
        const tasksDueTomorrow = await db.execute(sql`
            SELECT id, title, created_by, assigned_to, tenant_id
            FROM tasks
            WHERE due_date BETWEEN ${tomorrow.toISOString()}::timestamptz AND ${tomorrowEnd.toISOString()}::timestamptz
            AND status NOT IN ('done', 'completed')
            AND is_archived = false
        `);

        for (const task of (tasksDueTomorrow.rows || [])) {
            const userId = task.created_by as string;
            const tenantId = task.tenant_id as string;
            if (userId && tenantId) {
                notificationsToInsert.push({
                    user_id: userId,
                    tenant_id: tenantId,
                    type: 'task_reminder',
                    title: 'Task Due Tomorrow',
                    body: `"${task.title}" is due tomorrow. Make sure it's completed on time.`,
                    metadata: { taskId: task.id, reminder: 'due_tomorrow', group: 'Media Reminders' }
                });
            }
        }

        // Overdue tasks (not completed & past due)
        const overdueTasks = await db.execute(sql`
            SELECT id, title, created_by, assigned_to, tenant_id
            FROM tasks
            WHERE due_date < ${now.toISOString()}::timestamptz
            AND status NOT IN ('done', 'completed')
            AND is_archived = false
        `);

        for (const task of (overdueTasks.rows || [])) {
            const userId = task.created_by as string;
            const tenantId = task.tenant_id as string;
            if (userId && tenantId) {
                notificationsToInsert.push({
                    user_id: userId,
                    tenant_id: tenantId,
                    type: 'task_reminder',
                    title: 'Overdue Task',
                    body: `"${task.title}" is overdue! Please update its status.`,
                    metadata: { taskId: task.id, reminder: 'overdue', group: 'Media Reminders' }
                });
            }
        }

        // ── 3. EQUIPMENT BOOKING REMINDERS ──────────────────────────────────

        const bookingsSoon = await db.execute(sql`
            SELECT id, equipment_id, booked_by, tenant_id
            FROM equipment_bookings
            WHERE start_time BETWEEN ${in1h.toISOString()}::timestamptz AND ${in2h_eq.toISOString()}::timestamptz
        `);

        for (const booking of (bookingsSoon.rows || [])) {
            const userId = booking.booked_by as string;
            const tenantId = booking.tenant_id as string;
            if (userId && tenantId) {
                notificationsToInsert.push({
                    user_id: userId,
                    tenant_id: tenantId,
                    type: 'equipment_reminder',
                    title: 'Equipment Reservation Starting Soon',
                    body: `Your reserved equipment starts in 1 hour. Make sure you're ready to pick it up.`,
                    metadata: { bookingId: booking.id, equipmentId: booking.equipment_id, group: 'Media Reminders' }
                });
            }
        }

        // ── 4. INSERT ALL NOTIFICATIONS ──────────────────────────────────────
        if (notificationsToInsert.length > 0) {
            await db.execute(sql`
                INSERT INTO notifications (id, user_id, tenant_id, type, title, body, metadata, read, created_at)
                SELECT 
                    gen_random_uuid(),
                    (n->>'user_id')::uuid,
                    (n->>'tenant_id')::uuid,
                    n->>'type',
                    n->>'title', 
                    n->>'body',
                    (n->>'metadata')::jsonb,
                    false,
                    now()
                FROM jsonb_array_elements(${JSON.stringify(notificationsToInsert)}::jsonb) as n
            `);
        }

        return NextResponse.json({
            success: true,
            sent: notificationsToInsert.length,
            breakdown: {
                events_24h: events24h.rows?.length || 0,
                events_2h: events2h.rows?.length || 0,
                tasks_due_tomorrow: tasksDueTomorrow.rows?.length || 0,
                tasks_overdue: overdueTasks.rows?.length || 0,
                equipment_reminders: bookingsSoon.rows?.length || 0
            }
        });
    } catch (error) {
        console.error('[CRON /api/cron/notifications]', error);
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }
}
