import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = adminDb;

        // 1. Get all requests that are 'issued'
        const requestsSnap = await db.collection('device_requests')
            .where('status', '==', 'issued')
            .get();

        if (requestsSnap.empty) {
            return Response.json({ message: 'No issued requests found', count: 0 });
        }

        const batch = db.batch();
        let count = 0;

        // 2. Update linked inventory items
        for (const doc of requestsSnap.docs) {
            const reqData = doc.data();
            const itemId = reqData.assignedItemId;

            if (itemId) {
                const itemRef = db.collection('inventory').doc(itemId);

                // We trust the request data to be the source of truth for "who has it"
                batch.update(itemRef, {
                    status: 'in_use',
                    currentHolder: {
                        uid: reqData.requester?.uid,
                        name: reqData.requester?.name || 'Unknown',
                        requestId: doc.id
                    }
                });
                count++;
            }
        }

        await batch.commit();

        return Response.json({ message: 'Sync successful', count });
    } catch (error: any) {
        console.error('Error syncing inventory:', error);
        return Response.json({ error: error.message || 'Failed to sync' }, { status: 500 });
    }
}
