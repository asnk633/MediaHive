import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';
import { format } from 'date-fns';


export const dynamic = 'force-dynamic';

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

        // Check if user is admin
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');
        const department = searchParams.get('department');

        const db = adminDb;
        let query = db.collection('leave_requests').orderBy('requestedAt', 'desc');

        // Apply filters
        if (status) {
            query = query.where('status', '==', status) as any;
        }
        if (department) {
            query = query.where('requestedBy.department', '==', department) as any;
        }

        const snapshot = await query.get();
        let requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by date range if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            requests = requests.filter((req: any) => {
                const reqStart = req.startDate.toDate();
                return reqStart >= start && reqStart <= end;
            });
        }

        // Generate CSV
        const csvRows = [
            // Header
            ['Requested By', 'Department', 'Type', 'Start Date', 'End Date', 'Days', 'Status', 'Requested On', 'Reviewed By', 'Reviewed On', 'Rejection Reason']
        ];

        requests.forEach((req: any) => {
            csvRows.push([
                req.requestedBy.name,
                req.requestedBy.department || 'N/A',
                req.type,
                format(req.startDate.toDate(), 'yyyy-MM-dd'),
                format(req.endDate.toDate(), 'yyyy-MM-dd'),
                req.totalDays.toString(),
                req.status,
                format(req.requestedAt.toDate(), 'yyyy-MM-dd HH:mm'),
                req.reviewedBy?.name || '-',
                req.reviewedAt ? format(req.reviewedAt.toDate(), 'yyyy-MM-dd HH:mm') : '-',
                req.rejectionReason || '-'
            ]);
        });

        const csvContent = csvRows.map(row =>
            row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leave-requests-${format(new Date(), 'yyyy-MM-dd')}.csv"`
            }
        });
    } catch (error) {
        console.error('Error exporting leave requests:', error);
        return NextResponse.json({ error: 'Failed to export requests' }, { status: 500 });
    }
}
