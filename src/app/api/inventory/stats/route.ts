// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // Parallel Aggregation Queries (Efficient)
        const [totalRes, inUseRes, unavailableRes] = await Promise.all([
            supabase.from('inventory').select('*', { count: 'exact', head: true }),
            supabase.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'in_use'),
            supabase.from('inventory').select('*', { count: 'exact', head: true }).in('status', ['broken', 'lost', 'out'])
        ]);

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
        console.error('Error fetching inventory stats:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch inventory stats' }, { status: 500 });
    }
}
