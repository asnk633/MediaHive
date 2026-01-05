import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function DELETE(request: NextRequest) {
    try {
        // 1. Security: Only authenticated admins can trigger this
        const user = await verifyUser(request);
        // Allow 'admin' or purely internal triggers (though this is client-triggered for now)
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = adminDb;
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats = {
            tasksArchived: 0,
            notificationsDeleted: 0
        };

        // --- 2. Archive Old Completed Tasks ---
        const tasksRef = db.collection('tasks');
        // Query: status == 'done'
        // Note: Complex queries might require indexes. 
        // We'll fetch 'done' tasks and filter by date in memory if index is missing, 
        // or try basic query. 'updatedAt' < sevenDaysAgo.
        // To be safe without assuming composite indexes:
        // Fetch all 'done' tasks (usually not huge) or restrict by inequality if possible.
        // Let's try to query 'status' == 'done'.
        // Query: status == 'done'
        // FIX: Removed .where('isArchived', '!=', true) to avoid composite index requirement.
        // We will filter archived tasks in memory.
        const doneTasksSnapshot = await tasksRef
            .where('status', '==', 'done')
            .get();

        // Helper to handle batch commits
        let batch = db.batch();
        let batchCount = 0;
        const MAX_BATCH_SIZE = 450;

        const commitBatch = async () => {
            if (batchCount > 0) {
                await batch.commit();
                batch = db.batch(); // Get a fresh batch
                batchCount = 0;
            }
        };

        for (const doc of doneTasksSnapshot.docs) {
            const data = doc.data();

            // In-memory filter for index fix
            if (data.isArchived === true) continue;

            const updatedAtVal = data.updatedAt || data.createdAt;
            const updatedAt = updatedAtVal?.toDate ? updatedAtVal.toDate() : new Date(updatedAtVal);

            if (updatedAt < sevenDaysAgo) {
                batch.update(doc.ref, {
                    isArchived: true,
                    archivedAt: new Date(),
                    updatedAt: new Date()
                });
                stats.tasksArchived++;
                batchCount++;

                if (batchCount >= MAX_BATCH_SIZE) {
                    await commitBatch();
                }
            }
        }
        await commitBatch(); // Commit remaining tasks

        // --- 3. Delete Old Notifications ---
        const notificationsRef = db.collection('notifications');
        const oldNotifsSnapshot = await notificationsRef
            .where('createdAt', '<', sevenDaysAgo)
            .get();

        // Use the same helper pattern (resetting batch first)
        batch = db.batch();
        batchCount = 0;

        for (const doc of oldNotifsSnapshot.docs) {
            batch.delete(doc.ref);
            stats.notificationsDeleted++;
            batchCount++;

            if (batchCount >= MAX_BATCH_SIZE) {
                await commitBatch();
            }
        }
        await commitBatch(); // Commit remaining notifications

        // Log success
        console.log(`[Cleanup] Run by ${user.uid}: ${JSON.stringify(stats)}`);

        return NextResponse.json({
            success: true,
            message: 'Cleanup completed successfully',
            stats
        });

    } catch (error: any) {
        console.error('[Cleanup] Error:', error);
        // Important: Return JSON with error details so client doesn't see generic 500 HTML
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.code ? `Firestore Code: ${error.code}` : undefined
        }, { status: 500 });
    }
}
