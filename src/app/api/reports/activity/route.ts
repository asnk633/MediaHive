import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = adminDb;
        const LIMIT_PER_SOURCE = 5;

        // Parallel fetches for recent activity
        const [recentTasks, recentEvents, recentInventory] = await Promise.all([
            db.collection('tasks')
                .orderBy('updatedAt', 'desc')
                .limit(LIMIT_PER_SOURCE)
                .get(),
            db.collection('system-events')
                .orderBy('createdAt', 'desc')
                .limit(LIMIT_PER_SOURCE)
                .get(),
            db.collection('inventory')
                .orderBy('updatedAt', 'desc')
                .limit(LIMIT_PER_SOURCE)
                .get()
        ]);

        // Normalization
        const activities: any[] = [];

        recentTasks.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'task',
                title: data.title || 'Untitled Task',
                description: `Status: ${data.status}`,
                timestamp: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                meta: { status: data.status, assigneeId: data.assigneeId }
            });
        });

        recentEvents.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'event',
                title: data.title || 'System Event',
                description: data.description || 'No description',
                timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                meta: { severity: data.severity }
            });
        });

        recentInventory.docs.forEach(doc => {
            const data = doc.data();
            activities.push({
                id: doc.id,
                type: 'inventory',
                title: `Stock Update: ${data.name}`,
                description: `Quantity: ${data.quantity} ${data.unit}`,
                timestamp: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                meta: { status: data.status, quantity: data.quantity }
            });
        });

        // Sort combined list by timestamp desc
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Return top 20 combined
        const feed = activities.slice(0, 20);

        return NextResponse.json({
            activity: feed
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
            }
        });

    } catch (error: any) {
        console.error('Error fetching activity report:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch activity' }, { status: 500 });
    }
}
