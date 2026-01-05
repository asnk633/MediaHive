import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { calculateTotalDays } from '@/utils/dateUtils';

// GET: Fetch user's leave requests
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = adminAuth;
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const db = adminDb;
        const snapshot = await db.collection('leave_requests')
            .where('requestedBy.uid', '==', uid)
            .orderBy('requestedAt', 'desc')
            .get();

        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ requests });
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

// POST: Submit new leave request
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

        // Get user details
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data()!;
        const body = await req.json();
        const { type, startDate, endDate, reason } = body;

        // Validation
        if (!type || !startDate || !endDate || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (reason.length < 10) {
            return NextResponse.json({ error: 'Reason must be at least 10 characters' }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
        }

        // Calculate total days
        const totalDays = calculateTotalDays(start, end);

        // Create leave request
        const db = adminDb;
        const now = Timestamp.now();

        const leaveRequest = {
            type,
            startDate: Timestamp.fromDate(start),
            endDate: Timestamp.fromDate(end),
            totalDays,
            reason,
            status: 'pending',
            requestedBy: {
                uid,
                name: userData.officialName || userData.name || 'Unknown',
                department: userData.defaultDepartment || 'General',
                photoURL: userData.avatarUrl
            },
            requestedAt: now,
            updatedAt: now
        };

        const docRef = await db.collection('leave_requests').add(leaveRequest);

        // Send notification to all admins
        const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        const adminUids = adminsSnapshot.docs.map(doc => doc.id);

        if (adminUids.length > 0) {
            const notificationPromises = adminUids.map(adminUid =>
                db.collection('notifications').add({
                    type: 'leave_submitted',
                    title: 'New Leave Request',
                    message: `${leaveRequest.requestedBy.name} requested ${type} leave for ${totalDays} day(s)`,
                    userId: adminUid,
                    read: false,
                    createdAt: now,
                    data: {
                        leaveRequestId: docRef.id,
                        requesterName: leaveRequest.requestedBy.name,
                        leaveType: type,
                        startDate: startDate,
                        endDate: endDate
                    }
                })
            );

            await Promise.all(notificationPromises);
        }

        return NextResponse.json({ id: docRef.id, message: 'Leave request submitted successfully' });
    } catch (error) {
        console.error('Error submitting leave request:', error);
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }
}
