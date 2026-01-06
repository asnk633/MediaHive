import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';

export async function GET(request: NextRequest) {
    // Stub implementation to ensure safe return
    return NextResponse.json({
        items: [],
        meta: {
            stub: true,
            message: 'Device requests stubbed'
        }
    });
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
