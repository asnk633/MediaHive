import { verifyUser } from '@/lib/server/server-utils';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { withTenant } from '@/lib/tenantQuery';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TABLE = 'device_requests';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/inventory/requests] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const supabase = getSupabaseAdmin();

        let baseQuery = supabase
            .from(TABLE)
            .select('*');

        let query = withTenant(baseQuery, tenantId);

        // Access Control Logic
        if (user.role === 'admin' || (user.role === 'manager' || user.role === 'member')) {
            // Admin/Team can see all for the tenant
        } else {
            // Regular user only their own within the tenant
            query = query.eq('user_id', user.uid);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching inventory requests:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[POST /api/inventory/requests] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const data = await request.json();
        const supabase = getSupabaseAdmin();

        const payload = {
            ...data,
            status: 'pending',
            created_at: new Date().toISOString(),
            user_id: user.uid,
            tenant_id: tenantId,
            institution_id: user.institution_id || data.institution_id
        };

        const { data: inserted, error } = await supabase
            .from(TABLE)
            .insert([payload])
            .select('id')
            .single();

        if (error) throw error;
        return NextResponse.json({ id: inserted.id }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating inventory request:', error);
        return NextResponse.json({ error: error.message || 'Failed to create request' }, { status: 500 });
    }
}

