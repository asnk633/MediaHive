import { NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        const { id } = params;
        const body = await req.json();
        const { action } = body; // 'markRead' or 'archive'

        const docRef = firestore.collection('notifications').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        const data = doc.data();
        if (data?.userId !== user.uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (action === 'markRead') {
            await docRef.update({ isRead: true });
        } else if (action === 'archive') {
            await docRef.update({ isArchived: true });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
