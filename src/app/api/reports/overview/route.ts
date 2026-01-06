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
        const headers = {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        };

        // Parallel aggregation queries for performance
        const [
            tasksCount,
            eventsCount,
            inventoryCount,
            lowStockCount,
            outOfStockCount
        ] = await Promise.all([
            db.collection('tasks').count().get(),
            db.collection('system-events').count().get(), // Check collection name
            db.collection('inventory').count().get(),
            db.collection('inventory').where('status', '==', 'low').count().get(),
            db.collection('inventory').where('status', '==', 'out').count().get(),
        ]);

        return NextResponse.json({
            overview: {
                totalTasks: tasksCount.data().count,
                totalEvents: eventsCount.data().count,
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
