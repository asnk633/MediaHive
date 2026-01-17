import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

/**
 * GET /api/users/[id]
 * Fetches a single user by their ID
 * 
 * Authorization:
 * - Users can fetch their own profile
 * - Admins can fetch any user's profile
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params (Next.js 15+ requirement)
        const { id: userId } = await params;

        // Explicitly ignore 'admins' and 'team' to avoid conflict with static routes
        // (Next.js should prioritize static routes, but this safety check prevents logic errors if it doesn't)
        if (userId === 'admins' || userId === 'team') {
            return Response.json({ error: 'Route conflict: Use dedicated endpoint' }, { status: 404 });
        }

        if (!userId) {
            return Response.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify user authentication
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Authorization: Users can only fetch their own profile, or admins can fetch any profile
        if (user.uid !== userId && user.role !== 'admin') {
            return Response.json(
                { error: "Forbidden: Cannot access other user's profile" },
                { status: 403 }
            );
        }

        const db = adminDb;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        return Response.json({ user: { uid: userDoc.id, ...userData } });
    } catch (error: any) {
        console.error(`[API] Error fetching user ${(await params).id}:`, error);
        return Response.json(
            { error: error.message || 'Failed to fetch user' },
            { status: 500 }
        );
    }
}
