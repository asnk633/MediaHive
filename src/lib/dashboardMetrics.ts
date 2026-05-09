
import { startOfDay, endOfDay, isWithinInterval, addDays, parseISO, isPast, isToday, startOfWeek, endOfWeek, format } from 'date-fns';
import { NormalizedTask, NormalizedEvent } from '@/lib/normalization';

export interface DashboardMetrics {
    readonly dueToday: number;
    readonly overdue: number;
    readonly completedToday: number;
    readonly inProgress: number;
    readonly review: number;
    readonly todo: number;
    readonly blocked: number;
    readonly upcomingTasks: number;
    readonly totalTasks: number;
    readonly adminTotals: {
        readonly pendingApprovals: number;
        readonly globalOverdue: number;
        readonly onHold: number;
        readonly createdMe: number;
        readonly activeCampaignsCount: number;
    };
    readonly next7DayEvents: readonly NormalizedEvent[];
    readonly thisWeekEvents: readonly NormalizedEvent[];
    readonly performance: {
        readonly completedThisWeek: number;
        readonly avgCompletionTimeDays: number;
        readonly avgLeadTimeHours: number;
        readonly workloadDistribution: Record<string, number>;
        readonly productivityTrend: { date: string; count: number }[];
    };
}

export const EMPTY_METRICS: DashboardMetrics = {
    dueToday: 0,
    overdue: 0,
    completedToday: 0,
    inProgress: 0,
    review: 0,
    todo: 0,
    blocked: 0,
    upcomingTasks: 0,
    totalTasks: 0,
    adminTotals: {
        pendingApprovals: 0,
        globalOverdue: 0,
        onHold: 0,
        createdMe: 0,
        activeCampaignsCount: 0
    },
    next7DayEvents: [],
    thisWeekEvents: [],
    performance: {
        completedThisWeek: 0,
        avgCompletionTimeDays: 0,
        avgLeadTimeHours: 0,
        workloadDistribution: {},
        productivityTrend: []
    }
};

export const assertDashboardMetrics = (metrics: DashboardMetrics): void => {
    if (process.env.NODE_ENV === 'production') return;

    const isNonNeg = (n: any) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

    const baseValid =
        isNonNeg(metrics.dueToday) &&
        isNonNeg(metrics.overdue) &&
        isNonNeg(metrics.completedToday) &&
        isNonNeg(metrics.inProgress) &&
        isNonNeg(metrics.review) &&
        isNonNeg(metrics.todo) &&
        isNonNeg(metrics.blocked);

    if (!baseValid) console.error('DashboardMetrics Violation: Negative or Invalid Base Metrics', metrics);

    const admin = metrics.adminTotals;
    const adminValid =
        admin &&
        isNonNeg(admin.pendingApprovals) &&
        isNonNeg(admin.globalOverdue) &&
        isNonNeg(admin.onHold) &&
        isNonNeg(admin.createdMe) &&
        isNonNeg(admin.activeCampaignsCount);

    if (!adminValid) console.error('DashboardMetrics Violation: Invalid Admin Totals', admin);

    if (!Array.isArray(metrics.next7DayEvents) || !Array.isArray(metrics.thisWeekEvents)) {
        console.error('DashboardMetrics Violation: Event Arrays Missing');
    }
};

export const computeDashboardMetrics = (
    tasks: NormalizedTask[],
    events: NormalizedEvent[],
    currentUser?: { uid: string; role: string; institution_id?: string }
): DashboardMetrics => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const next7DaysEnd = endOfDay(addDays(now, 7));
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Filter out demo and deleted tasks/events to ensure metrics reflect production data
    const filteredTasks = tasks.filter(t => !t.deleted && !t.is_demo_data);
    const filteredEvents = events.filter(e => !(e as any).deleted && !(e as any).is_demo_data);
    
    // Use filtered arrays for all computations
    
    let dueToday = 0;
    let overdue = 0;
    let upcomingTasks = 0; // New
    let todoCount = 0;
    let completedToday = 0;
    let inProgress = 0;
    let onHold = 0;
    let review = 0;
    let pendingApprovals = 0;
    let globalOverdue = 0;
    let createdMe = 0;
    const activeCampaignIds = new Set<string>();

    // Performance Metrics Variables
    let completedThisWeekCount = 0;
    let totalCompletionTimeMs = 0;
    let completionsWithTime = 0;
    const workloadMap: Record<string, number> = {};
    const productivityMap: Record<string, number> = {};

    // Initialize productivity map for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const dateKey = format(addDays(now, -i), 'yyyy-MM-dd');
        productivityMap[dateKey] = 0;
    }

    filteredTasks.forEach(task => {
        const completed_at = task.completed_at;
        const isDone = task.status === 'done';
        const created_at = task.created_at;

        let isTaskOverdue = false;
        let isTaskDueToday = false;
        let isTaskUpcoming = false;

        if (!isDone && task.due_date) {
            const d = task.due_date;
            if (isPast(d) && !isToday(d)) isTaskOverdue = true;
            if (isWithinInterval(d, { start: todayStart, end: todayEnd })) isTaskDueToday = true;
            if (d > todayEnd && d <= next7DaysEnd) isTaskUpcoming = true;
        }

        // Active Campaigns
        if (task.campaign_id) {
            activeCampaignIds.add(task.campaign_id);
        }

        // Workload Distribution (only for incomplete tasks)
        if (!isDone && task.assigned_to) {
            const assignee = Array.isArray(task.assigned_to) 
                ? (task.assigned_to[0]?.name || 'Unassigned') 
                : (typeof task.assigned_to === 'string' ? task.assigned_to : 'Unassigned');
            workloadMap[assignee] = (workloadMap[assignee] || 0) + 1;
        }

        // Performance: Weekly Throughput & Turnaround
        if (isDone && completed_at) {
            // Weekly count
            if (isWithinInterval(completed_at, { start: weekStart, end: weekEnd })) {
                completedThisWeekCount++;
                
                // Turnaround time
                if (created_at) {
                    const duration = completed_at.getTime() - created_at.getTime();
                    if (duration > 0) {
                        totalCompletionTimeMs += duration;
                        completionsWithTime++;
                    }
                }
            }

            // Productivity Trend (Last 7 Days)
            const dateKey = format(completed_at, 'yyyy-MM-dd');
            if (productivityMap.hasOwnProperty(dateKey)) {
                productivityMap[dateKey]++;
            }
        }

        // Rule 1: MY Today (Legacy Composite used for "My Focus")
        // "Tasks Due" usually implies Overdue + Today
        if (isTaskDueToday || isTaskOverdue) {
            dueToday++;
        }

        // Stats: Strict Overdue
        if (isTaskOverdue) {
            overdue++;
            globalOverdue++;
        }

        // Stats: Upcoming
        if (isTaskUpcoming) {
            upcomingTasks++;
        }

        // Completed Today
        if (isDone && completed_at && isWithinInterval(completed_at, { start: todayStart, end: todayEnd })) {
            completedToday++;
        }

        // Status counts
        if (task.status === 'todo') todoCount++;
        if (task.status === 'in_progress') inProgress++;
        if (task.status === 'on_hold') onHold++;
        if (task.status === 'review') review++;

        // Admin Totals: Pending Approvals
        if (task.status === 'review' || task.approval_status === 'pending') {
            pendingApprovals++;
        }

        // Rule 4: Created By Me (Universal)
        if (currentUser && task.created_by) {
            const creatorUid = typeof task.created_by === 'string' ? task.created_by : task.created_by.uid;
            if (creatorUid === currentUser.uid) {
                createdMe++;
            }
        }
    });

    // Calculate Average Turnaround (days)
    const avgCompletionTimeDays = completionsWithTime > 0 
        ? (totalCompletionTimeMs / completionsWithTime) / (1000 * 60 * 60 * 24)
        : 0;

    // Convert productivity map to array
    const productivityTrend = Object.entries(productivityMap).map(([date, count]) => ({
        date,
        count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Rule 5: Upcoming Events (7 Days) - Inclusive
    const next7DayEvents = filteredEvents.filter(e => {
        const d = e.date;
        return d && isWithinInterval(d, { start: todayStart, end: next7DaysEnd });
    }).sort((a, b) => (a.date.getTime()) - (b.date.getTime()));

    // Rule 6: Weekly Events
    const thisWeekEvents = filteredEvents.filter(e => {
        const d = e.date;
        return d && isWithinInterval(d, { start: weekStart, end: weekEnd });
    }).sort((a, b) => (a.date.getTime()) - (b.date.getTime()));

    // "todo" maps to status 'todo'
    const todo = todoCount;

    // PARITY AUDIT LOG (Phase-3 Explicit Request)
    if (process.env.NODE_ENV !== 'production') {
        console.groupCollapsed('📊 DASHBOARD PARITY AUDIT (Phase-3)');
        console.table(tasks.map(t => ({
            id: t.id.substring(0, 5),
            title: t.title,
            status: t.status,
            approval: t.approval_status,
            due_date: t.due_date?.toLocaleDateString(),
            buckets: [
                (t.status === 'on_hold') ? 'OnHold' : null,
                (t.status === 'review' || t.approval_status === 'pending') ? 'PendingApproval' : null,
                (t.status === 'review') ? 'Review' : null,
            ].filter(Boolean).join(', ')
        })));
        console.log('Final Metrics:', { onHold, pendingApprovals, review });
        console.groupEnd();
    }

    return {
        dueToday,
        overdue,
        completedToday,
        inProgress,
        review,
        todo,
        blocked: onHold,
        upcomingTasks,
        totalTasks: filteredTasks.length,
        adminTotals: {
            pendingApprovals,
            globalOverdue,
            onHold,
            createdMe,
            activeCampaignsCount: activeCampaignIds.size
        },
        next7DayEvents,
        thisWeekEvents,
        performance: {
            completedThisWeek: completedThisWeekCount,
            avgCompletionTimeDays: Number(avgCompletionTimeDays.toFixed(1)),
            avgLeadTimeHours: completionsWithTime > 0 ? Math.round(totalCompletionTimeMs / completionsWithTime / (1000 * 60 * 60)) : 0,
            workloadDistribution: workloadMap,
            productivityTrend
        }
    };
};
