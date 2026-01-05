import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        const db = adminDb;
        let query: FirebaseFirestore.Query = db.collection('device_requests');

        if (userId) {
            // If user is not admin, they can only see their own requests
            if (user.role !== 'admin' && user.uid !== userId) {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
            }
            query = query.where('requester.uid', '==', userId);
        } else {
            // If no userId, only admin can see all
            if (user.role !== 'admin') {
                // Default to own requests if not admin and no userId specified
                query = query.where('requester.uid', '==', user.uid);
            }
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return Response.json({ requests });
    } catch (error: any) {
        console.error('Error fetching device requests:', error);
        return Response.json({ error: error.message || 'Failed to fetch device requests' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields (basic)
        if (!data.itemCategory || !data.startDate || !data.endDate) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let requester = {
            uid: user.uid,
            name: user.name || user.email || 'Unknown',
            role: user.role
        };

        // Allow Admin to request on behalf of others
        // We look for 'requester' in data, which DeviceRequestForm sends.
        if (user.role === 'admin' && data.requester && data.requester.uid) {
            requester = {
                uid: data.requester.uid,
                name: data.requester.name || 'Unknown',
                role: data.requester.role || 'team'
            };
        }

        const newRequest = {
            ...data,
            requester,
            status: 'pending',
            createdBy: user.uid, // Track who actually created it
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const db = adminDb;
        const docRef = await db.collection('device_requests').add(newRequest);

        // Notify Admins
        try {
            // Only notify if the requester is NOT an admin (prevent self-notification spam if admin creates request)
            if (user.role !== 'admin') {
                const adminIds = await ServerNotification.getAdminIds();
                await ServerNotification.broadcast(adminIds, {
                    type: 'info', // Using generic info type
                    title: 'New Device Request',
                    message: `${newRequest.requester.name} requested ${newRequest.description}`,
                    entityType: 'device_request',
                    entityId: docRef.id,
                    actionUrl: '/inventory/requests',
                    sourceUserId: user.uid,
                    priority: 'medium'
                });
            }
        } catch (notifError) {
            console.error('Failed to send admin notification:', notifError);
            // Non-blocking error
        }

        return Response.json({ id: docRef.id, message: 'Request created' });
    } catch (error: any) {
        console.error('Error creating device request:', error);
        return Response.json({ error: error.message || 'Failed to create request' }, { status: 500 });
    }
}
