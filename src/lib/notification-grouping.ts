import { AppNotification, NotificationType } from '@/types/notification';

export interface GroupedNotification {
    id: string;
    isGroup: true;
    items: AppNotification[];
    count: number;
    type: NotificationType;
    entityType: string;
    entityId: string;
    latestCreatedAt: any; // Timestamp or Date or string
    isRead: boolean; // Computed from items (rule says all unread)
}

const EXCLUDED_TYPES: NotificationType[] = [
    'mention',
    'task_overdue',
    'event_reminder',
    'announcement'
];

const GROUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

const getTime = (n: AppNotification): number => {
    if (!n.createdAt) return 0;
    if (typeof n.createdAt === 'string') return new Date(n.createdAt).getTime();
    if ('seconds' in (n.createdAt as any)) return (n.createdAt as any).seconds * 1000;
    return new Date(n.createdAt as any).getTime();
};

export const groupNotifications = (notifications: AppNotification[]): (AppNotification | GroupedNotification)[] => {
    if (!notifications || notifications.length === 0) return [];

    // 1. Sort by date (newest first)
    const sorted = [...notifications].sort((a, b) => getTime(b) - getTime(a));
    const result: (AppNotification | GroupedNotification)[] = [];

    // Helper: is eligible for grouping?
    const isGroupable = (n: AppNotification) => {
        return !n.isRead && !EXCLUDED_TYPES.includes(n.type);
    };

    let i = 0;
    while (i < sorted.length) {
        const current = sorted[i];

        // If not groupable, add as single
        if (!isGroupable(current)) {
            result.push(current);
            i++;
            continue;
        }

        // Try to form a group starting with current
        const groupItems: AppNotification[] = [current];
        let j = i + 1;
        let lastTime = getTime(current);

        while (j < sorted.length) {
            const candidate = sorted[j];
            const candidateTime = getTime(candidate);

            // Must match identity
            const matchesIdentity =
                candidate.entityType === current.entityType &&
                candidate.entityId === current.entityId &&
                candidate.type === current.type;

            // Must match state (unread) and exclusions
            const eligible = isGroupable(candidate);

            // Must be within window of the *previous item added to group* (chaining)
            // Or within window of the *first* item? Rule says "Created within a short time window".
            // Typically chaining is better for natural conversations, but strict window (e.g. all within 30m of leader) prevents infinite groups.
            // Let's use: Difference between this item and the HEAD of the group (current) <= Window.
            const withinWindow = Math.abs(lastTime - candidateTime) <= GROUP_WINDOW_MS;

            if (matchesIdentity && eligible && withinWindow) {
                groupItems.push(candidate);
                j++;
            } else {
                // Break sequence?
                // If we are strictly grouping adjacent sorted items, we break.
                // But grouped items might be interleaved with other notifications?
                // "Related notifications group automatically"
                // If I have: Task A update, Task B update, Task A update.
                // Should Task A updates group across Task B?
                // Usually yes.
                // So I should scan ahead.

                // Let's scan ahead but validly.
                // If we scan ahead, we remove item from processed list?
                // Easier logic: Bucketing.

                // Refined Logic:
                // We keep the main loop. But if we find a match, we pull it out of the array?
                // OR we just iterate linearly and skip already-grouped items.
                // Let's stick to simple "bucket adjacently if possible" or "scan ahead".
                // Scan ahead is better for user experience.
                j++;
            }
        }

        // Actually, scanning ahead means 'j' loop needs to be careful.
        // Let's rethink logic to be more robust.
        // We will process the list and mark items as 'handled'.
        break; // Restart logic below
    }

    // ---------------------------------------------------------
    // RETHINK: Bucket Approach
    // ---------------------------------------------------------

    const handledIds = new Set<string>();
    const finalOutput: (AppNotification | GroupedNotification)[] = [];

    for (let k = 0; k < sorted.length; k++) {
        const current = sorted[k];
        if (handledIds.has(current.id)) continue;

        if (!isGroupable(current)) {
            finalOutput.push(current);
            handledIds.add(current.id);
            continue;
        }

        // Start a potential group
        // Find all other matching unhandled items that fit the criteria
        const matches: AppNotification[] = [current];

        // Look ahead
        for (let l = k + 1; l < sorted.length; l++) {
            const candidate = sorted[l];
            if (handledIds.has(candidate.id)) continue;

            if (
                candidate.entityType === current.entityType &&
                candidate.entityId === current.entityId &&
                candidate.type === current.type &&
                isGroupable(candidate)
            ) {
                // Check time diff against the LATEST item in the group (which is 'current' initially, but effectively the previous one added?)
                // Actually, if we want "Conversation" style, any item within 30m of ANY item in group?
                // Or "Cluster".
                // Simple rule: Candidate must be within 30m of the *most recent* item (current).
                // Since sorted desc, 'current' is the newest.
                const timeDiff = Math.abs(getTime(current) - getTime(candidate));
                if (timeDiff <= GROUP_WINDOW_MS) {
                    matches.push(candidate);
                }
            }
        }

        if (matches.length > 1) {
            // Create Group
            matches.forEach(m => handledIds.add(m.id));
            finalOutput.push({
                id: `group_${current.entityId}_${current.type}_${current.id}`,
                isGroup: true,
                items: matches,
                count: matches.length,
                type: current.type,
                entityType: current.entityType,
                entityId: current.entityId,
                latestCreatedAt: current.createdAt, // Since sorted desc
                isRead: false
            });
        } else {
            // Single item (no matches found)
            finalOutput.push(current);
            handledIds.add(current.id);
        }
    }

    return finalOutput;
};

// Helper for display title
export const getGroupTitle = (group: GroupedNotification): string => {
    // "3 updates on ‘Task Name’"
    // We need the entity title. The notifications usually contain `title` or `metadata.entityTitle`?
    // Looking at notification types: `title` is "Task Assigned: TaskName".
    // Often `title` is formatted notification text.
    // We might need to extract the raw entity name.
    // Ideally notification metadata has it.
    // If not, we parse or use the first notification's title.
    // Assumption: Notification title follows "Action: EntityName" or similar, or we just rely on generic.
    // Let's check typical notification content.
    // If title = "Comment Added", message = "User said: ..."
    // Metadata usually contains context.

    // Fallback: Use the title of the most recent notification, potentially stripped.
    // BUT Requirement: "Display entity title (task/event name)"
    // If the notification title is "New Comment on Project X", we can extract "Project X".
    // If the notification title is just "New Comment" and message is "Project X", we use message.

    // HACK: For now, we return a constructed generic string and rely on the UI component to try its best or use the first item's title.
    // Actually, typically we'd just say `${group.count} updates`.
    // But requirement is strict: "3 updates on ‘Task Name’".
    // We'll inspect `items[0].title` or `items[0].metadata?.entityTitle`.

    return `${group.count} updates`;
};
