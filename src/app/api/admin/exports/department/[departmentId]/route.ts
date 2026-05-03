import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { departmentHealthSnapshots, auditLog } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { authorizeByPermission, verifyUser } from '@/lib/server/server-utils';
import { convertToCSV, logExportAction } from '@/utils/exportHelpers';
import { withTenantDrizzle } from '@/lib/tenantQuery';

/**
 * GET /api/admin/exports/department/:department_id
 * Export department health history
 * Params: period (opt), from (opt), to (opt), format (csv|json)
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ departmentId: string }> }
) {
    try {
        // 1. Authorization
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const currentAdmin = user;

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/admin/exports/department] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const { departmentId: deptIdParam } = await params;
        const department_id = parseInt(deptIdParam);
        if (isNaN(department_id)) return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';
        const period = searchParams.get('period');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        // 2. Fetch Snapshots
        const db = await getDb();
        let conditions = [
            withTenantDrizzle(departmentHealthSnapshots, tenantId)
        ];

        if (period) {
            conditions.push(eq(departmentHealthSnapshots.period, period));
        } else {
            if (fromDate) conditions.push(gte(departmentHealthSnapshots.period, fromDate));
            if (toDate) conditions.push(lte(departmentHealthSnapshots.period, toDate));
        }

        const snapshots = await db
            .select()
            .from(departmentHealthSnapshots)
            .where(and(...conditions))
            .orderBy(desc(departmentHealthSnapshots.period));

        const exportRows = snapshots.map((snap: any) => ({
            period: snap.period,
            healthScore: snap.departmentHealthScore,
            totalTasks: snap.totalTasks,
            completedTasks: snap.completedTasks,
            overdueTasks: snap.overdueTasks,
            completionRate: snap.avgCompletionRate,
            onTimeRate: snap.avgOnTimeRate,
            attendanceScore: snap.avgAttendanceScore,
            healthStatus: snap.healthStatus,
            generatedAt: snap.generatedAt
        }));

        // 3. Audit Logging
        await logExportAction(db, currentAdmin as any, 'department_health', String(department_id), format, { period, from: fromDate, to: toDate });

        // 4. Return Response
        if (format === 'csv') {
            const csvContent = convertToCSV(exportRows, [
                { header: 'Period', key: (r: any) => r.period },
                { header: 'Health Score', key: (r: any) => r.healthScore?.toFixed(2) },
                { header: 'Status', key: (r: any) => r.healthStatus },
                { header: 'Total Tasks', key: (r: any) => r.totalTasks },
                { header: 'Completed', key: (r: any) => r.completedTasks },
                { header: 'Overdue', key: (r: any) => r.overdueTasks },
                { header: 'Completion Rate', key: (r: any) => r.completionRate ? (r.completionRate * 100).toFixed(1) + '%' : '' },
                { header: 'On-Time Rate', key: (r: any) => r.onTimeRate ? (r.onTimeRate * 100).toFixed(1) + '%' : '' },
                { header: 'Attendance Score', key: (r: any) => r.attendanceScore ? (r.attendanceScore * 100).toFixed(1) + '%' : '' },
                { header: 'Generated At', key: (r: any) => r.generatedAt?.toString() }
            ]);

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="department_export_${department_id}_${Date.now()}.csv"`
                }
            });
        }
        else {
            return NextResponse.json({
                meta: {
                    generatedBy: currentAdmin.id,
                    timestamp: new Date().toISOString(),
                    count: exportRows.length
                },
                data: exportRows
            });
        }

    } catch (error: any) {
        console.error('DoE Export Error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
