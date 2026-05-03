
import { Task } from '@/features/tasks/types/task';
import { Event } from '@/features/events/types/event';

/**
 * PHASE-7 CANONICAL TYPES
 * 
 * Strict extensions of base types where date fields are GUARANTEED to be Date objects or null.
 * No strings, no Firestore Timestamps.
 */
export interface NormalizedTask extends Omit<Task, 'due_date' | 'completed_at' | 'created_at' | 'updated_at'> {
    due_date: Date | null;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface NormalizedEvent extends Omit<Event, 'date'> {
    date: Date;
}

/**
 * Universal Date Coercion Helper
 * Handles: Firestore Timestamp, ISO string, Date object, null/undefined
 */
const toDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d === 'string') return new Date(d);
    if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000); // Firestore
    return null;
};

const toRequiredDate = (d: any, fallback: Date = new Date()): Date => {
    return toDate(d) || fallback;
};

/**
 * Normalization Pipeline
 */
export const normalizeTasks = (tasks: Task[]): NormalizedTask[] => {
    return tasks.map(t => ({
        ...t,
        due_date: toDate(t.due_date),
        completed_at: toDate(t.completed_at),
        created_at: toRequiredDate(t.created_at),
        updated_at: toRequiredDate(t.updated_at)
    }));
};

export const normalizeEvents = (events: Event[]): NormalizedEvent[] => {
    return events.map(e => ({
        ...e,
        date: toRequiredDate(e.date)
    }));
};
