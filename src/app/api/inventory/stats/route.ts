import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';
import { withTenant } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/inventory/stats] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        console.log(`[INV_STATS] 📊 Fetching stats for tenant: ${tenantId}`);

        // Parallel Aggregation Queries (Efficient)
        const [totalRes, inUseRes, unavailableRes] = await Promise.all([
            withTenant(supabase.from('inventory').select('*', { count: 'exact', head: true }), tenantId),
            withTenant(supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'in_use'), tenantId),
            withTenant(supabase.from('inventory').select('*', { count: 'exact', head: true }).in('status', ['broken', 'lost', 'out']), tenantId)
        ]);

        if (totalRes.error) throw totalRes.error;
        if (inUseRes.error) throw inUseRes.error;
        if (unavailableRes.error) throw unavailableRes.error;

        const total = totalRes.count || 0;
        const inUse = inUseRes.count || 0;
        const unavailable = unavailableRes.count || 0;

        return NextResponse.json({
            total,
            inUse,
            unavailable,
            utilization: total > 0 ? (inUse / total) * 100 : 0
        });

    } catch (error: any) {
        console.error('[INV_STATS_ROUTE] Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            context: 'INV_STATS_ROUTE'
        }, { status: 500 });
    }
}
