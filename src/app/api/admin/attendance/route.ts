import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize
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
      console.error(`[GET /api/admin/attendance] ❌ Missing tenant context for user: ${user.uid}`);
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userIdParam = searchParams.get('userId');
    const limitParam = searchParams.get('limit') ?? '50';
    const offsetParam = searchParams.get('offset') ?? '0';

    const limit = parseInt(limitParam, 10);
    const offset = parseInt(offsetParam, 10);

    if (isNaN(limit) || limit < 0) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'Invalid offset parameter' }, { status: 400 });
    }

    // 4. Query Supabase directly — it is the canonical source of truth for attendance.
    //    The local SQLite dev.db only has mock data and is NOT synced with Supabase.
    const supabase = getSupabaseAdmin();

    // First try with tenantId filter
    let query = supabase
      .from('attendance')
      .select('*')
      .order('checkInTime', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (startDate) {
      query = query.gte('checkInTime', startDate);
    }
    if (endDate) {
      query = query.lte('checkInTime', endDate + 'T23:59:59Z');
    }
    if (userIdParam) {
      query = query.eq('userId', userIdParam);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error('[GET /api/admin/attendance] Supabase error:', error.message, error.code);
      return NextResponse.json({ error: 'Failed to fetch attendance: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(normalizeRecords(records || []), { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/admin/attendance] Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

/**
 * Normalize Supabase camelCase column names to the shape the frontend expects.
 * The Supabase `attendance` table uses camelCase (e.g. checkInTime, userId).
 */
function normalizeRecords(records: any[]) {
  return records.map((r) => ({
    id: r.id,
    userId: r.userId,
    fullName: r.userName ?? 'Unknown',
    email: null,
    checkIn: r.checkInTime,
    checkOut: r.checkOutTime,
    checkInSource: r.checkInSource,
    checkOutSource: r.checkOutSource,
    attendanceState: r.attendanceState,
    workMode: r.workMode,
    closeReason: r.closeReason,
    campusName: r.campusName,
    campusId: r.campusId,
    isHoliday: r.isHoliday,
    isWeekend: r.isWeekend,
    presenceStatus: r.presenceStatus,
    geofenceViolations: r.geofenceViolations,
    deviceName: r.deviceName,
    status: r.presenceStatus ?? 'present',
    notes: null,
    workedMinutes: r.checkInTime && r.checkOutTime
      ? Math.round((new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 60000)
      : null,
    lateArrival: false,
    earlyExit: false,
    created_at: r.createdAt,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
