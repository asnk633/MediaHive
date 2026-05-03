
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db'; // Drizzle Client
import { departmentHealthSnapshots, performanceSnapshots, adminInterventionNotes } from '@/db/schema';
import { verifyUser, authorizeByPermission } from '@/lib/server-utils';
import { eq, and, sql, desc } from 'drizzle-orm';

/*
 * ------------------------------------------------------------------
 * [CRITICAL SYSTEM PATH] - FEATURE FROZEN
 * ------------------------------------------------------------------
 * This file contains core logic for Accountability/Compliance.
 * DO NOT MODIFY calculations, thresholds, or sorting logic
 * without explicit written approval from Leadership.
 *
 * Locked Components:
 * - Automation Preview Logic
 * - Hypothetical Trigger Calculations
 * ------------------------------------------------------------------
 * Fix Applied: 2026-01-02 System Freeze
 */

export const dynamic = 'force-dynamic';

function getPreviousPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    if (month === 1) {
        return `${year - 1}-12`;
    }
    const prevMonth = month - 1;
    return `${year}-${prevMonth.toString().padStart(2, '0')}`;
}

function generateNarrative(current: any, previous: any): string[] {
    const narratives: string[] = [];

    // Health Narrative
    if (current.healthScore > 80) {
        narratives.push("Overall department health is continuously strong.");
    } else if (current.healthScore > 60) {
        narratives.push("Department health indicates moderate stability with room for optimization.");
    } else {
        narratives.push("Department health requires immediate strategic attention.");
    }

    // Trend Narrative
    const diff = current.healthScore - (previous?.healthScore || 0);
    if (!previous) {
        narratives.push("Baseline performance established for this period.");
    } else if (diff >= 2) {
        narratives.push("Performance metrics have improved compared to the previous month.");
    } else if (diff <= -2) {
        narratives.push("A slight decline in overall performance metrics has been observed.");
    } else {
        narratives.push("Performance metrics remain stable compared to the last period.");
    }

    // Risk Narrative
    const atRiskPct = current.totalUsers > 0 ? ((current.atRisk + current.underperforming) / current.totalUsers) * 100 : 0;
    if (atRiskPct > 30) {
        narratives.push("Significant portion of the workforce is flagging intervention indicators.");
    } else if (atRiskPct > 10) {
        narratives.push("Minor workforce segments are showing early risk indicators.");
    } else {
        narratives.push("No critical workforce risk trends detected.");
    }

    return narratives;
}

// --- Live Data Helper ---
async function calculateLiveMetrics(period: string) {
    // Replicating logic from /api/admin/intelligence for consistency
    const { tasks, users, attendance } = await import('@/db/schema');
    const { gte, eq } = await import('drizzle-orm');

    // Last 30 days window
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startIso = start.toISOString();

    // Fetch Data
    const db = await getDb();
    const teamMembers = await db.select().from(users).where(eq(users.role, 'team'));
    if (teamMembers.length === 0) return null;

    const recentTasks = await db.select().from(tasks).where(gte(tasks.created_at, startIso));
    const allActiveTasks = await db.select().from(tasks).where(eq(tasks.isArchived, false));
    const attendanceLogs = await db.select().from(attendance).where(gte(attendance.checkIn, startIso));

    // Calculate per-user metrics
    const analysis = teamMembers.map((user: any) => {
        // Task Sets
        const assigned = recentTasks.filter((t: any) => t.assignedToId === user.id);
        const active = allActiveTasks.filter((t: any) => t.assignedToId === user.id && t.status !== 'done');
        const completed = recentTasks.filter((t: any) => t.assignedToId === user.id && t.status === 'done');

        // Metrics
        const tcr = assigned.length > 0 ? (completed.length / assigned.length) : 1;

        const onTimeCompleted = completed.filter((t: any) => {
            if (!t.due_date) return true;
            return new Date(t.updated_at) <= new Date(t.due_date);
        });
        const otr = completed.length > 0 ? (onTimeCompleted.length / completed.length) : 1;

        // Attendance (ADS)
        const userLogs = attendanceLogs.filter((a: any) => a.userId === user.id);
        let sumAdsDay = 0;
        let validDays = 0;
        userLogs.forEach((log: any) => {
            let minutes = (log as any).workedMinutes || 0;
            if (minutes === 0 && log.checkOut) {
                minutes = (new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime()) / 60000;
            }
            if (!log.checkOut) minutes = 0;
            const adsDay = Math.min((minutes / 60) / 7.5, 1);
            sumAdsDay += adsDay;
            validDays++;
        });
        const ads = validDays > 0 ? (sumAdsDay / validDays) : 1;

        // IPS
        const ips = (tcr * 0.5) + (otr * 0.3) + (ads * 0.2);

        let status = 'performing';
        if (ips * 100 < 60) status = 'underperforming';
        else if (ips * 100 < 80) status = 'at_risk';

        return {
            tcr, otr, ads, ips, status,
            // OLR calculation for DHS
            olr: active.length > 0 ? (active.filter((t: any) => t.due_date && new Date(t.due_date) < new Date()).length / active.length) : 0
        };
    });

    // Aggregate Department Health
    const avgTCR = analysis.reduce((s: number, u: any) => s + u.tcr, 0) / analysis.length;
    const avgOTR = analysis.reduce((s: number, u: any) => s + u.otr, 0) / analysis.length;
    const avgADS = analysis.reduce((s: number, u: any) => s + u.ads, 0) / analysis.length;
    const avgOLR = analysis.reduce((s: number, u: any) => s + u.olr, 0) / analysis.length;

    const dhs = (avgTCR * 0.4) + (avgOTR * 0.3) + ((1 - avgOLR) * 0.2) + (avgADS * 0.1);

    // Risk Counts
    const riskMap = {
        performing: analysis.filter((u: any) => u.status === 'performing').length,
        at_risk: analysis.filter((u: any) => u.status === 'at_risk').length,
        underperforming: analysis.filter((u: any) => u.status === 'underperforming').length
    };

    // Attendance Risk (users with ADS < 0.85 approx)
    const attendanceRiskCount = analysis.filter((u: any) => u.ads < 0.85).length;

    return {
        avgScore: dhs * 100,
        avgCompletion: avgTCR * 100,
        avgAttendance: avgADS * 100,
        riskMap,
        attendanceRiskCount,
        totalUsers: analysis.length
    };
}

export async function GET(req: NextRequest) {
    try {
        // 1. Security Check
        // 1. Security Check
        const authResult = await authorizeByPermission(req, 'read:reports');

        if (!authResult.user) {
            console.warn('[API] Leadership Summary: No user found (401)');
            return NextResponse.json({ error: 'Unauthorized: Please sign in' }, { status: 401 });
        }

        if (!authResult.authorized) {
            console.warn(`[API] Leadership Summary: User ${authResult.user.email} missing permission (403)`);
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        // 2. Parse Query Params
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
        const prevPeriod = getPreviousPeriod(period);

        // 3. Fetch Snapshot Data concurrently
        const db = await getDb();
        const [
            currentHealth,
            prevHealth,
            riskStats,
            interventionStats,
            attendanceRiskStats
        ] = await Promise.all([
            db.select({
                avgScore: sql<number>`avg(${departmentHealthSnapshots.departmentHealthScore})`,
                avgCompletion: sql<number>`avg(${departmentHealthSnapshots.avgCompletionRate})`,
                avgAttendance: sql<number>`avg(${departmentHealthSnapshots.avgAttendanceScore})`
            })
                .from(departmentHealthSnapshots)
                .where(eq(departmentHealthSnapshots.period, period)),

            db.select({
                avgScore: sql<number>`avg(${departmentHealthSnapshots.departmentHealthScore})`
            })
                .from(departmentHealthSnapshots)
                .where(eq(departmentHealthSnapshots.period, prevPeriod)),

            db.select({
                status: performanceSnapshots.performanceStatus,
                count: sql<number>`count(*)`
            })
                .from(performanceSnapshots)
                .where(eq(performanceSnapshots.period, period))
                .groupBy(performanceSnapshots.performanceStatus),

            db.select({ count: sql<number>`count(*)` })
                .from(adminInterventionNotes)
                .where(eq(adminInterventionNotes.period, period)),

            db.select({ count: sql<number>`count(*)` })
                .from(performanceSnapshots)
                .where(and(
                    eq(performanceSnapshots.period, period),
                    sql`${performanceSnapshots.attendanceDisciplineScore} < 85`
                ))
        ]);

        // 4. Process Data & Fallback to Live if Snapshot Empty
        let currScore = currentHealth[0]?.avgScore || 0;
        let avgCompletion = currentHealth[0]?.avgCompletion || 0;
        let riskMap = { performing: 0, at_risk: 0, underperforming: 0 };
        const interventionCount = interventionStats[0]?.count || 0;
        let totalUsers = 0;

        // Check if snapshot data exists (currScore > 0 implies data exists, typically)
        // If currScore is 0 (and likely no entries), try Live Calculation
        if (currScore === 0) {
            console.log(`[LeadershipSummary] No snapshots for ${period}, falling back to Live Data.`);
            const liveData = await calculateLiveMetrics(period);
            if (liveData) {
                currScore = liveData.avgScore;
                avgCompletion = liveData.avgCompletion;
                riskMap = liveData.riskMap;
                totalUsers = liveData.totalUsers;
            }
        } else {
            // Use Snapshot Data
            riskStats.forEach((stat: any) => {
                const status = stat.status as keyof typeof riskMap;
                if (riskMap.hasOwnProperty(status)) {
                    riskMap[status] += stat.count;
                }
                totalUsers += stat.count;
            });
        }

        const prevScore = prevHealth[0]?.avgScore || 0; // Previous period remains snapshot-based or 0

        // 5. Construct Response
        const responseData = {
            period,
            departmentHealth: {
                score: Math.round(currScore),
                label: currScore >= 80 ? 'Healthy' : currScore >= 60 ? 'Strained' : 'Critical',
                trend: currScore > prevScore ? 'up' : currScore < prevScore ? 'down' : 'stable',
                stats: {
                    avgCompletionRate: Math.round(avgCompletion)
                    // avgAttendanceScore removed
                }
            },
            riskDistribution: {
                performing: riskMap.performing,
                atRisk: riskMap.at_risk,
                underperforming: riskMap.underperforming,
                total: totalUsers
            },
            interventions: {
                count: interventionCount
            },
            automationPreview: {
                enabled: false,
                hypotheticalTriggers: {
                    sustainedUnderperformance: riskMap.underperforming
                    // attendanceRisk removed
                },
                message: "Automated Interventions are strictly DISABLED. All actions require human review."
            },
            narrative: generateNarrative(
                {
                    healthScore: currScore,
                    totalUsers,
                    atRisk: riskMap.at_risk,
                    underperforming: riskMap.underperforming
                },
                {
                    healthScore: prevScore
                }
            )
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('GET /api/admin/leadership/summary error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
