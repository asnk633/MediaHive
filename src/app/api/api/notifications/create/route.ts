import { NextResponse, NextRequest } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';

export async function POST(req: NextRequest) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Optional: Check if user has permission to send notifications
        // if (user.role !== 'admin' && user.role !== 'manager') { ... }

        let data;
        try {
            data = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { title, body, audience, scheduledAt, attachments } = data;

        // Basic validation
        if (!title || !body) {
            return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
        }

        // Construct notification object
        const notificationData = {
            title,
            body,
            audience: audience || ['all'],
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            attachments: attachments || [],
            createdAt: new Date().toISOString(),
            createdBy: user.uid,
            institutionId: user.institutionId || null,
            isRead: false,
            // You might want to fan-out to specific users here or handle it via a cloud function trigger
            // For now, we'll store it as a "broadcast" type or similar if audience is general
            type: 'announcement', // default type
        };

        const docRef = await firestore.collection('notifications').add(notificationData);

        return NextResponse.json({
            success: true,
            data: { id: docRef.id, ...notificationData }
        });

    } catch (error: any) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
