import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { auditLog } from '@/db/schema';
import { desc } from 'drizzle-orm';
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

        // 2. Fetch Audit Logs from SQLite
        const db = await getDb();
        const logs = await db
            .select()
            .from(auditLog)
            .orderBy(desc(auditLog.timestamp))
            .limit(20);

        // 3. Enrich with User Data from Firestore
        // Collect unique UIDs
        const uids = Array.from(new Set(logs.map((log: any) => log.userId)));

        // Fetch User Profiles (Optimization: multi-get)
        // Since Firestore doesn't support "get all these IDs" in one go smoothly without `where 'in'`, 
        // and `where 'in'` is limited to 10 or 30, we'll just fetch all users if uids count is high, 
        // or loop get if low. For the feed, we might have 10-20 unique users max.
        // Actually, let's just fetch all users for simplicity and cache them in memory for this request? 
        // No, `getAllUsers` is safer. Or just `Promise.all` the handful of unique UIDs.

        const userMap = new Map<string, { name: string, avatarUrl?: string }>();

        if (uids.length > 0) {
            // Use Promise.all with chunking if needed, but for 20 logs, UIDs <= 20.
            const userDocs = await Promise.all(
                uids.map(uid => adminDb.collection('users').doc(uid).get())
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
        const feed = logs.map(log => {
            const userInfo = userMap.get(log.userId) || { name: 'Unknown User' };

            // Parse details if it's a string (it is, based on schema default)
            let parsedDetails = {};
            try {
                parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            } catch (e) {
                // ignore parse error
            }

            return {
                id: log.id,
                action: log.action,
                resourceType: log.resourceType,
                resourceId: log.resourceId,
                timestamp: log.timestamp,
                details: parsedDetails,
                user: {
                    uid: log.userId,
                    name: userInfo.name,
                    avatarUrl: userInfo.avatarUrl
                }
            };
        });

        return NextResponse.json({ feed });

    } catch (error: any) {
        console.error('Error fetching activity feed:', error);
        return NextResponse.json(
            { error: 'Internal server error: ' + error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
