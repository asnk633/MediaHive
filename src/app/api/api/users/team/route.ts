import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
    try {
        const db = adminDb;

        // Check if user is authenticated
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Optimized Query: Only fetch 'team' role
        // Also 'isActive' != false (requires index if mixed with == query?)
        // Firestore allows inequality on one field.
        // Query: where('role', '==', 'team').where('isActive', '!=', false)?
        // Or simply fetch all team members and filter isActive locally (much smaller set than "All Users").
        // Let's filter by role server-side first (Huge win).

        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'team')
            .get();

        const teamMembers = usersSnapshot.docs
            .map(doc => {
                const userData = doc.data();
                return {
                    uid: doc.id,
                    role: userData.role,
                    name: userData.officialName || userData.name || userData.displayName || userData.email || 'Unknown',
                    email: userData.email,
                    avatarUrl: userData.avatarUrl,
                    photoURL: userData.photoURL,
                    isActive: userData.isActive ?? true
                };
            })
            // Filter inactive client-side (safe, small dataset)
            .filter(user => user.isActive !== false)
            .map(user => ({
                uid: user.uid,
                name: user.name,
                avatarUrl: user.avatarUrl,
                photoURL: user.photoURL
            }));

        return Response.json({ teamMembers });

    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return Response.json({ error: error.message || 'Failed to fetch team members' }, { status: 500 });
    }
}
