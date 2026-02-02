import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const db = adminDb;
        const doc = await db.collection('device_requests').doc(id).get();

        if (!doc.exists) {
            return Response.json({ error: 'Request not found' }, { status: 404 });
        }

        const requestData = doc.data();

        // Access control: Admin or the requester
        if (user.role !== 'admin' && requestData?.requester?.uid !== user.uid) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        return Response.json({ request: { id: doc.id, ...requestData } });
    } catch (error: any) {
        console.error('Error fetching device request:', error);
        return Response.json({ error: error.message || 'Failed to fetch request' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const updates = await request.json();
        const db = adminDb;

        const docRef = db.collection('device_requests').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return Response.json({ error: 'Request not found' }, { status: 404 });
        }

        // Only admin can update arbitrary fields or status
        // Requester might be able to cancel if pending?
        // For now, let's assume loose permissions but enforce role checks

        // TODO: stricter validation
        const currentData = doc.data();
        // Access Control
        if (user.role !== 'admin') {
            // Requester can specific transitions
            const isRequester = currentData?.requester?.uid === user.uid;

            // Allow requester to cancel if pending
            const isCancelling = currentData?.status === 'pending' && updates.status === 'cancelled';

            // Allow requester to mark as returned (waiting for inspection)
            // Allow retry if already waiting_inspection (inventory might definitely be stuck in_use)
            const isReturning = (currentData?.status === 'issued' || currentData?.status === 'waiting_inspection') && updates.status === 'waiting_inspection';

            if (!isRequester || (!isCancelling && !isReturning)) {
                console.error(`Forbidden Access [${id}]: User ${user.uid} (Role: ${user.role}) attempted update on request owned by ${currentData?.requester?.uid}. CurrentStatus: ${currentData?.status}, NewStatus: ${updates.status}`);
                console.log(`isRequester: ${isRequester}, isCancelling: ${isCancelling}, isReturning: ${isReturning}`);
                return Response.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        await docRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });

        // Notifications
        try {
            // If status changed
            if (updates.status && updates.status !== currentData?.status) {
                const requesterId = currentData?.requester?.uid;

                // 1. Approved
                if (updates.status === 'approved' && requesterId) {
                    await ServerNotification.create(requesterId, {
                        type: 'info',
                        title: 'Request Approved',
                        message: `Your request for ${currentData?.description} has been approved.`,
                        entityType: 'device_request',
                        entityId: id,
                        actionUrl: '/inventory/requests',
                        sourceUserId: user.uid,
                        priority: 'medium'
                    });
                }

                // 2. Rejected
                if (updates.status === 'rejected' && requesterId) {
                    await ServerNotification.create(requesterId, {
                        type: 'info',
                        title: 'Request Rejected',
                        message: `Your request for ${currentData?.description} was rejected.`,
                        entityType: 'device_request',
                        entityId: id,
                        actionUrl: '/inventory/requests',
                        sourceUserId: user.uid,
                        priority: 'high'
                    });
                }

                // 3. Guest Returned (Notify Admin)
                if (updates.status === 'waiting_inspection') {
                    const adminIds = await ServerNotification.getAdminIds();
                    await ServerNotification.broadcast(adminIds, {
                        type: 'info', // Action required
                        title: 'Item Returned - Inspection Needed',
                        message: `${currentData?.requester?.name} has returned ${currentData?.description}. Please inspect.`,
                        entityType: 'device_request',
                        entityId: id,
                        actionUrl: '/inventory/requests',
                        sourceUserId: user.uid,
                        priority: 'high'
                    });
                }
            }
        } catch (notifErr) {
            console.error('Notification failed:', notifErr);
        }

        return Response.json({ message: 'Request updated' });
    } catch (error: any) {
        console.error('Error updating device request:', error);
        return Response.json({ error: error.message || 'Failed to update request' }, { status: 500 });
    }
}
