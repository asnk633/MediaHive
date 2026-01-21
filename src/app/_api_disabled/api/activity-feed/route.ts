import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Security Check: Admin Only
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Fetch Logs from Firestore (system_activity)
        const snapshot = await adminDb.collection('system_activity')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Enrich with User Data from Firestore
        // Collect unique Actor IDs
        const uids = Array.from(new Set(logs.map((log: any) => log.actorId))) as string[];

        const userMap = new Map<string, { name: string, avatarUrl?: string }>();

        if (uids.length > 0) {
            const userDocs = await Promise.all(
                uids.map((uid: string) => adminDb.collection('users').doc(uid).get())
            );

            userDocs.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    userMap.set(doc.id, {
                        name: data?.officialName || data?.name || 'Unknown',
                        avatarUrl: data?.avatarUrl || data?.photoURL
                    });
                }
            });
        }

        // 4. Transform for Frontend
        const feed = logs.map((log: any) => {
            const userInfo = userMap.get(log.actorId) || { name: 'Unknown User' };

            // Handle timestamp normalization (Firestore Timestamp vs ISO string)
            let timestamp = new Date().toISOString();
            if (log.createdAt && typeof log.createdAt.toDate === 'function') {
                timestamp = log.createdAt.toDate().toISOString();
            } else if (log.createdAt) {
                timestamp = new Date(log.createdAt).toISOString();
            }

            return {
                id: log.id,
                action: log.action || 'activity',
                resourceType: log.entityType || 'system',
                resourceId: log.entityId,
                timestamp: timestamp,
                details: log.metadata || log.details || {},
                user: {
                    uid: log.actorId,
                    name: userInfo.name,
                    avatarUrl: userInfo.avatarUrl
                }
            };
        });

        return NextResponse.json({ feed });

    } catch (error: any) {
        console.error('Error fetching activity feed:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
