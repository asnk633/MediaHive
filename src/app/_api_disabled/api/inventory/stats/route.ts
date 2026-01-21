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
        const collection = db.collection('inventory');

        // Parallel Aggregation Queries (Efficient)
        // 1. Total Count
        const totalQuery = collection.count();

        // 2. In Use Count
        const inUseQuery = collection.where('status', '==', 'in_use').count();

        // 3. Unavailable / Alerts Count (broken, lost, out)
        // Note: 'in' query works with count()
        const unavailableQuery = collection.where('status', 'in', ['broken', 'lost', 'out']).count();

        const [totalSnap, inUseSnap, unavailableSnap] = await Promise.all([
            totalQuery.get(),
            inUseQuery.get(),
            unavailableQuery.get()
        ]);

        const total = totalSnap.data().count;
        const inUse = inUseSnap.data().count;
        const unavailable = unavailableSnap.data().count;

        return NextResponse.json({
            total,
            inUse,
            unavailable,
            utilization: total > 0 ? (inUse / total) * 100 : 0
        });

    } catch (error: any) {
        console.error('Error fetching inventory stats:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch inventory stats' }, { status: 500 });
    }
}
