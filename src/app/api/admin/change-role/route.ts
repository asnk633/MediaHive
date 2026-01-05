import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';

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
