import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks, users, attendance, departments, institutions } from '@/db/schema';
import { eq, and, desc, gte, lte, isNull, count, sql, avg } from 'drizzle-orm';
import { authorizeByPermission } from '../../../../lib/auth-server';

// --- Interfaces based on Spec 2.0 ---
interface DepartmentHealth {
    score: number;
    grade: 'Healthy' | 'Strained' | 'Poor Performance';
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgCompletionRate: number;
    avgOnTimeRate: number;
    overdueLoadRatio: number;
}

interface UnderperformingUser {
    userId: number;
    name: string;
    avatarUrl: string | null;
    // Columns for UI
    tasksAssigned: number;
    tasksCompleted: number;
    tasksOverdue: number; // pending overdue

    onTimeRate: number; // 0-100
    attendanceHours: number; // Avg DWD
    pendingTasks: number;

    ipsScore: number; // 0-100
    status: 'Performing' | 'At Risk' | 'Underperforming';
    insight: string; // "Worked 4.1h - 3 tasks overdue"
}

export async function GET(request: NextRequest) {
    console.log('[API] Intelligence: Start');
    console.log('[API] Intelligence: DATABASE_URL:', process.env.DATABASE_URL);
    try {
        const authResult = await authorizeByPermission('read:reports');
        if (!authResult.authorized) {
            console.log('[API] Intelligence: Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        console.log('[API] Intelligence: Authorized. Fetching DB...');
        const db = await getDb();
        console.log('[API] Intelligence: DB Fetched.');

        // --- MILESTONE 2.2: Snapshot Read Preference ---
        // Determine current period
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Import snapshot read service
        const { hasCompleteSnapshots, readPerformanceSnapshots, readDepartmentHealthSnapshot } = await import('@/lib/snapshot-read.server');

        // Check if snapshots exist for this period
        const snapshotsAvailable = await hasCompleteSnapshots(period);
        let source: 'snapshot' | 'live' = 'live';

        if (snapshotsAvailable) {
            // --- SNAPSHOT PATH ---
            console.info(`[AdminIntelligence] Using SNAPSHOT data for period ${period}`);
            source = 'snapshot';

            // Read snapshots
            const perfSnapshots = await readPerformanceSnapshots(period);
            const deptSnapshot = await readDepartmentHealthSnapshot(period);

            if (!deptSnapshot) {
                throw new Error('Department snapshot missing despite availability check');
            }

            // Map performance snapshots to underperforming users
            const underperformingUsers: UnderperformingUser[] = perfSnapshots
                .filter(s => s.performanceStatus !== 'performing')
                .map(s => {
                    // Map status from DB format to API format
                    let status: 'Performing' | 'At Risk' | 'Underperforming' = 'Performing';
                    if (s.performanceStatus === 'underperforming') status = 'Underperforming';
                    else if (s.performanceStatus === 'at_risk') status = 'At Risk';

                    // Generate insight (reuse existing logic)
                    const ipsScore = Math.round(s.individualPerformanceScore * 100);
                    let insight = '';

                    if (s.overdueTasks > 0) {
                        insight = `Pending ${s.overdueTasks} overdue tasks`;
                    } else if (s.onTimeRate < 0.7) {
                        insight = `Missed deadlines frequently (${Math.round(s.onTimeRate * 100)}% OTR)`;
                    }

                    return {
                        userId: s.userId,
                        name: s.userName || 'Unknown',
                        avatarUrl: s.userAvatarUrl || null,
                        tasksAssigned: s.assignedTasks,
                        tasksCompleted: s.completedTasks,
                        tasksOverdue: s.overdueTasks,
                        onTimeRate: Math.round(s.onTimeRate * 100),
                        attendanceHours: 0, // Not available in current logic
                        pendingTasks: s.assignedTasks - s.completedTasks,
                        ipsScore,
                        status,
                        insight
                    };
                })
                .sort((a, b) => a.ipsScore - b.ipsScore);

            // Map department snapshot to health score
            let grade: 'Healthy' | 'Strained' | 'Poor Performance' = 'Healthy';
            if (deptSnapshot.healthStatus === 'poor_performance') grade = 'Poor Performance';
            else if (deptSnapshot.healthStatus === 'strained') grade = 'Strained';

            const departmentHealth: DepartmentHealth = {
                score: Math.round(deptSnapshot.departmentHealthScore * 100),
                grade,
                totalTasks: deptSnapshot.totalTasks,
                completedTasks: deptSnapshot.completedTasks,
                overdueTasks: deptSnapshot.overdueTasks,
                avgCompletionRate: Math.round(deptSnapshot.avgCompletionRate * 100),
                avgOnTimeRate: Math.round(deptSnapshot.avgOnTimeRate * 100),
                overdueLoadRatio: Math.round((1 - deptSnapshot.avgOnTimeRate) * 100)
            };

            // Calculate team contribution from snapshots
            const teamContribution = perfSnapshots.map(s => ({
                name: s.userName || 'Unknown',
                completed: s.completedTasks
            }));

            // Calculate aging from snapshots (simplified - use overdue tasks)
            const aging = {
                '0-2 Days': 0,
                '3-7 Days': 0,
                '8-14 Days': 0,
                '14+ Days': deptSnapshot.overdueTasks
            };

            return NextResponse.json({
                departmentHealth,
                underperformingUsers,
                teamContribution,
                aging,
                source
            });
        }

        // --- LIVE COMPUTATION PATH (Fallback) ---
        console.info(`[AdminIntelligence] Using LIVE data for period ${period}`);
        source = 'live';

        // --- 1. Data Fetching (Last 30 Days) ---
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const startIso = start.toISOString();
        // now is already declared above in snapshot path

        console.log('[API] Intelligence: Fetching users...');
        const allUsers = await db.select().from(users).where(eq(users.role, 'team'));
        console.log(`[API] Intelligence: Found ${allUsers.length} team members.`);

        if (allUsers.length === 0) return NextResponse.json({ error: "No team members found" });

        console.log('[API] Intelligence: Fetching tasks...');
        const recentTasks = await db.select().from(tasks).where(gte(tasks.createdAt, startIso));
        const allActiveTasks = await db.select().from(tasks).where(desc(tasks.createdAt)); // Get all to filter in memory for simplicity or refine query

        // --- 2. Calculate Individual Performance (Per User) ---
        console.log('[API] Intelligence: Calculating performance...');
        const analysis = allUsers.map((user: any) => {
            try {
                // Task Sets
                const assigned = recentTasks.filter((t: any) => t.assignedToId === user.id);
                const active = allActiveTasks.filter((t: any) => t.assignedToId === user.id && t.status !== 'done');
                const completed = recentTasks.filter((t: any) => t.assignedToId === user.id && t.status === 'done');

                // 2.1 TCR (Task Completion Rate)
                const tcr = assigned.length > 0 ? (completed.length / assigned.length) : 0.5; // Default to 0.5 if no tasks to avoid 0 score unfairly? Or 1? Let's stick to logic: if 0 assigned, N/A. Let's say 1 (performing) if nothing assigned.
                // Actually, existing was 1. Let's keep 1.

                // 2.2 OTR (On Time Rate)
                const onTimeCompleted = completed.filter((t: any) => {
                    if (!t.dueDate) return true;
                    const doneAt = new Date(t.updatedAt);
                    const dueAt = new Date(t.dueDate);
                    return doneAt <= dueAt;
                });
                const otr = completed.length > 0 ? (onTimeCompleted.length / completed.length) : 1;

                // 2.3 OLR (Overdue Load Ratio)
                const overdue = active.filter((t: any) => t.dueDate && new Date(t.dueDate) < now);
                const activeCount = active.length;
                const olr = activeCount > 0 ? (overdue.length / activeCount) : 0;

                // 5. IPS (Individual Performance Score) - REWEIGHTED (No Attendance)
                // Previous: TCR 0.5 + OTR 0.3 + ADS 0.2
                // New: TCR 0.6 + OTR 0.4
                const ips = (tcr * 0.6) + (otr * 0.4);
                const ipsScore = Math.round(ips * 100);

                // Classification
                let status: 'Performing' | 'At Risk' | 'Underperforming' = 'Performing';
                if (ipsScore < 60) status = 'Underperforming';
                else if (ipsScore < 80) status = 'At Risk';

                let insight = "";
                if (status !== 'Performing') {
                    const overdueCount = overdue.length;

                    if (overdueCount > 0) {
                        insight = `Pending ${overdueCount} overdue tasks`;
                    } else if (onTimeCompleted.length < completed.length) {
                        insight = `Missed deadlines frequently (${Math.round(otr * 100)}% OTR)`;
                    } else if (tcr < 0.5) {
                        insight = `Low completion rate (${Math.round(tcr * 100)}%)`;
                    }
                }

                return {
                    user,
                    stats: { assigned: assigned.length, completed: completed.length, overdue: overdue.length },
                    metrics: { tcr, otr, olr },
                    scores: { ips, ipsScore },
                    status,
                    insight,
                    activeCount
                };
            } catch (mapError) {
                console.error(`[API] Intelligence: Error processing user ${user.id}:`, mapError);
                throw mapError;
            }
        });

        console.log('[API] Intelligence: Analysis complete.');

        // --- 3. Department Health (Aggregate) ---
        const activeUsers = analysis;

        const avgTCR = activeUsers.reduce((s: number, u: any) => s + u.metrics.tcr, 0) / (activeUsers.length || 1);
        const avgOTR = activeUsers.reduce((s: number, u: any) => s + u.metrics.otr, 0) / (activeUsers.length || 1);
        const avgOLR = activeUsers.reduce((s: number, u: any) => s + u.metrics.olr, 0) / (activeUsers.length || 1);

        // DHS Reweighted: TCR 0.5 + OTR 0.3 + (1-OLR) 0.2
        const dhs = (avgTCR * 0.5) + (avgOTR * 0.3) + ((1 - avgOLR) * 0.2);
        const dhsScore = Math.round(dhs * 100);

        let grade: 'Healthy' | 'Strained' | 'Poor Performance' = 'Healthy';
        if (dhsScore < 60) grade = 'Poor Performance';
        else if (dhsScore < 80) grade = 'Strained';

        const departmentHealth: DepartmentHealth = {
            score: dhsScore,
            grade,
            totalTasks: analysis.reduce((s: number, u: any) => s + u.stats.assigned, 0),
            completedTasks: analysis.reduce((s: number, u: any) => s + u.stats.completed, 0),
            overdueTasks: analysis.reduce((s: number, u: any) => s + u.stats.overdue, 0),
            avgCompletionRate: Math.round(avgTCR * 100),
            avgOnTimeRate: Math.round(avgOTR * 100),
            overdueLoadRatio: Math.round(avgOLR * 100)
        };

        // --- 4. Underperforming List ---
        const underperformingUsers: UnderperformingUser[] = analysis
            .filter((u: any) => u.status !== 'Performing')
            .map((u: any) => ({
                userId: u.user.id,
                name: u.user.fullName,
                avatarUrl: u.user.avatarUrl,
                tasksAssigned: u.stats.assigned,
                tasksCompleted: u.stats.completed,
                tasksOverdue: u.stats.overdue,
                onTimeRate: Math.round(u.metrics.otr * 100),
                // attendanceHours removed
                pendingTasks: u.activeCount,
                ipsScore: u.scores.ipsScore,
                status: u.status,
                insight: u.insight
            }))
            .sort((a: any, b: any) => a.ipsScore - b.ipsScore);

        // --- 5. Team Contribution ---
        const teamContribution = analysis
            .filter((u: any) => u.stats.completed > 0)
            .map((u: any) => ({
                name: u.user.fullName,
                value: u.stats.completed
            }))
            .sort((a: any, b: any) => b.value - a.value);

        // --- 6. Task Aging ---
        const aging = { '0-2 days': 0, '3-7 days': 0, '8-14 days': 0, '14+ days': 0 };
        allActiveTasks.forEach((t: any) => {
            if (t.status === 'done') return;
            const created = new Date(t.createdAt);
            const ageDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (ageDays <= 2) aging['0-2 days']++;
            else if (ageDays <= 7) aging['3-7 days']++;
            else if (ageDays <= 14) aging['8-14 days']++;
            else aging['14+ days']++;
        });

        console.log('[API] Intelligence: Success. Returning JSON.');
        return NextResponse.json({
            departmentHealth,
            underperformingUsers,
            teamContribution,
            aging,
            source
        });

    } catch (error: any) {
        console.error('[API] Intelligence: CRITICAL ERROR:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
