import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getSupabaseAdmin } from '@/lib/verifyUser';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { authorized, response } = await verifyAdmin(req);
    if (!authorized) return response;

    try {
        const supabase = getSupabaseAdmin();

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, status, avatar_url, department_id, institution_id')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('[GET /api/admin/users] Supabase error:', error.message);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        const users = (profiles || []).map((p: any) => ({
            id: p.id,
            fullName: p.full_name ?? p.email ?? 'Unknown',
            email: p.email,
            role: p.role,
            status: p.status,
            avatarUrl: p.avatar_url,
            departmentId: p.department_id,
            institutionId: p.institution_id,
        }));

        return NextResponse.json({ users }, { status: 200 });
    } catch (err: any) {
        console.error('[GET /api/admin/users] Error:', err.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
