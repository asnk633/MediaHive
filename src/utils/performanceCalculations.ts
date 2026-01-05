/**
 * Performance Calculations Utility
 * Extracted from /api/admin/intelligence for reuse in snapshot generation
 */

interface Task {
    id: number;
    assignedToId: number | null;
    status: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
}

interface AttendanceLog {
    userId: number;
    checkIn: string;
    checkOut: string | null;
    workedMinutes?: number;
}

export interface PerformanceMetrics {
    userId: number;
    tcr: number; // Task Completion Rate (0-1)
    otr: number; // On-Time Rate (0-1)
    olr: number; // Overdue Load Ratio (0-1)
    ads: number; // Attendance Discipline Score (0-1)
    ips: number; // Individual Performance Score (0-1)
    ipsScore: number; // IPS as percentage (0-100)
    status: 'Performing' | 'At Risk' | 'Underperforming';

    // Raw counts
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    activeTasks: number;
    onTimeCompletedTasks: number;

    // Attendance
    avgDailyHours: number;
    totalWorkedMinutes: number;
    attendanceDays: number;
}

/**
 * Calculate Individual Performance Score (IPS) for a user
 * Formula: (TCR*0.5) + (OTR*0.3) + (ADS*0.2)
 */
export function calculatePerformanceMetrics(
    userId: number,
    recentTasks: Task[],
    activeTasks: Task[],
    attendanceLogs: AttendanceLog[],
    now: Date = new Date()
): PerformanceMetrics {
    // Filter tasks for this user
    const assigned = recentTasks.filter(t => t.assignedToId === userId);
    const active = activeTasks.filter(t => t.assignedToId === userId && t.status !== 'done');
    const completed = recentTasks.filter(t => t.assignedToId === userId && t.status === 'done');

    // 1. Task Completion Rate (TCR)
    const tcr = assigned.length > 0 ? (completed.length / assigned.length) : 1;

    // 2. On-Time Rate (OTR)
    const onTimeCompleted = completed.filter(t => {
        if (!t.dueDate) return true;
        const doneAt = new Date(t.updatedAt);
        const dueAt = new Date(t.dueDate);
        return doneAt <= dueAt;
    });
    const otr = completed.length > 0 ? (onTimeCompleted.length / completed.length) : 1;

    // 3. Overdue Load Ratio (OLR)
    const overdue = active.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const activeCount = active.length;
    const olr = activeCount > 0 ? (overdue.length / activeCount) : 0;

    // 4. Attendance Discipline Score (ADS)
    const userLogs = attendanceLogs.filter(a => a.userId === userId);

    let sumAdsDay = 0;
    let validDays = 0;
    let totalMinutes = 0;

    userLogs.forEach(log => {
        let minutes = log.workedMinutes || 0;
        if (minutes === 0 && log.checkOut) {
            minutes = (new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime()) / 60000;
        }
        if (!log.checkOut) minutes = 0;

        totalMinutes += minutes;
        const hours = minutes / 60;
        const adsDay = Math.min(hours / 7.5, 1);
        sumAdsDay += adsDay;
        validDays++;
    });

    const ads = validDays > 0 ? (sumAdsDay / validDays) : 1;
    const avgDailyHours = validDays > 0 ? (totalMinutes / 60 / validDays) : 0;

    // 5. Individual Performance Score (IPS)
    const ips = (tcr * 0.5) + (otr * 0.3) + (ads * 0.2);
    const ipsScore = Math.round(ips * 100);

    // 6. Performance Status
    let status: 'Performing' | 'At Risk' | 'Underperforming' = 'Performing';
    if (ipsScore < 60) status = 'Underperforming';
    else if (ipsScore < 80) status = 'At Risk';

    return {
        userId,
        tcr,
        otr,
        olr,
        ads,
        ips,
        ipsScore,
        status,
        assignedTasks: assigned.length,
        completedTasks: completed.length,
        overdueTasks: overdue.length,
        activeTasks: active.length,
        onTimeCompletedTasks: onTimeCompleted.length,
        avgDailyHours,
        totalWorkedMinutes: totalMinutes,
        attendanceDays: validDays
    };
}

/**
 * Generate insight text for underperforming users
 */
export function generatePerformanceInsight(metrics: PerformanceMetrics): string {
    if (metrics.status === 'Performing') return '';

    const overdueCount = metrics.overdueTasks;
    const hoursStr = metrics.avgDailyHours.toFixed(1);

    if (overdueCount > 0) {
        if (metrics.avgDailyHours < 7.5) {
            return `Worked ${hoursStr}h avg — ${overdueCount} tasks overdue`;
        }
        return `Pending ${overdueCount} overdue tasks`;
    } else if (metrics.avgDailyHours < 7.5) {
        return `Low attendance: ${hoursStr}h avg`;
    } else if (metrics.tcr < 0.7) {
        return `Low completion rate: ${Math.round(metrics.tcr * 100)}%`;
    }

    return 'Performance below threshold';
}
