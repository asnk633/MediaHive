
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { SystemActivity } from '@/types/activity';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit') || '50';
        const limit = parseInt(limitStr);

        const snapshot = await adminDb.collection('activities')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const activities: SystemActivity[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
            } as SystemActivity;
        });

        return NextResponse.json({ activities });

    } catch (error: any) {
        console.error('GET /api/activities error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Basic validation
        if (!body.title || !body.type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newActivity = {
            ...body,
            timestamp: Timestamp.now(),
            performedBy: user.name || 'Unknown',
            performedByRole: user.role || 'guest'
        };

        const ref = await adminDb.collection('activities').add(newActivity);

        return NextResponse.json({
            id: ref.id,
            ...newActivity,
            timestamp: newActivity.timestamp.toDate().toISOString()
        });

    } catch (error: any) {
        console.error('POST /api/activities error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
