import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyUser } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, adminUid, condition, notes } = await request.json();
        const db = adminDb;

        const requestRef = db.collection('device_requests').doc(requestId);

        await db.runTransaction(async (t) => {
            // Fetch request inside transaction to get assignedItemId
            const requestDoc = await t.get(requestRef);
            if (!requestDoc.exists) throw new Error("Request not found");

            const reqData = requestDoc.data();
            const itemId = reqData?.assignedItemId;

            if (itemId) {
                const inventoryRef = db.collection('inventory').doc(itemId);

                // Determine status based on return condition
                let newStatus = 'available';
                if (condition === 'broken' || condition === 'needs_repair') newStatus = 'maintenance';
                if (condition === 'retired') newStatus = 'retired';
                if (condition === 'lost') newStatus = 'retired'; // or lost status if exists

                t.update(inventoryRef, {
                    status: newStatus,
                    currentHolder: FieldValue.delete()
                });
            }

            // Find open log for this request
            const logsSnapshot = await t.get(
                db.collection('device_logs')
                    .where('requestId', '==', requestId)
                    .where('returnedAt', '==', null) // or undefined check
            );

            if (!logsSnapshot.empty) {
                const logDoc = logsSnapshot.docs[0];
                t.update(logDoc.ref, {
                    returnedAt: new Date().toISOString(),
                    conditionOnReturn: condition,
                    receivedBy: adminUid,
                    notes: notes || ''
                });
            }

            t.update(requestRef, {
                status: 'returned',
                returnedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });

        return Response.json({ message: 'Item returned successfully' });
    } catch (error: any) {
        console.error('Error returning item:', error);
        return Response.json({ error: error.message || 'Failed to return item' }, { status: 500 });
    }
}
