import { NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';
import { logNotificationSent } from '@/app/api/_lib/audit';


export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log('[API/Notifications] Request received');
        const { firestore } = await getFirebaseServices();
        console.log('[API/Notifications] Firebase services loaded');

        const user = await verifyUser(req);

        if (!user) {
            console.log('[API/Notifications] User unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[API/Notifications] User verified:', user.uid);

        const { trigger, payload } = await req.json();
        console.log('[API/Notifications] Trigger:', trigger);

        switch (trigger) {
            case 'event_created':
                // Fetch all users for broadcast
                const usersSnap = await firestore.collection('users').get();
                const userIds = usersSnap.docs.map((doc: any) => doc.id);

                await ServerNotification.notifyEventCreated(
                    payload.eventId,
                    payload.eventTitle,
                    user.uid,
                    userIds
                );
                break;

            case 'create_notification':
                // Create a single notification
                console.log('[API/Notifications] Creating notification for:', payload.userId);

                try {
                    // Safe handling of institutionId
                    const institutionId = user.institutionId || user.tenantId || 'default';

                    const notificationData = {
                        ...payload,
                        userId: payload.userId,
                        isRead: false,
                        isArchived: false,
                        institutionId: institutionId,
                        createdAt: new Date().toISOString(),
                        sourceUserId: user.uid
                    };

                    const notificationRef = await firestore.collection('notifications').add(notificationData);
                    console.log('[API/Notifications] Notification created in Firestore:', notificationRef.id);

                    // Log audit event (wrapped in try/catch to be ultra safe)
                    try {
                        console.log('[API/Notifications] Attempting audit log...');
                        await logNotificationSent(
                            user.uid,
                            institutionId,
                            notificationRef.id,
                            { type: 'single', userId: payload.userId }
                        );
                        console.log('[API/Notifications] Audit log success');
                    } catch (auditErr) {
                        console.error('[API/Notifications] Audit log failed (Ignored):', auditErr);
                    }

                    return NextResponse.json({ success: true, data: { id: notificationRef.id } });
                } catch (dbError) {
                    console.error('[API/Notifications] DB Write Failed:', dbError);
                    throw dbError;
                }

            case 'create_batch_notifications':
                // Create batch notifications
                const batch = firestore.batch();
                const { userIds: targetUserIds, params } = payload;
                const batchInstitutionId = user.institutionId || user.tenantId || 'default';

                // Filter out source user
                const filteredUserIds = targetUserIds.filter((id: string) => id !== user.uid);

                filteredUserIds.forEach((userId: string) => {
                    const notificationRef = firestore.collection('notifications').doc();
                    batch.set(notificationRef, {
                        ...params,
                        userId,
                        isRead: false,
                        isArchived: false,
                        institutionId: batchInstitutionId, // Add tenant context
                        createdAt: new Date().toISOString(),
                        sourceUserId: user.uid
                    });
                });

                await batch.commit();

                // Log audit event
                try {
                    await logNotificationSent(
                        user.uid,
                        batchInstitutionId,
                        '0', // Batch ID not available
                        { type: 'batch', count: filteredUserIds.length }
                    );
                } catch (auditErr) { console.error('Audit log failed', auditErr); }

                return NextResponse.json({ success: true });

            case 'mark_as_read':
                // Mark notification as read
                await firestore.collection('notifications').doc(payload.notificationId).update({
                    isRead: true,
                    readAt: new Date().toISOString()
                });
                return NextResponse.json({ success: true });

            case 'mark_all_as_read':
                // Mark all notifications as read for user
                const unreadQuery = await firestore.collection('notifications')
                    .where('userId', '==', user.uid)
                    .where('isRead', '==', false)
                    .where('isArchived', '==', false)
                    .get();

                const updateBatch = firestore.batch();
                unreadQuery.docs.forEach((doc: any) => {
                    updateBatch.update(doc.ref, {
                        isRead: true,
                        readAt: new Date().toISOString()
                    });
                });

                await updateBatch.commit();
                return NextResponse.json({ success: true });

            case 'archive_notification':
                // Archive notification
                await firestore.collection('notifications').doc(payload.notificationId).update({
                    isArchived: true,
                    archivedAt: new Date().toISOString()
                });
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: 'Unknown trigger type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error triggering notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
