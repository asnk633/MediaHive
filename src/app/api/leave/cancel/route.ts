import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = adminAuth;
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const body = await req.json();
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
        }

        const db = adminDb;
        const requestRef = db.collection('leave_requests').doc(requestId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        const requestData = requestDoc.data()!;

        // Verify ownership
        if (requestData.requestedBy.uid !== uid) {
            return NextResponse.json({ error: 'You can only cancel your own requests' }, { status: 403 });
        }

        // Only pending requests can be cancelled
        if (requestData.status !== 'pending') {
            return NextResponse.json({ error: 'Only pending requests can be cancelled' }, { status: 400 });
        }

        // Update status to cancelled
        await requestRef.update({
            status: 'cancelled',
            updatedAt: Timestamp.now()
        });

        return NextResponse.json({ message: 'Leave request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling leave request:', error);
        return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 });
    }
}
