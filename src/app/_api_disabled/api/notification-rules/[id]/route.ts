import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const updates = await request.json();
        const db = adminDb;

        // Validate ID matches
        // Merge update
        await db.collection('notification_rules').doc(id).set(updates, { merge: true });

        return Response.json({ message: 'Rule updated' });
    } catch (error: any) {
        console.error('Error updating notification rule:', error);
        return Response.json({ error: error.message || 'Failed to update rule' }, { status: 500 });
    }
}
