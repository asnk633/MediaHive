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
        const { requestIds, adminUid, adminName } = body;

        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return NextResponse.json({ error: 'Request IDs array required' }, { status: 400 });
        }

        const db = adminDb;
        const now = Timestamp.now();
        const results: { id: string; success: boolean; error?: string }[] = [];

        // Process each request
        for (const requestId of requestIds) {
            try {
                const requestRef = db.collection('leave_requests').doc(requestId);
                const requestDoc = await requestRef.get();

                if (!requestDoc.exists) {
                    results.push({ id: requestId, success: false, error: 'Request not found' });
                    continue;
                }

                const requestData = requestDoc.data()!;

                if (requestData.status !== 'pending') {
                    results.push({ id: requestId, success: false, error: 'Only pending requests can be approved' });
                    continue;
                }

                // Create calendar event
                let calendarEventId: string | undefined;
                try {
                    const calendarEventRef = await db.collection('system_events').add({
                        title: `[Leave] ${requestData.requestedBy.name} - ${requestData.type}`,
                        description: `Auto-generated leave event for ${requestData.requestedBy.name}'s ${requestData.type} leave request.`,
                        type: 'other',
                        isMediaOffDay: false,
                        isRecurring: false,
                        date: requestData.startDate,
                        createdBy: {
                            uid: 'system',
                            name: 'Leave Management System'
                        },
                        createdAt: now,
                        status: 'active',
                        metadata: {
                            source: 'leave_request',
                            leaveRequestId: requestId,
                            userId: requestData.requestedBy.uid,
                            endDate: requestData.endDate
                        }
                    });
                    calendarEventId = calendarEventRef.id;
                } catch (calError) {
                    console.error('Failed to create calendar event:', calError);
                }

                // Deduct balance
                try {
                    const year = new Date().getFullYear();
                    const balanceDocId = `${requestData.requestedBy.uid}_${year}`;
                    const balanceRef = db.collection('user_leave_balances').doc(balanceDocId);
                    const balanceDoc = await balanceRef.get();

                    if (balanceDoc.exists) {
                        const balanceData = balanceDoc.data()!;
                        const currentTaken = balanceData.balances[requestData.type]?.taken || 0;
                        const newTaken = currentTaken + requestData.totalDays;

                        await balanceRef.update({
                            [`balances.${requestData.type}.taken`]: newTaken,
                            updatedAt: now
                        });
                    } else {
                        const { DEFAULT_LEAVE_ALLOWANCES } = await import('@/types/leaveBalance');
                        const initialBalance = {
                            uid: requestData.requestedBy.uid,
                            year,
                            balances: {
                                casual: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.casual },
                                sick: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.sick },
                                planned: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.planned },
                                emergency: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.emergency },
                                other: { taken: 0, total: DEFAULT_LEAVE_ALLOWANCES.other }
                            },
                            updatedAt: now
                        };
                        initialBalance.balances[requestData.type as keyof typeof initialBalance.balances].taken = requestData.totalDays;
                        await balanceRef.set(initialBalance);
                    }
                } catch (balanceError) {
                    console.error('Failed to deduct balance:', balanceError);
                }

                // Update request status
                await requestRef.update({
                    status: 'approved',
                    reviewedBy: {
                        uid: adminUid || uid,
                        name: adminName || userDoc.data()?.officialName || 'Admin'
                    },
                    reviewedAt: now,
                    updatedAt: now,
                    ...(calendarEventId && { calendarEventId })
                });

                // Send notification
                await db.collection('notifications').add({
                    type: 'leave_approved',
                    title: 'Leave Request Approved',
                    message: `Your ${requestData.type} leave request for ${requestData.totalDays} day(s) has been approved`,
                    userId: requestData.requestedBy.uid,
                    read: false,
                    createdAt: now,
                    data: {
                        leaveRequestId: requestId,
                        leaveType: requestData.type,
                        startDate: requestData.startDate.toDate().toISOString(),
                        endDate: requestData.endDate.toDate().toISOString()
                    }
                });

                results.push({ id: requestId, success: true });
            } catch (error: any) {
                console.error(`Error approving request ${requestId}:`, error);
                results.push({ id: requestId, success: false, error: error.message });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            message: `${successCount} of ${requestIds.length} requests approved successfully`,
            results
        });
    } catch (error) {
        console.error('Error in bulk approval:', error);
        return NextResponse.json({ error: 'Failed to process bulk approval' }, { status: 500 });
    }
}
