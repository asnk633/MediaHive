import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        console.log('[API] GET /api/users/admins called');

        // Relaxed: Allow any authenticated user to fetch admin list (needed for guest notifications)
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const usersSnapshot = await adminDb.collection('users')
            .where('role', '==', 'admin')
            .get();

        const admins = usersSnapshot.docs
            .map(doc => {
                const userData = doc.data();
                return {
                    uid: doc.id,
                    role: userData.role,
                    name: userData.officialName || userData.name || userData.displayName || userData.email || 'Unknown',
                    avatarUrl: userData.avatarUrl || null,
                    photoURL: userData.photoURL || null
                };
            })
            .map(user => ({
                uid: user.uid,
                name: user.name,
                avatarUrl: user.avatarUrl,
                photoURL: user.photoURL
            }));

        return NextResponse.json({ admins });
    } catch (error: any) {
        console.error('Error fetching admins:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch admins' }, { status: 500 });
    }
}
