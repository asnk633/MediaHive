
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

export interface NormalizedEvent extends Omit<Event, 'date' | 'start_at' | 'end_at'> {
    date: Date;
    start_at: Date;
    end_at: Date;
}

/**
 * Universal Date Coercion Helper
 * Handles: Firestore Timestamp, ISO string, Date object, null/undefined
 */
const toDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    if (typeof d === 'string') {
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof d === 'object' && d.seconds) {
        const parsed = new Date(d.seconds * 1000);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
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
    return events.map(e => {
        // Handle various possible field names from different service layers
        // Prefer full date/timestamps (start_at, date) over time-only strings (startTime, start_time)
        const rawStart = (e as any).start_at || (e as any).date || (e as any).startTime || (e as any).start_time;
        const rawEnd = (e as any).end_at || (e as any).date || (e as any).endTime || (e as any).end_time || rawStart;

        const start = toDate(rawStart);
        const end = toDate(rawEnd) || start;
        
        return {
            ...e,
            date: start || new Date(0),
            start_at: start || new Date(0),
            end_at: end || new Date(0)
        };
    });
};
