import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'admin' && user.role !== 'team') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const instId = user.institution_id;

        const headers = {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        };

        // Parallel aggregation queries using Supabase count
        const [
            { count: totalTasks },
            { count: totalEvents },
            { count: totalInventory },
            { count: lowStock },
            { count: outOfStock }
        ] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).match(instId ? { institution_id: instId } : {}),
            supabase.from('system_events').select('*', { count: 'exact', head: true }).match(instId ? { institution_id: instId } : {}),
            supabase.from('inventory').select('*', { count: 'exact', head: true }).match(instId ? { institution_id: instId } : {}),
            supabase.from('inventory').select('*', { count: 'exact', head: true }).match({ ...(instId ? { institution_id: instId } : {}), status: 'low' }),
            supabase.from('inventory').select('*', { count: 'exact', head: true }).match({ ...(instId ? { institution_id: instId } : {}), status: 'out' })
        ]);

        return NextResponse.json({
            overview: {
                totalTasks: totalTasks || 0,
                totalEvents: totalEvents || 0,
                totalInventory: totalInventory || 0,
                lowStock: lowStock || 0,
                outOfStock: outOfStock || 0,
                generatedAt: new Date().toISOString()
            }
        }, { headers });

    } catch (error: any) {
        console.error('Error fetching report overview:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch overview' }, { status: 500 });
    }
}
