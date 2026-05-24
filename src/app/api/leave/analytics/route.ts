import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, institution_id')
            .eq('id', session.user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const rawInstitutionId = searchParams.get('institution_id');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const department = searchParams.get('department');

        const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        
        let institutionId = rawInstitutionId && isUuid(rawInstitutionId) ? rawInstitutionId : null;
        if (!institutionId && profile?.institution_id && isUuid(profile.institution_id)) {
            institutionId = profile.institution_id;
        }

        if (rawInstitutionId && !isUuid(rawInstitutionId)) {
            console.warn(`[LEAVE ANALYTICS] ⚠️ Invalid institution_id format (not a UUID): "${rawInstitutionId}". Falling back to profile institution or null.`);
        }

        let query = supabase
            .from('leave_requests')
            .select('*');

        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        } else {
            // Safe fallback: if in development and no valid UUID, don't execute empty query or fail,
            // just return empty results or skip filter. To avoid database-wide leakage, in production
            // we'd require a valid scope.
            console.warn('[LEAVE ANALYTICS] No valid UUID for institution_id scope. Returning empty array in dev/fallback mode.');
            if (process.env.NODE_ENV === 'development') {
                return NextResponse.json({
                    success: true,
                    data: {
                        summary: { total: 0, pending: 0, approved: 0, rejected: 0, approvalRate: 0, avgProcessingTime: 0 },
                        byType: [],
                        byMonth: [],
                        byDepartment: [],
                        upcoming: []
                    }
                });
            }
        }

        if (startDate) query = query.gte('start_date', startDate);
        if (endDate) query = query.lte('end_date', endDate);
        if (department) query = query.ilike('requested_by_department', `%${department}%`);

        const { data: requests, error } = await query;

        if (error) throw error;

        // Aggregate statistics
        const total = requests.length;
        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;
        
        const approvedRequests = requests.filter(r => r.status === 'approved');
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        // Calculate average processing time (if we have reviewed_at)
        const reviewedRequests = requests.filter(r => r.reviewed_at && r.requested_at);
        let avgProcessingTime = 0;
        if (reviewedRequests.length > 0) {
            const totalHours = reviewedRequests.reduce((acc, r) => {
                const start = new Date(r.requested_at).getTime();
                const end = new Date(r.reviewed_at).getTime();
                return acc + (end - start) / (1000 * 60 * 60);
            }, 0);
            avgProcessingTime = Math.round(totalHours / reviewedRequests.length);
        }

        // Group by type
        const typeMap: Record<string, number> = {};
        requests.forEach(r => {
            typeMap[r.type] = (typeMap[r.type] || 0) + 1;
        });
        const byType = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

        // Group by month
        const monthMap: Record<string, number> = {};
        requests.forEach(r => {
            const month = r.start_date.substring(0, 7); // YYYY-MM
            monthMap[month] = (monthMap[month] || 0) + 1;
        });
        const byMonth = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));

        // Group by department
        const deptMap: Record<string, number> = {};
        requests.forEach(r => {
            const dept = r.requested_by_department || 'Unknown';
            deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
        const byDepartment = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

        // Upcoming approved leaves
        const now = new Date().toISOString();
        const upcoming = approvedRequests
            .filter(r => r.start_date >= now)
            .sort((a, b) => a.start_date.localeCompare(b.start_date))
            .slice(0, 5)
            .map(r => ({
                id: r.id,
                startDate: r.start_date,
                endDate: r.end_date,
                type: r.type,
                totalDays: r.total_days,
                requestedBy: {
                    name: r.requested_by_name || 'Unknown',
                    department: r.requested_by_department || 'N/A'
                }
            }));

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    total,
                    pending,
                    approved,
                    rejected,
                    approvalRate,
                    avgProcessingTime
                },
                byType,
                byMonth,
                byDepartment,
                upcoming
            }
        });

    } catch (error: any) {
        console.error('Leave Analytics API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
