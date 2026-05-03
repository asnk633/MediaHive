import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, tasks } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Enforce basic security - verify a cron token if configured
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get('Authorization');

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("[CRON] Starting daily task cleanup job...");

        // Get all tenants to iterate through
        const allTenants = await db.select().from(tenants);

        let totalChatCleanup = 0;
        let totalArchived = 0;
        let totalDeleted = 0;

        for (const tenant of allTenants) {
            console.log(`[CRON] Cleaning up for tenant: ${tenant.name} (ID: ${tenant.id})`);

            // 1. Chat Cleanup: Delete messages linked to tasks where status = 'completed' AND completed_at older than 7 days
            const chatCleanupRes = await db.execute(sql`
                DELETE FROM task_comments 
                WHERE tenant_id = ${tenant.id}
                AND task_id IN (
                    SELECT id FROM tasks 
                    WHERE tenant_id = ${tenant.id}
                    AND updated_at < datetime('now', '-7 days')
                );
            `);
            totalChatCleanup += (chatCleanupRes.rowCount || 0);

            // 2. Task Archive: Archive tasks where status = 'completed' AND updated_at > 30 days
            const archiveTasksRes = await db.update(tasks)
                .set({ isArchived: true })
                .where(and(
                    eq(tasks.tenantId, tenant.id),
                    sql`(${tasks.status} = 'done' OR ${tasks.status} = 'completed')`,
                    sql`${tasks.updated_at} < datetime('now', '-30 days')`,
                    eq(tasks.isArchived, false)
                ));
            totalArchived += (archiveTasksRes.rowCount || 0);

            // 3. Task Delete: Permanently delete tasks older than 90 days.
            const deleteTasksRes = await db.delete(tasks)
                .where(and(
                    eq(tasks.tenantId, tenant.id),
                    sql`(${tasks.status} = 'done' OR ${tasks.status} = 'completed')`,
                    sql`${tasks.updated_at} < datetime('now', '-90 days')`
                ));
            totalDeleted += (deleteTasksRes.rowCount || 0);
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
