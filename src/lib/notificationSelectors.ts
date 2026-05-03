// @ts-nocheck
import { AppNotification, NotificationPriority, NotificationType } from "@/types/notification";

/**
 * Priority values for sorting: High > Medium > Low
 */
const PRIORITY_VALUE: Record<NotificationPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

/**
 * Filter State Interface
 */
export interface NotificationFilterState {
    priority: NotificationPriority | 'all';
    type: NotificationType | 'all';
    status: 'all' | 'unread' | 'read';
    search: string;
}

/**
 * Sort notifications by Priority then Date (Newest first)
 */
export function sortNotifications(
    notifications: AppNotification[],
    mode: 'priority' | 'newest' | 'oldest' = 'priority'
): AppNotification[] {
    return [...notifications].sort((a, b) => {
        // Helper to get millis
        const getMillis = (date: any) => {
            if (date && typeof date === 'object' && 'seconds' in date) {
                return date.seconds * 1000;
            }
            if (date instanceof Date) return date.getTime();
            return new Date(date).getTime();
        };

        const timeA = getMillis(a.created_at);
        const timeB = getMillis(b.created_at);

        if (mode === 'newest') return timeB - timeA;
        if (mode === 'oldest') return timeA - timeB;

        // Default: Priority then Newest
        const priorityA = PRIORITY_VALUE[a.priority] || 0;
        const priorityB = PRIORITY_VALUE[b.priority] || 0;

        if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
        }
        return timeB - timeA; // Then newest
    });
}

/**
 * Group notifications by date headers
 */
export type DateGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older';

export interface GroupedNotifications {
    group: DateGroup;
    items: AppNotification[];
}

export function groupNotificationsByDate(notifications: AppNotification[]): GroupedNotifications[] {
    const groups: Record<DateGroup, AppNotification[]> = {
        'Today': [],
        'Yesterday': [],
        'Last 7 Days': [],
        'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - (86400000 * 7);

    notifications.forEach(n => {
        let d: Date;
        if (n.created_at && typeof n.created_at === 'object' && 'seconds' in n.created_at) {
            d = new Date(n.created_at.seconds * 1000);
        } else {
            d = new Date(n.created_at as any);
        }
        const t = d.getTime();

        if (t >= today) groups['Today'].push(n);
        else if (t >= yesterday) groups['Yesterday'].push(n);
        else if (t >= lastWeek) groups['Last 7 Days'].push(n);
        else groups['Older'].push(n);
    });

    // Return as array excluding empty groups
    const result: GroupedNotifications[] = [];
    (['Today', 'Yesterday', 'Last 7 Days', 'Older'] as DateGroup[]).forEach(key => {
        if (groups[key].length > 0) {
            result.push({ group: key, items: groups[key] });
        }
    });

    return result;
}

/**
 * Filter notifications based on active selection
 */
export function filterNotifications(
    notifications: AppNotification[],
    filters: NotificationFilterState
): AppNotification[] {
    return notifications.filter(n => {
        // 1. Status Filter
        if (filters.status === 'unread' && n.read) return false;
        if (filters.status === 'read' && !n.read) return false;

        // 2. Priority Filter
        if (filters.priority !== 'all' && n.priority !== filters.priority) return false;

        // 3. Type Filter
        if (filters.type !== 'all' && n.type !== filters.type) return false;

        // 4. Search Filter
        if (filters.search) {
            const query = filters.search.toLowerCase();
            const matchTitle = n.title.toLowerCase().includes(query);
            const matchMessage = n.message.toLowerCase().includes(query);
            if (!matchTitle && !matchMessage) return false;
        }

        return true;
    });
}

/**
 * Compute Badge Count: High/Medium Unread only
 */
export function computeBadgeCount(notifications: AppNotification[]): number {
    return notifications.filter(n =>
        !n.read &&
        (n.priority === 'high' || n.priority === 'medium')
    ).length;
}

/**
 * Count specific types for Admin Escalation
 */
export function computeEscalationCounts(notifications: AppNotification[]) {
    let overdue = 0;
    let stale = 0;
    let inventory = 0;

    notifications.forEach(n => {
        if (n.read) return;

        if (n.type === 'task_overdue') overdue++;
        if (n.type === 'stale_task_escalation') stale++;
        if (n.type === 'inventory_escalated') inventory++;
    });

    return { overdue, stale, inventory };
}
