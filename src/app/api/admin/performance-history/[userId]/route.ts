import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { performanceSnapshots, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authorizeByPermission } from '@/lib/auth-server';
import { analyzeTrend, extractIpsScores, type TrendClassification } from '@/utils/trendAnalysis';
import { analyzeUserBenchmark, type UserBenchmark } from '@/utils/benchmarkAnalysis';
import { analyzeEarlyWarning, type EarlyWarningResult } from '@/utils/earlyWarningAnalysis';

interface PerformanceHistoryItem {
    period: string;
    ips: number;
    ipsScore: number;
    status: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgDailyHours: number;
}

interface PerformanceHistoryResponse {
    userId: number;
    userName: string;
    avatarUrl: string | null;
    trend: TrendClassification;
    delta: number;
    benchmark: UserBenchmark;
    earlyWarning: EarlyWarningResult | null;
    history: PerformanceHistoryItem[];
}

/**
 * GET /api/admin/performance-history/:userId
 * Fetch historical performance snapshots for a specific user
 * Read-only, snapshot data only, no live computation
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // Authorization check
        const authResult = await authorizeByPermission('read:reports');
        if (!authResult.authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Await params in Next.js 15+
        const { userId: userIdParam } = await params;
        const userId = parseInt(userIdParam);
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Get months parameter (default: 6)
        const { searchParams } = new URL(request.url);
        const months = parseInt(searchParams.get('months') || '6');

        const db = await getDb();

        // Fetch user info
        const userResult = await db
            .select({
                id: users.id,
                fullName: users.fullName,
                avatarUrl: users.avatarUrl
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (userResult.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult[0];

        // Fetch performance snapshots for this user
        // Order by period ASC to show oldest to newest
        const snapshots = await db
            .select()
            .from(performanceSnapshots)
            .where(eq(performanceSnapshots.userId, userId))
            .orderBy(performanceSnapshots.period)
            .limit(months);

        // Map to response format
        const history: PerformanceHistoryItem[] = snapshots.map((s: any) => {
            // Map status from DB format to display format
            let status = 'Performing';
            if (s.performanceStatus === 'underperforming') status = 'Underperforming';
            else if (s.performanceStatus === 'at_risk') status = 'At Risk';

            return {
                period: s.period,
                ips: s.individualPerformanceScore,
                ipsScore: Math.round(s.individualPerformanceScore * 100),
                status,
                assignedTasks: s.assignedTasks,
                completedTasks: s.completedTasks,
                overdueTasks: s.overdueTasks,
                avgDailyHours: s.avgDailyHours
            };
        });

        // Analyze trend from IPS scores
        const ipsScores = extractIpsScores(history);
        const trendResult = analyzeTrend(ipsScores);

        // Calculate team benchmarks from latest snapshot period
        let benchmark: UserBenchmark;
        if (history.length > 0) {
            // Get latest period from user's history
            const latestPeriod = history[history.length - 1].period;

            // Fetch all team snapshots for this period
            const teamSnapshots = await db
                .select()
                .from(performanceSnapshots)
                .where(eq(performanceSnapshots.period, latestPeriod));

            // Extract all team IPS scores
            const teamIpsScores = teamSnapshots.map((s: any) =>
                Math.round(s.individualPerformanceScore * 100)
            );

            // Get user's latest IPS score
            const userLatestIps = history[history.length - 1].ipsScore;

            // Analyze user's position relative to team
            benchmark = analyzeUserBenchmark(userLatestIps, teamIpsScores);
        } else {
            // No history available
            benchmark = {
                teamMedian: 0,
                percentile: 0,
                relativeStatus: 'Insufficient Team Data'
            };
        }

        // Analyze early warning signals
        const earlyWarning = analyzeEarlyWarning(history, benchmark, trendResult.trend);

        const response: PerformanceHistoryResponse = {
            userId: user.id,
            userName: user.fullName,
            avatarUrl: user.avatarUrl,
            trend: trendResult.trend,
            delta: trendResult.delta,
            benchmark,
            earlyWarning,
            history
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('[API] Performance History Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
