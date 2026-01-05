import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { verifyUser } from '@/lib/server-utils';

// Force dynamic to ensure we get fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const userId = user.uid; // Assuming string UID from verifyUser (Firebase)

        // 1. Fetch Tasks
        // We need: Pending (Active), Completed, Overdue
        // We also want recent activity

        const allUserTasks = await db.select().from(tasks)
            .where(
                and(
                    eq(tasks.assignedToId, typeof userId === 'number' ? userId : parseInt(userId as string) || 0), // Handle potential type mismatch if userId is int in DB
                    eq(tasks.isArchived, false)
                )
            );

        // Note: verifyUser returns Firebase UID (string), but DB uses int IDs for users typically?
        // Let's double check how verifyUser maps. 
        // verifyUser returns {...decodedToken, ...userData}. 
        // If users table has int ID, we need that. 
        // verifyUser fetches from Firestore 'users' collection usually. 
        // BUT `tasks` table in Drizzle might be using SQL int IDs. 
        // Let's check schema.ts to be safe. 
        // schema.ts -> tasks.assignedToId is integer?

        // For now, assuming verifyUser gives us the SQL ID if it's stored in Firebase User doc or we need to lookup using email/uid.
        // Actually, verifyUser implementation in `src/lib/server-utils.ts` fetches from Firestore `users` collection.
        // Does Firestore user doc have the SQL `id`? 
        // In `route.ts` (Intelligence), it maps `allUsers` from SQL.

        // Let's assume we need to find the SQL user ID first if `user.id` isn't it.
        // User object from verifyUser has `uid` (Firebase). 
        // If the Postgres `users` table is synced, we should query Postgres `users` by `firebaseUid` if it exists, or `email`.
        // Let's check `users` schema in a separate view if needed, but for now I will try to use `user.id` if it exists on the verifyUser object (it mixes in Firestore data).

        // Let's try to query by Email if ID is uncertain, or assume `user.id` is the SQL ID if the AuthContext/VerifyUser provides it.
        // Checking `verifyUser` implementation:
        // `const userDoc = await adminDb.collection('users').doc(decoded.uid).get();`
        // `...userData` is spread. If Firestore has `id` field (SQL ID), we are good.

        // Providing a safe fallback lookup just in case:
        // Debug Logging
        console.log('[API] Personal Reports: User verified', { uid: user.uid, email: user.email, id: user.id });

        let sqlUserId = user.id;
        if (!sqlUserId) {
            console.log('[API] Personal Reports: user.id missing, looking up by email', user.email);
            const userRecord = await db.query.users.findFirst({
                where: (users: any, { eq }: any) => eq(users.email, user.email)
            });
            if (userRecord) {
                sqlUserId = userRecord.id;
                console.log('[API] Personal Reports: Found user by email', sqlUserId);
            } else {
                console.log('[API] Personal Reports: User not found by email');
            }
        }

        if (!sqlUserId) {
            console.warn('[API] Personal Reports: SQL User ID not found for ' + user.email + '. Returning empty stats.');
            // Return empty stats instead of erroring
            return NextResponse.json({
                stats: { pending: 0, dueSoon: 0, overdue: 0, completionRate: 0, totalAssigned: 0 },
                chartData: [],
                recentActivity: []
            });
        }

        const taskList = await db.select().from(tasks)
            .where(
                and(
                    eq(tasks.assignedToId, sqlUserId),
                    eq(tasks.isArchived, false)
                )
            )
            .orderBy(desc(tasks.createdAt));

        const now = new Date();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(now.getDate() + 2);

        // Stats Calculation
        let pending = 0;
        let completed = 0;
        let overdue = 0;
        let dueSoon = 0;

        // For Chart (Last 7 days completed)
        const last7DaysMap = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7DaysMap.set(d.toISOString().split('T')[0], 0);
        }

        taskList.forEach((t: any) => {
            if (t.status === 'done') {
                completed++;
                // Check if completed in last 7 days for chart
                if (t.updatedAt) {
                    const doneDate = new Date(t.updatedAt).toISOString().split('T')[0];
                    if (last7DaysMap.has(doneDate)) {
                        last7DaysMap.set(doneDate, (last7DaysMap.get(doneDate) || 0) + 1);
                    }
                }
            } else {
                pending++; // status != done
                if (t.dueDate) {
                    const dueDate = new Date(t.dueDate);
                    if (dueDate < now) {
                        overdue++;
                    } else if (dueDate <= twoDaysFromNow) {
                        dueSoon++;
                    }
                }
            }
        });

        const totalAssigned = pending + completed;
        const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

        // Chart Data
        const chartData = Array.from(last7DaysMap.entries())
            .map(([date, count]) => ({ date, count }))
            .reverse();

        // Recent Activity (Last 5 completed)
        const recentActivity = taskList
            .filter((t: any) => t.status === 'done')
            .slice(0, 5)
            .map((t: any) => ({
                id: t.id,
                title: t.title,
                completedAt: t.updatedAt
            }));

        return NextResponse.json({
            stats: {
                pending,
                dueSoon,
                overdue,
                completionRate,
                totalAssigned
            },
            chartData,
            recentActivity
        });

    } catch (error: any) {
        console.error('[API] Personal Reports Error:', error);
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 });
    }
}
