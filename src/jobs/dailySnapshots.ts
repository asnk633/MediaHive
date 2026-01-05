/**
 * Daily Snapshots Cron Job
 * Runs daily at 00:00 to generate performance and department health snapshots
 */

import cron from 'node-cron';
import { generateDailySnapshots } from '@/lib/snapshot.server';

let isJobScheduled = false;

/**
 * Initialize the daily snapshot cron job
 * Schedule: Every day at 00:00 (midnight)
 * Cron expression: '0 0 * * *'
 */
export function initializeDailySnapshotJob() {
    if (isJobScheduled) {
        console.log('[Cron] Daily snapshot job already scheduled');
        return;
    }

    // Schedule job to run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Starting daily snapshot generation...');

        try {
            const result = await generateDailySnapshots();
            console.log('[Cron] Daily snapshot generation completed:', result);
        } catch (error) {
            console.error('[Cron] Daily snapshot generation failed:', error);
        }
    });

    isJobScheduled = true;
    console.log('[Cron] Daily snapshot job scheduled for 00:00 (Asia/Kolkata)');
}

/**
 * For testing: Run snapshot generation immediately
 * This is useful during development to test without waiting for midnight
 */
export async function runSnapshotNow() {
    console.log('[Cron] Manual snapshot generation triggered');
    try {
        const result = await generateDailySnapshots();
        console.log('[Cron] Manual snapshot generation completed:', result);
        return result;
    } catch (error) {
        console.error('[Cron] Manual snapshot generation failed:', error);
        throw error;
    }
}
