// src/app/api/cron/cleanup/route.ts
// Smart Database Cleanup Cron - runs daily

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tenants, tasks, taskComments } from '@/db/schema';
import { and, eq, or, lt, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Enforce strict cron authorization
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get('Authorization');

        if (!cronSecret) {
            console.warn('[CRON] CRON_SECRET is not configured. Rejecting request for security.');
            return NextResponse.json({ error: 'Cron secret not configured' }, { status: 501 });
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("[CRON] Starting daily task cleanup job...");

        const db = await getDb();

        // Get all tenants to iterate through
        const allTenants = await db.select().from(tenants);

        let totalChatCleanup = 0;
        let totalArchived = 0;
        let totalDeleted = 0;

        const nowMs = Date.now();
        const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgo = new Date(nowMs - 90 * 24 * 60 * 60 * 1000).toISOString();

        for (const tenant of allTenants) {
            console.log(`[CRON] Cleaning up for tenant: ${tenant.name} (ID: ${tenant.id})`);

            // 1. Chat Cleanup: Delete comments linked to tasks where tenant matches and tasks updated_at is older than 7 days
            const oldTasks = await db.select({ id: tasks.id })
                .from(tasks)
                .where(and(
                    eq(tasks.tenantId, tenant.id),
                    lt(tasks.updated_at, sevenDaysAgo)
                ));

            const oldTaskIds = oldTasks.map((t: { id: number }) => t.id);
            if (oldTaskIds.length > 0) {
                const chatCleanupRes = await db.delete(taskComments)
                    .where(and(
                        eq(taskComments.tenantId, tenant.id),
                        inArray(taskComments.taskId, oldTaskIds)
                    ));
                totalChatCleanup += (chatCleanupRes.changes || chatCleanupRes.rowCount || 0);
            }

            // 2. Task Archive: Archive tasks where status = 'completed'/'done' AND updated_at > 30 days
            const archiveTasksRes = await db.update(tasks)
                .set({ isArchived: true })
                .where(and(
                    eq(tasks.tenantId, tenant.id),
                    or(eq(tasks.status, 'done'), eq(tasks.status, 'completed')),
                    lt(tasks.updated_at, thirtyDaysAgo),
                    eq(tasks.isArchived, false)
                ));
            totalArchived += (archiveTasksRes.changes || archiveTasksRes.rowCount || 0);

            // 3. Task Delete: Permanently delete tasks older than 90 days.
            const deleteTasksRes = await db.delete(tasks)
                .where(and(
                    eq(tasks.tenantId, tenant.id),
                    or(eq(tasks.status, 'done'), eq(tasks.status, 'completed')),
                    lt(tasks.updated_at, ninetyDaysAgo)
                ));
            totalDeleted += (deleteTasksRes.changes || deleteTasksRes.rowCount || 0);
        }

        return NextResponse.json({
            success: true,
            message: "Cleanup complete",
            chatCleanupRows: totalChatCleanup,
            archivedTaskRows: totalArchived,
            deletedTaskRows: totalDeleted,
            tenantsProcessed: allTenants.length
        });
    } catch (error) {
        console.error('[CRON /api/cron/cleanup]', error);
        return NextResponse.json({ error: 'Failed to run cleanup job' }, { status: 500 });
    }
}
