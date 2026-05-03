/**
 * src/lib/emulatorStore.ts
 *
 * localStorage-backed persistence layer for emulator / dev-no-api mode.
 * Only active when NEXT_PUBLIC_DEV_NO_API === 'true'.
 *
 * All mock API handlers in apiClient.ts delegate reads + writes here
 * so mutations (soft delete, restore, permanent delete) survive page reloads.
 */

const STORAGE_KEY = 'mediahive_emulator_tasks_v2';

/** Minimal Task shape used by the store (matches the fields apiClient mocks use) */
export interface EmulatorTask {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    deleted?: boolean;
    deletedAt?: string;
    due_date?: any;
    completed_at?: any;
    assigned_to?: any[];
    created_by?: any;
    created_at?: any;
    institution_id?: string;
    [key: string]: any; // allow arbitrary field updates
}

// ── Seed data ─────────────────────────────────────────────────────────────────

function buildSeedTasks(): EmulatorTask[] {
    const now = new Date();
    const s = (offset: number) => Math.floor(now.getTime() / 1000) + offset;
    const creator = { uid: 'dev-mock-admin', name: 'Local Admin', role: 'admin' };
    const assignee = [{ uid: 'dev-mock-admin', name: 'Local Admin' }];

    return [
        {
            id: 'mock-task-1',
            title: 'Immediate Production Review',
            description: 'Review final edits for the upcoming product launch.',
            status: 'in_progress',
            priority: 'urgent',
            due_date: now.toISOString(),
            assigned_to: assignee,
            created_by: creator,
            created_at: { seconds: s(-86400), nanoseconds: 0 },
            institution_id: '1',
        },
        {
            id: 'mock-task-2',
            title: 'Capture Campus Event',
            description: 'Photography for the annual garden symposium.',
            status: 'todo',
            priority: 'medium',
            due_date: new Date(now.getTime() + 172800000).toISOString(),
            assigned_to: assignee,
            created_by: creator,
            created_at: { seconds: s(-43200), nanoseconds: 0 },
            institution_id: '1',
        },
        {
            id: 'mock-task-3',
            title: 'Archived Footage Cleanup',
            description: 'Organize files from last season.',
            status: 'done',
            priority: 'low',
            due_date: new Date(now.getTime() - 172800000).toISOString(),
            assigned_to: assignee,
            created_by: creator,
            created_at: { seconds: s(-259200), nanoseconds: 0 },
            completed_at: { seconds: s(-86400), nanoseconds: 0 },
            institution_id: '1',
        },
        // Pre-seeded tasks that start in trash so the /tasks/trash page has data
        {
            id: 'mock-trash-1',
            title: 'Old Campaign Draft',
            description: 'Stale campaign from Q3.',
            status: 'todo',
            priority: 'low',
            deleted: true,
            deletedAt: new Date(now.getTime() - 86400000).toISOString(),
            due_date: new Date(now.getTime() - 259200000).toISOString(),
            assigned_to: assignee,
            created_by: creator,
            created_at: { seconds: s(-604800), nanoseconds: 0 },
            institution_id: '1',
        },
        {
            id: 'mock-trash-2',
            title: 'Duplicate Media Log',
            description: 'Auto-generated duplicate, safe to delete.',
            status: 'done',
            priority: 'low',
            deleted: true,
            deletedAt: new Date(now.getTime() - 172800000).toISOString(),
            due_date: new Date(now.getTime() - 432000000).toISOString(),
            assigned_to: assignee,
            created_by: creator,
            created_at: { seconds: s(-1209600), nanoseconds: 0 },
            institution_id: '1',
        },
    ];
}

// ── Core read / write ─────────────────────────────────────────────────────────

function readAll(): EmulatorTask[] {
    if (typeof window === 'undefined') return buildSeedTasks();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const seed = buildSeedTasks();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw) as EmulatorTask[];
    } catch {
        return buildSeedTasks();
    }
}

function writeAll(tasks: EmulatorTask[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Public API ────────────────────────────────────────────────────────────────

export const EmulatorStore = {
    /** All tasks (active + deleted) */
    getAll(): EmulatorTask[] {
        return readAll();
    },

    /** Active tasks only (not deleted) */
    getActive(): EmulatorTask[] {
        return readAll().filter(t => !t.deleted);
    },

    /** Deleted tasks only */
    getTrash(): EmulatorTask[] {
        return readAll().filter(t => t.deleted === true);
    },

    /** Update arbitrary fields on a single task */
    updateOne(id: string, updates: Partial<EmulatorTask>): void {
        const all = readAll();
        writeAll(all.map(t => (t.id === id ? { ...t, ...updates } : t)));
    },

    /** Soft-delete one or many tasks (sets deleted:true) */
    softDelete(ids: string[]): void {
        const now = new Date().toISOString();
        const all = readAll();
        writeAll(
            all.map(t =>
                ids.includes(t.id)
                    ? { ...t, deleted: true, deletedAt: now }
                    : t
            )
        );
    },

    /** Restore one or many tasks from trash (clears deleted flag) */
    restore(ids: string[]): void {
        const all = readAll();
        writeAll(
            all.map(t =>
                ids.includes(t.id)
                    ? { ...t, deleted: false, deletedAt: undefined }
                    : t
            )
        );
    },

    /** Permanently remove tasks from storage */
    permanentDelete(ids: string[]): void {
        writeAll(readAll().filter(t => !ids.includes(t.id)));
    },

    /** Bulk update arbitrary fields on multiple tasks */
    bulkUpdate(ids: string[], updates: Partial<EmulatorTask>): void {
        const all = readAll();
        writeAll(all.map(t => (ids.includes(t.id) ? { ...t, ...updates } : t)));
    },

    /** Clear all data and re-seed (useful for dev reset) */
    reset(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    },
};
