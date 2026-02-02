import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = adminDb;
        const now = new Date();
        // Cleanup events older than yesterday (allow some buffer)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        console.log(`[Cron:CleanupEvents] Starting cleanup for events before ${yesterday.toISOString()}`);

        // Query: Non-system events where date < yesterday
        // Note: We need a composite index on 'type' and 'start' usually.
        // If 'start' is ISO string, we compare lexically.
        // If 'start' is Timestamp, we compare object.

        // Safety: We fetch first to audit.
        // We assume 'start' is stored as ISO String or Timestamp.
        // Based on codebase, 'start' often ISO string.

        // Let's filter in memory for safety if dataset is small, or use simple date filter.

        const snapshot = await db.collection('events')
            .where('type', '!=', 'system') // Don't delete system logs
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ message: 'No events found to cleanup.' });
        }

        const batch = db.batch();
        let deleteCount = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Handle various date formats
            let eventDate: Date | null = null;

            if (data.start?.seconds) {
                eventDate = new Date(data.start.seconds * 1000);
            } else if (typeof data.start === 'string') {
                eventDate = new Date(data.start);
            } else if (data.date?.seconds) {
                eventDate = new Date(data.date.seconds * 1000);
            } else if (typeof data.date === 'string') {
                eventDate = new Date(data.date);
            }

            if (eventDate && eventDate < yesterday) {
                // Double check: Never delete if "system" type (redundant check but safe)
                if (data.type !== 'system') {
                    batch.delete(doc.ref);
                    deleteCount++;
                }
            }
        });

        if (deleteCount > 0) {
            await batch.commit();
            console.log(`[Cron:CleanupEvents] Deleted ${deleteCount} old events.`);
        }

        return NextResponse.json({
            success: true,
            deleted: deleteCount,
            message: `Cleanup complete. Deleted ${deleteCount} old events.`
        });

    } catch (error: any) {
        console.error('[Cron:CleanupEvents] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
