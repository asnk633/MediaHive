import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, itemId, adminUid, condition } = await request.json();
        const db = adminDb;

        // Run transaction
        const result = await db.runTransaction(async (t) => {
            const requestRef = db.collection('device_requests').doc(requestId);
            const reqDoc = await t.get(requestRef);

            if (!reqDoc.exists) throw new Error("Request not found");

            const reqData = reqDoc.data();

            // Fetch inventory item to get name/details
            const inventoryRef = db.collection('inventory').doc(itemId);
            const itemDoc = await t.get(inventoryRef);
            if (!itemDoc.exists) throw new Error("Inventory item not found");
            const itemData = itemDoc.data();

            const newLogRef = db.collection('device_logs').doc();

            t.update(requestRef, {
                status: 'issued',
                assignedItemId: itemId,
                assignedItemName: itemData?.name || 'Unknown Item',
                issuedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Update Inventory to In Use
            t.update(inventoryRef, {
                status: 'in_use',
                currentHolder: {
                    uid: reqData?.requester?.uid,
                    name: reqData?.requester?.name || 'Unknown',
                    requestId: requestId
                }
            });

            t.set(newLogRef, {
                requestId,
                inventoryItem: { id: itemId }, // simplified
                user: { uid: reqData?.requester?.uid }, // simplified
                issuedAt: new Date().toISOString(),
                conditionOnIssue: condition,
                issuedBy: adminUid
            });

            return {
                requesterUid: reqData?.requester?.uid,
                description: reqData?.description,
                requesterName: reqData?.requester?.name
            };
        });

        // Notify Requester
        if (result?.requesterUid) {
            try {
                await ServerNotification.create(result.requesterUid, {
                    type: 'info',
                    title: 'Equipment Issued',
                    message: `You have been issued equipment for: "${result.description}".`,
                    entityType: 'device_request',
                    entityId: requestId,
                    actionUrl: '/inventory/requests',
                    sourceUserId: user.uid,
                    priority: 'medium'
                });
            } catch (notifErr) {
                console.error("Failed to notify requester of issue:", notifErr);
            }
        }

        return Response.json({ message: 'Item issued successfully' });
    } catch (error: any) {
        console.error('Error issuing item:', error);
        return Response.json({ error: error.message || 'Failed to issue item' }, { status: 500 });
    }
}
