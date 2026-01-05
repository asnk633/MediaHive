import 'server-only';
import { getDb } from '@/db';
import { performanceSnapshots, departmentHealthSnapshots, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface PerformanceSnapshotData {
    id: number;
    userId: number;
    period: string;
    assignedTasks: number;
    completedTasks: number;
    onTimeCompletedTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    onTimeRate: number;
    overdueLoadRatio: number;
    avgDelayHours: number;
    avgDailyHours: number;
    attendanceDisciplineScore: number;
    individualPerformanceScore: number;
    performanceStatus: string;
    negativeDisciplineDays: number;
    tenantId: number;
    generatedAt: string;
    // User data (joined)
    userName?: string;
    userAvatarUrl?: string | null;
}

export interface DepartmentHealthSnapshotData {
    id: number;
    period: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgCompletionRate: number;
    avgOnTimeRate: number;
    avgAttendanceScore: number;
    departmentHealthScore: number;
    healthStatus: string;
    tenantId: number;
    generatedAt: string;
}

/**
 * Read all performance snapshots for a given period
 * Joins with users table to get user names and avatars
 */
export async function readPerformanceSnapshots(period: string): Promise<PerformanceSnapshotData[]> {
    const db = await getDb();

    const snapshots = await db
        .select({
            id: performanceSnapshots.id,
            userId: performanceSnapshots.userId,
            period: performanceSnapshots.period,
            assignedTasks: performanceSnapshots.assignedTasks,
            completedTasks: performanceSnapshots.completedTasks,
            onTimeCompletedTasks: performanceSnapshots.onTimeCompletedTasks,
            overdueTasks: performanceSnapshots.overdueTasks,
            taskCompletionRate: performanceSnapshots.taskCompletionRate,
            onTimeRate: performanceSnapshots.onTimeRate,
            overdueLoadRatio: performanceSnapshots.overdueLoadRatio,
            avgDelayHours: performanceSnapshots.avgDelayHours,
            avgDailyHours: performanceSnapshots.avgDailyHours,
            attendanceDisciplineScore: performanceSnapshots.attendanceDisciplineScore,
            individualPerformanceScore: performanceSnapshots.individualPerformanceScore,
            performanceStatus: performanceSnapshots.performanceStatus,
            negativeDisciplineDays: performanceSnapshots.negativeDisciplineDays,
            tenantId: performanceSnapshots.tenantId,
            generatedAt: performanceSnapshots.generatedAt,
            userName: users.fullName,
            userAvatarUrl: users.avatarUrl
        })
        .from(performanceSnapshots)
        .leftJoin(users, eq(performanceSnapshots.userId, users.id))
        .where(eq(performanceSnapshots.period, period));

    return snapshots as PerformanceSnapshotData[];
}

/**
 * Read department health snapshot for a given period
 * Returns null if not found
 */
export async function readDepartmentHealthSnapshot(period: string): Promise<DepartmentHealthSnapshotData | null> {
    const db = await getDb();

    const snapshots = await db
        .select()
        .from(departmentHealthSnapshots)
        .where(eq(departmentHealthSnapshots.period, period))
        .limit(1);

    return snapshots.length > 0 ? (snapshots[0] as DepartmentHealthSnapshotData) : null;
}

/**
 * Check if complete snapshots exist for a given period
 * Returns true only if BOTH performance AND department snapshots exist
 */
export async function hasCompleteSnapshots(period: string): Promise<boolean> {
    const db = await getDb();

    // Check for performance snapshots
    const perfSnapshots = await db
        .select({ count: performanceSnapshots.id })
        .from(performanceSnapshots)
        .where(eq(performanceSnapshots.period, period))
        .limit(1);

    if (perfSnapshots.length === 0) {
        return false;
    }

    // Check for department snapshot
    const deptSnapshots = await db
        .select({ count: departmentHealthSnapshots.id })
        .from(departmentHealthSnapshots)
        .where(eq(departmentHealthSnapshots.period, period))
        .limit(1);

    return deptSnapshots.length > 0;
}
