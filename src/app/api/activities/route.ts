import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { logServerActivity } from '@/lib/server/activity-logger';
import { SystemActivity } from '@/types/activity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const limitParam = request.nextUrl.searchParams.get('limit') || '50';
        const limit = parseInt(limitParam, 10);

        const snapshot = await adminDb
            .collection('system_activities')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const activities = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to Date/String if needed (serialized JSON handles ISO/Numbers usually)
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp
            };
        });

        return NextResponse.json({ activities });

    } catch (error: any) {
        console.error('Error fetching activities:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Basic validation
        if (!body.type || !body.entityType || !body.title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Attach reliable user info
        await logServerActivity({
            ...body,
            performedBy: user.name || 'Unknown User',
            performedByRole: user.role || 'guest'
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error creating activity:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
