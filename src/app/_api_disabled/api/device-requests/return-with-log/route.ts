import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, logId, adminUid, condition, notes } = await request.json();
        const db = adminDb;

        await db.runTransaction(async (t) => {
            const requestRef = db.collection('device_requests').doc(requestId);
            const requestDoc = await t.get(requestRef);
            if (!requestDoc.exists) throw new Error("Request not found");

            const reqData = requestDoc.data();
            const itemId = reqData?.assignedItemId;

            if (itemId) {
                const inventoryRef = db.collection('inventory').doc(itemId);

                // Determine status based on return condition
                let newStatus = 'available';
                if (condition === 'broken' || condition === 'needs_repair') newStatus = 'maintenance';
                if (condition === 'retired' || condition === 'lost') newStatus = 'retired';

                t.update(inventoryRef, {
                    status: newStatus,
                    currentHolder: FieldValue.delete()
                });
            }

            // Use provided logId directly
            if (logId) {
                const logRef = db.collection('device_logs').doc(logId);
                t.update(logRef, {
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
