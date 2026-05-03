/**
 * src/lib/undoManager.ts
 *
 * Module-level undo buffer for task mutations.
 * Ephemeral — never persisted to DB or localStorage.
 * Entries expire after UNDO_WINDOW_MS; after that the action is final.
 */

import type { Task } from '@/features/tasks/types/task';

export const UNDO_WINDOW_MS = 8000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type UndoOperation =
    | 'delete'
    | 'changeStatus'
    | 'changePriority'
    | 'assign';

/**
 * Per-task snapshot of only the fields touched by the operation.
 * Small footprint — we don't clone entire Task objects.
 */
export type TaskSnapshot = {
    status?: Task['status'];
    priority?: Task['priority'];
    assigned_to?: Task['assigned_to'];
    /** Stored so restore-delete can recreate minimal doc */
    title?: string;
    description?: string;
};

export type UndoEntry = {
    id: string;
    operation: UndoOperation;
    /** taskId → snapshot of fields before mutation */
    snapshot: Map<string, TaskSnapshot>;
    /** Array for ordered restore iteration */
    taskIds: string[];
    expiresAt: number;
};

// ─── Singleton registry ────────────────────────────────────────────────────────

const _registry = new Map<string, UndoEntry>();
let _counter = 0;

function generateId(): string {
    return `undo_${Date.now()}_${++_counter}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const UndoManager = {
    /**
     * Enqueue an undo entry. Returns the generated entry id.
     * Automatically schedules expiry — after UNDO_WINDOW_MS the entry is dropped.
     */
    push(entry: Omit<UndoEntry, 'id' | 'expiresAt'>): string {
        const id = generateId();
        const full: UndoEntry = {
            ...entry,
            id,
            expiresAt: Date.now() + UNDO_WINDOW_MS,
        };
        _registry.set(id, full);

        // Auto-expire — keeps registry clean even if toast dismissed by other means
        setTimeout(() => { _registry.delete(id); }, UNDO_WINDOW_MS + 500);

        return id;
    },

    /**
     * Retrieve and remove an entry for execution.
     * Returns null if already expired or already consumed.
     */
    consume(id: string): UndoEntry | null {
        const entry = _registry.get(id);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            _registry.delete(id);
            return null;
        }
        _registry.delete(id);
        return entry;
    },

    /**
     * Discard without executing (e.g. toast dismissed normally).
     */
    cancel(id: string): void {
        _registry.delete(id);
    },

    /** For testing / debugging only */
    _size(): number {
        return _registry.size;
    },
};

// ─── Snapshot helpers ─────────────────────────────────────────────────────────

/**
 * Build a snapshot map from a list of tasks, capturing only the fields
 * that the given operation will mutate.
 */
export function buildSnapshot(
    tasks: Task[],
    operation: UndoOperation
): Map<string, TaskSnapshot> {
    const map = new Map<string, TaskSnapshot>();
    for (const t of tasks) {
        const snap: TaskSnapshot = {};
        if (operation === 'changeStatus') snap.status = t.status;
        if (operation === 'changePriority') snap.priority = t.priority;
        if (operation === 'assign') snap.assigned_to = t.assigned_to;
        if (operation === 'delete') {
            // Enough to restore minimal visible state
            snap.status = t.status;
            snap.priority = t.priority;
            snap.assigned_to = t.assigned_to;
            snap.title = t.title;
            snap.description = t.description;
        }
        map.set(t.id, snap);
    }
    return map;
}
