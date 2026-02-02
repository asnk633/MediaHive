import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { performanceSnapshots, users, adminInterventionNotes, auditLog } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { authorizeByPermission } from '@/lib/auth-server';
import { analyzeTrend, extractIpsScores } from '@/utils/trendAnalysis';
import { analyzeUserBenchmark } from '@/utils/benchmarkAnalysis';
import { analyzeEarlyWarning } from '@/utils/earlyWarningAnalysis';
import { convertToCSV, logExportAction } from '@/utils/exportHelpers';

/**
 * GET /api/admin/exports/user/:userId
 * Export individual performance history
 * Params: period (opt), from (opt), to (opt), format (csv|json)
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Authorization
        const authResult = await authorizeByPermission('read:reports');
        if (!authResult.authorized || !authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const currentAdmin = authResult.user;

        const { userId: userIdParam } = await params;
        const userId = parseInt(userIdParam);
        if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';
        const period = searchParams.get('period');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        const db = await getDb();

        // 2. Fetch User Profile
        const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (userResult.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        const targetUser = userResult[0];

        // 3. Build Query for Snapshots
        let conditions = [eq(performanceSnapshots.userId, userId)];
        if (period) {
            conditions.push(eq(performanceSnapshots.period, period));
        } else {
            if (fromDate) conditions.push(gte(performanceSnapshots.period, fromDate));
            if (toDate) conditions.push(lte(performanceSnapshots.period, toDate));
        }

        const snapshots = await db
            .select()
            .from(performanceSnapshots)
            .where(and(...conditions))
            .orderBy(desc(performanceSnapshots.period));

        // 4. Fetch Interventions
        const interventions = await db
            .select()
            .from(adminInterventionNotes)
            .where(eq(adminInterventionNotes.userId, userId)); // Filtering by period locally for easier mapping

        // 5. Compute Analysis & Merge Data
        // To compute Trend/EarlyWarning, we essentially need the full history context, 
        // but let's calculate based on the dataset required?
        // Actually, "Early warning" in export usually means "What was the risk at that time?".
        // But our system calculates it live.
        // For the export, we can re-calculate it for each row if we have enough context.
        // Simplified approach: Calculate simple trend/status from the snapshot data available.
        // Or fetch FULL history separately to compute accurate metrics if "from/to" cuts off context?
        // Let's stick to calculating based on the retrieved rows for now to respect performance.

        // However, Trend needs previous month. If we filter specific period, we lose trend context?
        // Ideally we fetch a bit more context or accept null trend for isolated exports.
        // Let's proceed with mapping available data.

        const exportRows = snapshots.map((snap: any) => {
            const intervention = interventions.find((i: any) => i.period === snap.period);
            return {
                userId: targetUser.id,
                userName: targetUser.fullName,
                period: snap.period,
                ips: snap.individualPerformanceScore,
                ipsPercentage: Math.round(snap.individualPerformanceScore * 100) + '%',
                status: snap.performanceStatus,
                assignedTasks: snap.assignedTasks,
                completedTasks: snap.completedTasks,
                overdueTasks: snap.overdueTasks,
                interventionNote: intervention?.note || '',
                interventionAction: intervention?.actionType || '',
                interventionRiskAtTime: intervention?.riskLevelAtTime || '',
                generatedAt: snap.generatedAt
            };
        });

        // 6. Audit Logging
        // 6. Audit Logging
        await logExportAction(db, currentAdmin as any, 'user_performance', String(userId), format, { period, from: fromDate, to: toDate });

        // 7. Return Response
        // 7. Return Response
        if (format === 'csv') {
            const csvContent = convertToCSV(exportRows, [
                { header: 'User ID', key: (r: any) => r.userId },
                { header: 'Name', key: (r: any) => r.userName },
                { header: 'Period', key: (r: any) => r.period },
                { header: 'IPS', key: (r: any) => r.ipsPercentage },
                { header: 'Status', key: (r: any) => r.status },
                { header: 'Tasks Assigned', key: (r: any) => r.assignedTasks },
                { header: 'Tasks Completed', key: (r: any) => r.completedTasks },
                { header: 'Overdue', key: (r: any) => r.overdueTasks },
                { header: 'Intervention Note', key: (r: any) => r.interventionNote },
                { header: 'Intervention Action', key: (r: any) => r.interventionAction },
                { header: 'Risk At Time', key: (r: any) => r.interventionRiskAtTime },
                { header: 'Generated At', key: (r: any) => r.generatedAt?.toString() }
            ]);

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="performance_export_${userId}_${Date.now()}.csv"`
                }
            });
        } else {
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
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
