import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';
import { logSystemActivity } from '@/lib/server/activity-logger';


export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { targetUid, newRole } = body;

        if (!targetUid || !newRole) {
            return NextResponse.json(
                { error: 'Missing targetUid or newRole' },
                { status: 400 }
            );
        }

        await adminDb.collection('users').doc(targetUid).update({
            role: newRole
        });

        console.log(`[API] Admin ${user.uid} changed role for ${targetUid} to ${newRole}`);

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role,
            action: 'user_role_changed',
            entityType: 'user',
            entityId: targetUid,
            summary: `Role changed for user ${targetUid} to ${newRole}`,
            severity: 'critical',
            metadata: {
                targetUid,
                newRole
            },
            visibility: { mode: 'admin' }
        });

        return NextResponse.json({
            success: true,
            message: `Role updated to ${newRole}`
        });

    } catch (error) {
        console.error('Error in change-role API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
