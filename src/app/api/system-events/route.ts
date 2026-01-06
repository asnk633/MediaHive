import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { logEventCreated, logEventUpdated, logEventDeleted } from '@/app/api/_lib/audit';

const COLLECTION = 'system_events';

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
    // Stub implementation
    return NextResponse.json({
        events: [],
        meta: {
            stub: true,
            message: 'System events stubbed'
        }
    });
}

// --- POST Request Handler ---
export async function POST(request: NextRequest) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to create system events (Admin or Team - though usually Admin for system wide)
        // Sticking to Admin/Team as per other events for consistency, but maybe stricter for system events?
        // Let's stick to Admin for System Events as they affect everyone
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.title || typeof body.title !== 'string') {
            return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
        }

        // Prepare event data
        const eventData: any = {
            ...body,
            isSystemEvent: true, // Explicit flag
            createdBy: {
                uid: user.uid,
                name: user.name || 'Admin',
                role: user.role
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await firestore.collection(COLLECTION).add(eventData);

        // Log audit event (reusing event log helper, or generic if needed)
        // We can assume logEventCreated works dynamically or we might want a specific one later
        await logEventCreated(
            user.uid,
            (user.tenantId && typeof user.tenantId === 'number') ? user.tenantId : 1,
            docRef.id,
            { title: body.title, type: 'system_event' }
        );

        // Return the created event
        const createdEvent = { id: docRef.id, ...eventData };

        // --- Send Broadcast Notification ---
        try {
            // Import dynamically to avoid circular dependencies if any
            const { ServerNotification } = await import('@/lib/server-notification');

            // Fetch all active users for broadcast
            // Ideally we should filter by status='active' but schema might just be users collection
            const usersSnapshot = await firestore.collection('users').get();
            const allUserIds = usersSnapshot.docs.map((doc: any) => doc.id);

            if (allUserIds.length > 0) {
                await ServerNotification.notifyEventCreated(
                    docRef.id,
                    body.title,
                    'system', // Use 'system' so the admin/creator receives the notification too
                    allUserIds
                );
                console.log(`[SystemEvent] Broadcast notification sent to ${allUserIds.length} users.`);
            }
        } catch (notifError) {
            console.error('[SystemEvent] Failed to send broadcast notification:', notifError);
            // Non-blocking: don't fail the request
        }

        return NextResponse.json({ data: createdEvent }, { status: 201 });
    } catch (error: any) {
        console.error('POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + (error as Error).message },
            { status: 500 }
        );
    }
}

// --- PUT Request Handler ---
export async function PUT(request: NextRequest) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const body = await request.json();

        // Check if event exists
        const eventDoc = await firestore.collection(COLLECTION).doc(id).get();
        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Prepare updates
        const updates: any = {
            ...body,
            updatedAt: new Date().toISOString()
        };

        delete updates.createdBy; // Protect ownership

        await firestore.collection(COLLECTION).doc(id).update(updates);

        await logEventUpdated(
            user.uid,
            (user.tenantId && typeof user.tenantId === 'number') ? user.tenantId : 1,
            id,
            { changes: Object.keys(updates), type: 'system_event' }
        );

        const updatedEvent = { id, ...eventDoc.data(), ...updates };
        return NextResponse.json({ data: updatedEvent }, { status: 200 });
    } catch (error: any) {
        console.error('PUT error:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + (error as Error).message },
            { status: 500 }
        );
    }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const eventDoc = await firestore.collection(COLLECTION).doc(id).get();
        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        await firestore.collection(COLLECTION).doc(id).delete();

        await logEventDeleted(
            user.uid,
            (user.tenantId && typeof user.tenantId === 'number') ? user.tenantId : 1,
            id
        );

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error('DELETE error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        );
    }
}
