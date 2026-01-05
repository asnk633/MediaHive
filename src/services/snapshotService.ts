/**
 * Snapshot Service
 * Generates and persists performance and department health snapshots
 *
 * ------------------------------------------------------------------
 * [CRITICAL SYSTEM PATH] - FEATURE FROZEN
 * ------------------------------------------------------------------
 * This file contains core logic for Accountability/Compliance.
 * DO NOT MODIFY calculations, thresholds, or sorting logic
 * without explicit written approval from Leadership.
 *
 * Locked Components:
 * - IPS Calculation
 * - Attendance Thresholds
 * - Snapshot Generation Logic
 * ------------------------------------------------------------------
 */

import { getDb } from '@/db';
import { tasks, users, attendance, performanceSnapshots, departmentHealthSnapshots } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { calculatePerformanceMetrics, PerformanceMetrics } from '@/utils/performanceCalculations';
import { calculateDepartmentHealth, DepartmentHealthMetrics } from '@/utils/departmentCalculations';

interface SnapshotGenerationResult {
    period: string;
    performanceSnapshotsCreated: number;
    departmentSnapshotsCreated: number;
    timestamp: string;
}

/**
 * Generate performance snapshots for all team members
 * @param period Format: YYYY-MM (e.g., "2026-01")
 */
export async function generatePerformanceSnapshots(period: string): Promise<number> {
    const db = await getDb();

    // Calculate date range for the period (last 30 days from now)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startIso = start.toISOString();

    // Fetch all team members
    const teamMembers = await db.select().from(users).where(eq(users.role, 'team'));

    if (teamMembers.length === 0) {
        console.log('[Snapshot Service] No team members found');
        return 0;
    }

    // Fetch tasks and attendance data
    const recentTasks = await db.select().from(tasks).where(gte(tasks.createdAt, startIso));
    const activeTasks = await db.select().from(tasks).where(eq(tasks.isArchived, false));
    const attendanceLogs = await db.select().from(attendance).where(gte(attendance.checkIn, startIso));

    // Calculate performance metrics for each user
    const allMetrics: PerformanceMetrics[] = [];
    let snapshotsCreated = 0;

    for (const user of teamMembers) {
        const metrics = calculatePerformanceMetrics(
            user.id,
            recentTasks as any[],
            activeTasks as any[],
            attendanceLogs as any[]
        );

        allMetrics.push(metrics);

        // Check if snapshot already exists for this user/period
        const existing = await db
            .select()
            .from(performanceSnapshots)
            .where(
                and(
                    eq(performanceSnapshots.userId, user.id),
                    eq(performanceSnapshots.period, period)
                )
            );

        if (existing.length > 0) {
            console.log(`[Snapshot Service] Snapshot already exists for user ${user.id} period ${period}`);
            continue;
        }

        // Insert snapshot
        await db.insert(performanceSnapshots).values({
            userId: user.id,
            period,
            assignedTasks: metrics.assignedTasks,
            completedTasks: metrics.completedTasks,
            onTimeCompletedTasks: metrics.onTimeCompletedTasks,
            overdueTasks: metrics.overdueTasks,
            taskCompletionRate: metrics.tcr,
            onTimeRate: metrics.otr,
            overdueLoadRatio: metrics.olr,
            avgDelayHours: 0, // TODO: Calculate if needed
            avgDailyHours: metrics.avgDailyHours,
            attendanceDisciplineScore: metrics.ads,
            individualPerformanceScore: metrics.ips,
            performanceStatus: metrics.status.toLowerCase().replace(' ', '_'),
            negativeDisciplineDays: 0, // TODO: Calculate from attendance if needed
            tenantId: user.tenantId,
            generatedAt: new Date().toISOString()
        });

        snapshotsCreated++;
    }

    console.log(`[Snapshot Service] Created ${snapshotsCreated} performance snapshots for period ${period}`);
    return snapshotsCreated;
}

/**
 * Generate department health snapshot
 * @param period Format: YYYY-MM (e.g., "2026-01")
 */
export async function generateDepartmentHealthSnapshots(period: string): Promise<number> {
    const db = await getDb();

    // Calculate date range
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startIso = start.toISOString();

    // Fetch all team members
    const teamMembers = await db.select().from(users).where(eq(users.role, 'team'));

    if (teamMembers.length === 0) {
        console.log('[Snapshot Service] No team members found for department health');
        return 0;
    }

    // Fetch tasks and attendance data
    const recentTasks = await db.select().from(tasks).where(gte(tasks.createdAt, startIso));
    const activeTasks = await db.select().from(tasks).where(eq(tasks.isArchived, false));
    const attendanceLogs = await db.select().from(attendance).where(gte(attendance.checkIn, startIso));

    // Calculate performance metrics for all users
    const allMetrics: PerformanceMetrics[] = [];
    if (Array.isArray(teamMembers)) {
        for (const user of teamMembers) {
            allMetrics.push(calculatePerformanceMetrics(
                user.id,
                recentTasks as any[],
                activeTasks as any[],
                attendanceLogs as any[]
            ));
        }
    }

    // Calculate department health
    const deptHealth = calculateDepartmentHealth(allMetrics);

    // Check if snapshot already exists for this period
    const existing = await db
        .select()
        .from(departmentHealthSnapshots)
        .where(eq(departmentHealthSnapshots.period, period));

    if (existing.length > 0) {
        console.log(`[Snapshot Service] Department health snapshot already exists for period ${period}`);
        return 0;
    }

    // Get tenant ID from first user (assuming single-tenant for now)
    const tenantId = teamMembers[0].tenantId;

    // Insert department health snapshot
    await db.insert(departmentHealthSnapshots).values({
        period,
        totalTasks: deptHealth.totalTasks,
        completedTasks: deptHealth.completedTasks,
        overdueTasks: deptHealth.overdueTasks,
        avgCompletionRate: deptHealth.avgTCR,
        avgOnTimeRate: deptHealth.avgOTR,
        avgAttendanceScore: deptHealth.avgADS,
        departmentHealthScore: deptHealth.dhs,
        healthStatus: deptHealth.status.toLowerCase().replace(' ', '_'),
        tenantId,
        generatedAt: new Date().toISOString()
    });

    console.log(`[Snapshot Service] Created department health snapshot for period ${period}`);
    return 1;
}

/**
 * Main orchestrator: Generate all snapshots for current period
 */
export async function generateDailySnapshots(): Promise<SnapshotGenerationResult> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[Snapshot Service] Starting snapshot generation for period: ${period}`);

    try {
        const performanceCount = await generatePerformanceSnapshots(period);
        const departmentCount = await generateDepartmentHealthSnapshots(period);

        const result: SnapshotGenerationResult = {
            period,
            performanceSnapshotsCreated: performanceCount,
            departmentSnapshotsCreated: departmentCount,
            timestamp: now.toISOString()
        };

        console.log('[Snapshot Service] Snapshot generation complete:', result);
        return result;
    } catch (error) {
        console.error('[Snapshot Service] Error generating snapshots:', error);
        throw error;
    }
}
