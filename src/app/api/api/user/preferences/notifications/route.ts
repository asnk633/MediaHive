import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = await adminDb.collection('user_preferences').doc(user.uid).get();

        // Strict Mode: No inferred defaults. 
        // If missing, return null so client initializes explicitly.
        if (!doc.exists) {
            return NextResponse.json({ notifications: null });
        }

        const data = doc.data();
        return NextResponse.json({ notifications: data?.notifications || null });
    } catch (error: any) {
        console.error('Error fetching preferences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notifications } = body;

        if (!notifications || typeof notifications !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Validate fields
        const validKeys = ['deviceRequests', 'taskAssignments', 'systemUpdates'];
        const clean: any = {};

        for (const key of validKeys) {
            if (typeof notifications[key] === 'boolean') {
                clean[key] = notifications[key];
            }
        }

        await adminDb.collection('user_preferences').doc(user.uid).set({
            notifications: clean,
            updatedAt: new Date()
        }, { merge: true });

        return NextResponse.json({ message: 'Preferences updated', notifications: clean });
    } catch (error: any) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
