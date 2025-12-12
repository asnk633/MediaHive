/**
 * Format a date string or Date object to DD/MM/YYYY HH:MM format
 * @param dateInput - ISO string, Date object, or timestamp
 * @returns Formatted date string in DD/MM/YYYY HH:MM format
 */
export function formatDate(dateInput: string | Date | number): string {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
        ? new Date(dateInput)
        : dateInput;

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
export function formatDateOnly(dateInput: string | Date | number): string {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
        ? new Date(dateInput)
        : dateInput;

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
export function formatTimeOnly(dateInput: string | Date | number): string {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
        ? new Date(dateInput)
        : dateInput;

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

/**
 * Get relative time string (e.g., "5 mins ago", "2 hours ago")
 * @param dateInput - ISO string, Date object, or timestamp
 * @returns Relative time string
 */
export function getRelativeTime(dateInput: string | Date | number): string {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
        ? new Date(dateInput)
        : dateInput;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return formatDate(date);
}
