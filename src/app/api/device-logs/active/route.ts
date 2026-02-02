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

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return Response.json({ error: 'Request ID required' }, { status: 400 });
        }

        const db = adminDb;
        // Query logs for this request. 
        // We avoid orderBy here to prevent index errors (safe for small result sets)
        const snapshot = await db.collection('device_logs')
            .where('requestId', '==', requestId)
            .get();

        if (snapshot.empty) {
            return Response.json({ logId: null });
        }

        // Find the most recent log based on issuedAt
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        logs.sort((a: any, b: any) => {
            const dateA = new Date(a.issuedAt || 0).getTime();
            const dateB = new Date(b.issuedAt || 0).getTime();
            return dateB - dateA; // Descending
        });

        const activeLog = logs[0];

        // Ensure this log isn't already returned?
        // Service logic just asks for "active" log. 
        // If it's already returned, we might just be updating it?
        // But typically we want the one that HASN'T been returned yet.
        // However, if the user messed up the flow, maybe we want the latest one anyway.
        // Let's stick to returning ID of the latest log.

        return Response.json({ logId: activeLog.id, log: activeLog });
    } catch (error: any) {
        console.error('Error fetching active log:', error);
        return Response.json({ error: error.message || 'Failed to fetch log' }, { status: 500 });
    }
}
