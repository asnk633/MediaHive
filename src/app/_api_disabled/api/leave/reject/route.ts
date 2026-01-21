import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

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

        // Check if user is admin
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { requestId, adminUid, adminName, reason } = body;

        if (!requestId || !reason) {
            return NextResponse.json({ error: 'Request ID and reason required' }, { status: 400 });
        }

        if (reason.length < 10) {
            return NextResponse.json({ error: 'Rejection reason must be at least 10 characters' }, { status: 400 });
        }

        const db = adminDb;
        const requestRef = db.collection('leave_requests').doc(requestId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        const requestData = requestDoc.data()!;

        if (requestData.status !== 'pending') {
            return NextResponse.json({ error: 'Only pending requests can be rejected' }, { status: 400 });
        }

        const now = Timestamp.now();

        // Update request status
        await requestRef.update({
            status: 'rejected',
            reviewedBy: {
                uid: adminUid || uid,
                name: adminName || userDoc.data()?.officialName || 'Admin'
            },
            reviewedAt: now,
            rejectionReason: reason,
            updatedAt: now
        });

        // Send notification to requester
        await db.collection('notifications').add({
            type: 'leave_rejected',
            title: 'Leave Request Rejected',
            message: `Your ${requestData.type} leave request was rejected. Reason: ${reason}`,
            userId: requestData.requestedBy.uid,
            read: false,
            createdAt: now,
            data: {
                leaveRequestId: requestId,
                leaveType: requestData.type,
                startDate: requestData.startDate.toDate().toISOString(),
                endDate: requestData.endDate.toDate().toISOString(),
                rejectionReason: reason
            }
        });

        return NextResponse.json({ message: 'Leave request rejected successfully' });
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }
}
