/**
 * performanceLogger.ts
 * 
 * Lightweight utility for tracking execution time of critical paths.
 * Logs are enabled only in development mode to avoid overhead in production.
 */

const isDev = process.env.NODE_ENV === 'development';

export function logPerformance(label: string, startTime: number, metadata?: Record<string, any>) {
    if (!isDev) return;

    const duration = performance.now() - startTime;
    const metaString = metadata ? ` | ${JSON.stringify(metadata)}` : '';

    // Use distinct styling for performance logs to make them stand out in the console
    console.log(
        `%c[PERF] %c${label}: %c${duration.toFixed(2)}ms${metaString}`,
        'color: #10b981; font-weight: bold;', // Emerald for [PERF]
        'color: #6366f1; font-weight: 500;', // Indigo for label
        'color: #f59e0b; font-weight: bold;'  // Amber for duration
    );

    return duration;
}

/**
 * Higher-order function to measure a synchronous or asynchronous function.
 */
export async function measure<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
        return await fn();
    } finally {
        logPerformance(label, start);
    }
}
