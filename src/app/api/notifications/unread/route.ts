
import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.uid;
        const db = adminDb;

        // Count unread notifications
        const unreadSnapshot = await db
            .collection('notifications')
            .where('userId', '==', userId)
            .where('isArchived', '==', false)
            .where('isRead', '==', false)
            .get(); // Using .get() then .size for simple counting. For massive scale, use aggregate count()

        return Response.json({ unreadCount: unreadSnapshot.size });
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        return Response.json({ error: error.message || 'Failed to fetch unread count' }, { status: 500 });
    }
}
