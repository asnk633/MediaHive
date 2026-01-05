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

        // Logic from original route.ts
        const usersSnapshot = await db.collection('users').get();
        const teamMembers = usersSnapshot.docs
            .map(doc => {
                const userData = doc.data();
                return {
                    uid: doc.id,
                    role: userData.role,
                    name: userData.officialName || userData.name || userData.email || 'Unknown',
                    email: userData.email,
                    avatarUrl: userData.avatarUrl,
                    photoURL: userData.photoURL
                };
            })
            .filter(user => user.role === 'team' || user.role === 'admin')
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
