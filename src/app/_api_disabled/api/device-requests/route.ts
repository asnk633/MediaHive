import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { ServerNotification } from '@/lib/server-notification';
import { logSystemActivity } from '@/lib/server/activity-logger';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let query: FirebaseFirestore.Query = adminDb.collection('device_requests');

        // Phase 1: Scoping
        if (user.institutionId) {
            query = query.where('institutionId', '==', user.institutionId);
        }

        if (user.role !== 'admin') {
            // Non-admins only see their own requests
            query = query.where('requester.uid', '==', user.uid);
        }

        let snapshot = await query.get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // In-memory sort
        items.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({
            items,
            meta: { total: items.length }
        });
    } catch (error: any) {
        console.error('GET device-requests error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
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
            institutionId: user.institutionId || 'thaiba-media-main', // Enforce Scope
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const db = adminDb;
        const docRef = await db.collection('device_requests').add(newRequest);

        await logSystemActivity({
            actorId: user.uid,
            actorRole: requester.role || 'viewer',
            action: 'inventory_request_create',
            entityType: 'inventory_request',
            entityId: docRef.id,
            summary: `Request: ${data.itemCategory} (${data.quantity || 1})`,
            source: 'system',
            severity: 'info',
            visibility: { mode: 'admin' },
            metadata: {
                startDate: data.startDate,
                endDate: data.endDate
            }
        });

        // Notify Admins
        try {
            if (user.role !== 'admin') {
                const adminIds = await ServerNotification.getAdminIds();
                await ServerNotification.broadcast(adminIds, {
                    type: 'info',
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
        }

        return Response.json({ id: docRef.id, message: 'Request created' });
    } catch (error: any) {
        console.error('Error creating device request:', error);
        return Response.json({ error: error.message || 'Failed to create request' }, { status: 500 });
    }
}
