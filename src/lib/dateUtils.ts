/**
 * Normalize any date input (Timestamp, Date, string, number) into a Date object
 * @param dateInput - The date input to normalize
 * @returns Date object or null if invalid
 */
export function normalizeDate(dateInput: any): Date | null {
    if (!dateInput) return null;

    // Handle Firestore Timestamp
    if (typeof dateInput === 'object' && 'seconds' in dateInput) {
        const date = new Date(dateInput.seconds * 1000);
        return isNaN(date.getTime()) ? null : date;
    }

    // Handle Date object
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    // Handle string or number
    try {
        const date = new Date(dateInput);
        return isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
}

/**
 * Format a date string or Date object to DD/MM/YYYY HH:MM format
 * @param dateInput - ISO string, Date object, or timestamp
 * @returns Formatted date string in DD/MM/YYYY HH:MM format
 */
export function formatDate(dateInput: any): string {
    const date = normalizeDate(dateInput);
    if (!date) return 'Invalid Date';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format a date string or Date object to DD/MM/YYYY format (without time)
 * @param dateInput - ISO string, Date object, or timestamp
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateOnly(dateInput: any): string {
    const date = normalizeDate(dateInput);
    if (!date) return 'Invalid Date';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Format a date string or Date object to HH:MM format (time only)
 * @param dateInput - ISO string, Date object, or timestamp
 * @returns Formatted time string in HH:MM format
 */
export function formatTimeOnly(dateInput: any): string {
    const date = normalizeDate(dateInput);
    if (!date) return 'Invalid Time';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

/**
 * Get relative time string (e.g., "5 mins ago", "2 hours ago")
 * @param dateInput - ISO string, Date object, or timestamp
 * @returns Relative time string
 */
export function getRelativeTime(dateInput: any): string {
    const date = normalizeDate(dateInput);
    if (!date) return 'Invalid Date';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const isFuture = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const diffMins = Math.floor(absDiffMs / 60000);
    const diffHours = Math.floor(absDiffMs / 3600000);
    const diffDays = Math.floor(absDiffMs / 86400000);

    if (diffMins < 1) return isFuture ? 'Soon' : 'Just now';

    if (diffMins < 60) {
        const text = `${diffMins} min${diffMins > 1 ? 's' : ''}`;
        return isFuture ? `In ${text}` : `${text} ago`;
    }

    if (diffHours < 24) {
        const text = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        return isFuture ? `In ${text}` : `${text} ago`;
    }

    if (diffDays < 7) {
        const text = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        return isFuture ? `In ${text}` : `${text} ago`;
    }

    return formatDate(date);
}
