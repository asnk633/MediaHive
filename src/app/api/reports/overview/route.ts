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
        const headers = {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        };

        // Scoping
        const instId = user.institutionId;

        let tasksQ = db.collection('tasks');
        let eventsQ = db.collection('system-events'); // Note: system-events might be global, but usually scoped
        let inventoryQ = db.collection('inventory');

        if (instId) {
            tasksQ = tasksQ.where('institutionId', '==', instId) as any;
            // Events sometimes global, but if we have institution field:
            eventsQ = eventsQ.where('institutionId', '==', instId) as any; // Might need loose check if field missing
            inventoryQ = inventoryQ.where('institutionId', '==', instId) as any;
        }

        // Parallel aggregation queries
        const [
            tasksCount,
            inventoryCount,
            lowStockCount,
            outOfStockCount
        ] = await Promise.all([
            tasksQ.count().get(),
            inventoryQ.count().get(),
            instId ? db.collection('inventory').where('institutionId', '==', instId).where('status', '==', 'low').count().get()
                : db.collection('inventory').where('status', '==', 'low').count().get(),
            instId ? db.collection('inventory').where('institutionId', '==', instId).where('status', '==', 'out').count().get()
                : db.collection('inventory').where('status', '==', 'out').count().get(),
        ]);

        // Events might fail if 'system-events' doesn't have institutionId index, so we handle gracefully or assuming global for now 
        // if user provided constraint implies it.
        // Actually system events are usually rare. Let's just count them. If we strictly need scoping:
        // const eventsSnapshot = instId ? await db.collection('system-events').where('institutionId', '==', instId).count().get() : ...
        // SAFE FALLBACK: Count all if unsure, or Count scoped if robust.
        // Let's assume Global for system-events for Admin View, or try scoped.
        // Given Phase 1 requirement: "Align Institution Scoping... system_events"
        // We MUST scope it.

        let eventsCountVal = 0;
        try {
            const eventsQFinal = instId ? db.collection('system-events').where('institutionId', '==', instId) : db.collection('system-events');
            const eventsSnap = await eventsQFinal.count().get();
            eventsCountVal = eventsSnap.data().count;
        } catch (e) {
            console.warn('Events count failed (likely index):', e);
            // Fallback to 0 or non-scoped? Safer to return 0 than crash.
        }


        return NextResponse.json({
            overview: {
                totalTasks: tasksCount.data().count,
                totalEvents: eventsCountVal,
                totalInventory: inventoryCount.data().count,
                lowStock: lowStockCount.data().count,
                outOfStock: outOfStockCount.data().count,
                generatedAt: new Date().toISOString()
            }
        }, { headers });

    } catch (error: any) {
        console.error('Error fetching report overview:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch overview' }, { status: 500 });
    }
}
