import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';

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
        const department = searchParams.get('department');

        const db = adminDb;
        let query = db.collection('leave_requests').orderBy('requestedAt', 'desc');

        // Apply department filter if provided
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
                const reqStart = req.requestedAt.toDate();
                return reqStart >= start && reqStart <= end;
            });
        }

        // Calculate summary statistics
        const total = requests.length;
        const pending = requests.filter((r: any) => r.status === 'pending').length;
        const approved = requests.filter((r: any) => r.status === 'approved').length;
        const rejected = requests.filter((r: any) => r.status === 'rejected').length;
        const approvalRate = total > 0 ? ((approved / (approved + rejected)) * 100).toFixed(1) : 0;

        // Calculate average processing time (for approved/rejected requests)
        const processedRequests = requests.filter((r: any) => r.reviewedAt);
        let avgProcessingTime = 0;
        if (processedRequests.length > 0) {
            const totalTime = processedRequests.reduce((sum: number, req: any) => {
                const requested = req.requestedAt.toDate().getTime();
                const reviewed = req.reviewedAt.toDate().getTime();
                return sum + (reviewed - requested);
            }, 0);
            avgProcessingTime = Math.round(totalTime / processedRequests.length / (1000 * 60 * 60)); // Convert to hours
        }

        // Group by type
        const byType: { type: string; count: number }[] = [];
        const typeMap = new Map<string, number>();
        requests.forEach((req: any) => {
            typeMap.set(req.type, (typeMap.get(req.type) || 0) + 1);
        });
        typeMap.forEach((count, type) => {
            byType.push({ type, count });
        });

        // Group by month (last 12 months)
        const byMonth: { month: string; count: number }[] = [];
        const monthMap = new Map<string, number>();
        requests.forEach((req: any) => {
            const date = req.requestedAt.toDate();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        });

        // Fill in last 12 months
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            byMonth.push({
                month: monthKey,
                count: monthMap.get(monthKey) || 0
            });
        }

        // Group by department
        const byDepartment: { department: string; count: number }[] = [];
        const deptMap = new Map<string, number>();
        requests.forEach((req: any) => {
            const dept = req.requestedBy.department || 'Not Assigned';
            deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });
        deptMap.forEach((count, department) => {
            byDepartment.push({ department, count });
        });

        // Get upcoming approved leaves (next 30 days)
        const today = new Date();
        const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcoming = requests.filter((req: any) => {
            if (req.status !== 'approved') return false;
            const startDate = req.startDate.toDate();
            return startDate >= today && startDate <= next30Days;
        }).slice(0, 10); // Limit to 10

        return NextResponse.json({
            summary: {
                total,
                pending,
                approved,
                rejected,
                approvalRate: parseFloat(approvalRate as string),
                avgProcessingTime
            },
            byType,
            byMonth,
            byDepartment,
            upcoming: upcoming.map((req: any) => ({
                id: req.id,
                type: req.type,
                startDate: req.startDate.toDate().toISOString(),
                endDate: req.endDate.toDate().toISOString(),
                totalDays: req.totalDays,
                requestedBy: req.requestedBy
            }))
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
