/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 * Used to initialize the daily snapshot cron job
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only run on server-side
        const { initializeDailySnapshotJob } = await import('./jobs/dailySnapshots');
        initializeDailySnapshotJob();
        console.log('[Instrumentation] Daily snapshot cron job initialized');
    }
}
