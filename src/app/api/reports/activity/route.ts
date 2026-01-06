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

        if (user.role !== 'admin' && user.role !== 'team') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const db = adminDb;
        const LIMIT_PER_SOURCE = 5;
        const instId = user.institutionId;

        // Scoped Queries
        let tasksQ = db.collection('tasks').orderBy('updatedAt', 'desc').limit(LIMIT_PER_SOURCE);
        let eventsQ = db.collection('system-events').orderBy('createdAt', 'desc').limit(LIMIT_PER_SOURCE);
        let inventoryQ = db.collection('inventory').orderBy('updatedAt', 'desc').limit(LIMIT_PER_SOURCE);

        if (instId) {
            tasksQ = tasksQ.where('institutionId', '==', instId);
            // eventsQ = eventsQ.where('institutionId', '==', instId); // DANGER: Composite Index (institutionId + createdAt) required
            inventoryQ = inventoryQ.where('institutionId', '==', instId);
        }

        // Parallel fetches with INDEX PROTECTION
        // If an index is missing, Firestore usually throws FAILED_PRECONDITION.
        // We will catch these individually to avoid failing the whole report.

        const fetchSafely = async (query: FirebaseFirestore.Query, label: string) => {
            try {
                return await query.get();
            } catch (e: any) {
                console.warn(`[Report Activity] Failed to fetch ${label}:`, e.message);
                return { docs: [] }; // Return empty on failure
            }
        };

        const [recentTasks, recentEvents, recentInventory] = await Promise.all([
            fetchSafely(tasksQ, 'tasks'),
            fetchSafely(eventsQ, 'events'), // Might fail if filtered by instId without index. 
            fetchSafely(inventoryQ, 'inventory')
        ]);

        // Normalization
        const activities: any[] = [];

        recentTasks.docs.forEach((doc: any) => {
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

        // Use strict type check for events
        if (recentEvents && recentEvents.docs) {
            recentEvents.docs.forEach((doc: any) => {
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
        }

        if (recentInventory && recentInventory.docs) {
            recentInventory.docs.forEach((doc: any) => {
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
        }

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
