
import { Event } from '../types/event';

export interface EventWithConflict extends Event {
    hasConflict?: boolean;
}

/**
 * Detects overlapping events based on their start and end times.
 * Expected format for start_time/end_time: "HH:mm" (24h format)
 */
export function detectEventConflicts(events: Event[]): EventWithConflict[] {
    if (events.length <= 1) return events;

    // Helper to convert "HH:mm" to minutes from midnight
    const toMinutes = (time: string | undefined): number | null => {
        if (!time) return null;
        // Handle ISO string extraction if needed
        const timeStr = time.includes('T') ? time.split('T')[1].substring(0, 5) : time;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
    };

    const eventsWithTimes = events.map(event => ({
        ...event,
        startMin: toMinutes(event.start_at),
        endMin: toMinutes(event.end_at) || (toMinutes(event.start_at) !== null ? toMinutes(event.start_at)! + 60 : null) // Default 1h duration if end missing
    }));

    const results: EventWithConflict[] = events.map(e => ({ ...e, hasConflict: false }));

    for (let i = 0; i < eventsWithTimes.length; i++) {
        const a = eventsWithTimes[i];
        if (a.startMin === null || a.endMin === null) continue;

        for (let j = i + 1; j < eventsWithTimes.length; j++) {
            const b = eventsWithTimes[j];
            if (b.startMin === null || b.endMin === null) continue;

            // Overlap check: max(startA, startB) < min(endA, endB)
            const overlap = Math.max(a.startMin, b.startMin) < Math.min(a.endMin, b.endMin);

            if (overlap) {
                results[i].hasConflict = true;
                results[j].hasConflict = true;
            }
        }
    }

    return results;
}
