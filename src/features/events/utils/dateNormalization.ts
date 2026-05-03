import { 
    parseISO, 
    format, 
    addDays, 
    isBefore, 
    isSameDay, 
    startOfDay 
} from 'date-fns';

export type DateInput = string | Date | { seconds: number; nanoseconds: number } | null | undefined;

/**
 * Normalizes various date inputs into a standard JavaScript Date object.
 */
export function normalizeDate(input: DateInput): Date | null {
    if (!input) return null;

    // Handle Firestore/Supabase Timestamp style objects
    if (typeof input === 'object' && 'seconds' in input) {
        return new Date(input.seconds * 1000);
    }

    // Handle ISO strings or other date strings
    if (typeof input === 'string') {
        // First try standard parsing
        const parsed = parseISO(input);
        if (!isNaN(parsed.getTime())) return parsed;

        // Fallback: Extract YYYY-MM-DD for malformed strings
        const match = input.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
            const [y, m, d] = match[1].split('-').map(Number);
            return new Date(y, m - 1, d);
        }
        
        return null;
    }

    // Handle Date objects
    if (input instanceof Date) {
        return isNaN(input.getTime()) ? null : input;
    }

    return null;
}

/**
 * Returns an array of date strings (yyyy-MM-dd) for every day an event spans.
 */
export function getEventDays(start: DateInput, end: DateInput): string[] {
    const startDate = normalizeDate(start);
    if (!startDate) return [];

    const normalizedEndDate = normalizeDate(end);
    
    // If no end date, or end date is same as start date, it's a single day
    if (!normalizedEndDate || isSameDay(startDate, normalizedEndDate)) {
        return [format(startDate, 'yyyy-MM-dd')];
    }

    // If end date is before start date, treat as single day
    if (isBefore(normalizedEndDate, startDate)) {
        return [format(startDate, 'yyyy-MM-dd')];
    }

    const days: string[] = [];
    let current = startOfDay(startDate);
    let last = startOfDay(normalizedEndDate);

    // Boundary check: If an event ends exactly at the start of a day (midnight), 
    // don't include that day unless the event also started on that same day.
    if (normalizedEndDate.getTime() === last.getTime() && !isSameDay(startDate, normalizedEndDate)) {
        last = addDays(last, -1);
    }

    while (current <= last) {
        days.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
    }

    return days;
}

/**
 * Safely parses a date and returns a formatted string.
 */
export function safeFormat(date: DateInput, formatStr: string): string {
    const normalized = normalizeDate(date);
    if (!normalized) return '';
    return format(normalized, formatStr);
}
