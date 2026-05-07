/**
 * src/lib/activityHistory.ts
 *
 * Lightweight, client-side activity log per task.
 * Backed by localStorage — survives page refresh within 7 days.
 * No database writes. No API calls. No global state.
 *
 * Role-filtering happens in get() — no permission leaks.
 */

const STORAGE_PREFIX = 'mh_activity_';
const MAX_ENTRIES = 20;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityAction =
    | 'status_changed'
    | 'priority_changed'
    | 'assigned'
    | 'unassigned'
    | 'deleted'
    | 'restored'
    | 'conflict_resolved';

export type ActivityEntry = {
    id: string;
    taskId: string;
    action: ActivityAction;
    /** Human-readable: "Changed status to Working" */
    label: string;
    /** "You" when actorUid === viewer's uid, otherwise actor's name */
    actorUid: string;
    actorName: string;
    timestamp: number; // epoch ms
    /** 1 = single task, N = bulk scope */
    scope: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _seq = 0;
function uid(): string {
    return `act_${Date.now()}_${++_seq}`;
}

function storageKey(taskId: string): string {
    return `${STORAGE_PREFIX}${taskId}`;
}

function safeParse(raw: string | null): ActivityEntry[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const cutoff = Date.now() - TTL_MS;
        return parsed.filter((e: ActivityEntry) => e.timestamp > cutoff);
    } catch {
        return [];
    }
}

// ─── Label builders ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'Working',
    on_hold: 'On Hold',
    review: 'On Hold',
    done: 'Completed',
    pending: 'Pending',
};

const PRIORITY_LABELS: Record<string, string> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

export function buildActivityLabel(action: ActivityAction, value?: string, scope = 1): string {
    const suffix = scope > 1 ? ` (${scope} tasks)` : '';
    switch (action) {
        case 'status_changed':
            return `Changed status to ${STATUS_LABELS[value ?? ''] ?? value}${suffix}`;
        case 'priority_changed':
            return `Changed priority to ${PRIORITY_LABELS[value ?? ''] ?? value}${suffix}`;
        case 'assigned':
            return `Assigned to ${value ?? 'a team member'}${suffix}`;
        case 'unassigned':
            return `Removed ${value ?? 'a team member'} from assignment${suffix}`;
        case 'deleted':
            return scope > 1 ? `Deleted ${scope} tasks` : 'Deleted this task';
        case 'restored':
            return scope > 1 ? `Restored ${scope} tasks (undo)` : 'Restored this task (undo)';
        case 'conflict_resolved':
            return value ?? 'Resolved a conflict';
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const ActivityHistory = {
    /**
     * Push one entry for a given task.
     * Prunes to MAX_ENTRIES (LIFO).
     */
    push(taskId: string, entry: Omit<ActivityEntry, 'id' | 'taskId' | 'timestamp'>): void {
        if (typeof window === 'undefined') return;
        const key = storageKey(taskId);
        const prev = safeParse(localStorage.getItem(key));

        const full: ActivityEntry = {
            ...entry,
            id: uid(),
            taskId,
            timestamp: Date.now(),
        };

        // Prepend, cap at MAX_ENTRIES
        const next = [full, ...prev].slice(0, MAX_ENTRIES);
        try {
            localStorage.setItem(key, JSON.stringify(next));
        } catch {
            // Storage quota — silently skip
        }
    },

    /**
     * Push the same entry for multiple tasks (bulk ops).
     * scope is set to taskIds.length automatically.
     */
    pushBulk(
        taskIds: string[],
        entry: Omit<ActivityEntry, 'id' | 'taskId' | 'timestamp' | 'scope'>
    ): void {
        const scope = taskIds.length;
        for (const taskId of taskIds) {
            ActivityHistory.push(taskId, { ...entry, scope });
        }
    },

    /**
     * Retrieve entries for a task, filtered by role.
     * Returns newest-first, max 10 shown.
     *
     * @param viewerUid - UID of the current user (for "You" substitution + member filter)
     * @param role      - 'admin' | 'manager' | 'team' | 'member'
     */
    get(taskId: string, viewerUid: string, role: string): ActivityEntry[] {
        if (typeof window === 'undefined') return [];
        const entries = safeParse(localStorage.getItem(storageKey(taskId)));

        let filtered = entries;
        if (role === 'member') {
            filtered = entries.filter(e => e.actorUid === viewerUid);
        }
        // team: see all entries for tasks they can access (caller already scoped to taskId)
        // admin: all entries

        return filtered.slice(0, 10);
    },

    /**
     * Retrieve governance-relevant entries across ALL tasks.
     * Useful for Org-Level Governance UI.
     */
    getAllGovernance(viewerUid: string, role: string): ActivityEntry[] {
        if (typeof window === 'undefined') return [];
        const allEntries: ActivityEntry[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                const entries = safeParse(localStorage.getItem(key));
                allEntries.push(...entries);
            }
        }

        // Filter for governance-relevant actions
        let filtered = allEntries.filter(e =>
            e.action === 'conflict_resolved' ||
            e.label.includes('(Overrode policy)') ||
            e.label.includes('(Followed policy)')
        );

        if (role === 'member') {
            filtered = filtered.filter(e => e.actorUid === viewerUid);
        }

        // Newest first across all tasks
        return filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
    },

    /** Clear all history for a task (e.g. after hard delete). */
    clear(taskId: string): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(storageKey(taskId));
        } catch { /* ignore */ }
    },
};
