import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { attendance, users } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { verifyUser } from '@/lib/verifyUser';
import { withTenantDrizzle } from '@/lib/tenantQuery';
import { convertToCSV, logExportAction } from '@/utils/exportHelpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize role
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // 2. Tenant scoping
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      console.error(`[GET /api/admin/exports/attendance] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const format = searchParams.get('format') || 'json';

    // 4. Build filters
    const filters = [
      withTenantDrizzle(attendance, tenantId)
    ];

    if (fromDate) {
      filters.push(gte(attendance.checkIn, fromDate));
    }
    if (toDate) {
      filters.push(lte(attendance.checkIn, toDate));
    }

    // 5. Query database
    const db = await getDb();
    const records = await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        institution_id: attendance.institution_id,
        department_id: attendance.department_id,
        tenantId: attendance.tenantId,
        notes: attendance.notes,
        status: attendance.status,
        workedMinutes: attendance.workedMinutes,
        lateArrival: attendance.lateArrival,
        earlyExit: attendance.earlyExit,
        pendingTasksAtCheckout: attendance.pendingTasksAtCheckout,
        completedTasksToday: attendance.completedTasksToday,
        approvedEarlyExit: attendance.approvedEarlyExit,
        negativeDisciplineEvent: attendance.negativeDisciplineEvent,
        markedBy: attendance.markedBy,
        created_at: attendance.created_at,
        fullName: users.fullName,
        email: users.email,
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .where(and(...filters))
      .orderBy(desc(attendance.checkIn));

    // 6. Find admin user details for audit logging
    const adminRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email || ''))
      .limit(1);

    const adminId = adminRecord[0]?.id || 0;
    const adminTenantId = adminRecord[0]?.tenantId || (typeof tenantId === 'string' && !isNaN(Number(tenantId)) ? Number(tenantId) : tenantId);

    const auditUser = {
      id: adminId,
      tenantId: typeof adminTenantId === 'string' && !isNaN(Number(adminTenantId)) ? Number(adminTenantId) : adminTenantId as any
    };

    const dateRangeStr = `From: ${fromDate || 'all'} To: ${toDate || 'all'}`;
    await logExportAction(db, auditUser, 'attendance', dateRangeStr, format, { from: fromDate, to: toDate });

    // 7. Format response
    if (format === 'csv') {
      const csvContent = convertToCSV(records, [
        { header: 'Record ID', key: (r: any) => r.id },
        { header: 'Employee Name', key: (r: any) => r.fullName },
        { header: 'Email', key: (r: any) => r.email },
        { header: 'Check In', key: (r: any) => r.checkIn },
        { header: 'Check Out', key: (r: any) => r.checkOut || '' },
        { header: 'Status', key: (r: any) => r.status || '' },
        { header: 'Worked Minutes', key: (r: any) => r.workedMinutes },
        { header: 'Notes', key: (r: any) => r.notes || '' },
        { header: 'Late Arrival', key: (r: any) => r.lateArrival ? 'Yes' : 'No' },
        { header: 'Early Exit', key: (r: any) => r.earlyExit ? 'Yes' : 'No' },
        { header: 'Negative Discipline', key: (r: any) => r.negativeDisciplineEvent ? 'Yes' : 'No' }
      ]);

      const filename = `attendance_export_${Date.now()}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Default to JSON
    return NextResponse.json(records, { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/admin/exports/attendance] Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
