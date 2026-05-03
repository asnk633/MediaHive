/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Core server-only initializations would go here.
        // Legacy snapshot cron jobs have been purged.
        console.log('[Instrumentation] Server-side runtime initialized');
    }
}
