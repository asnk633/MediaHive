import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { enabled } = await request.json();
        const db = adminDb;

        await db.collection('notification_rules').doc(id).update({
            enabled,
            updatedAt: new Date().toISOString()
        });

        return Response.json({ message: 'Rule toggled' });
    } catch (error: any) {
        console.error('Error toggling notification rule:', error);
        return Response.json({ error: error.message || 'Failed to toggle rule' }, { status: 500 });
    }
}
