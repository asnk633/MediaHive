import { NextResponse } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { db, tenantId, user } = await withTenant();

        // 1. Robust Role Extraction
        // Checking app_metadata (synced) and user_metadata (session-based)
        const role = (user.app_metadata?.role || user.user_metadata?.role || user.role)?.toLowerCase();
        
        console.log(`[REPORTS] Access check - User: ${user.id}, Role: ${role}, Tenant: ${tenantId}`);

        // 2. Permission Check
        const authorizedRoles = ['admin', 'team', 'super', 'owner'];
        if (!role || !authorizedRoles.includes(role)) {
            console.warn(`[REPORTS] ⚠️ Access Denied: User ${user.id} has insufficient role: ${role}`);
            return NextResponse.json({ 
                error: 'Forbidden: Insufficient permissions',
                userRole: role,
                required: authorizedRoles.join('/')
            }, { status: 403 });
        }

        const headers = {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        };

        // Parallel aggregation queries using Supabase count
        const [
            { count: totalTasks, error: e1 },
            { count: totalEvents, error: e2 },
            { count: totalInventory, error: e3 },
            { count: lowStock, error: e4 },
            { count: outOfStock, error: e5 }
        ] = await Promise.all([
            db.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            db.from('events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            db.from('inventory').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            db.from('inventory').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'low'),
            db.from('inventory').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'out')
        ]);

        if (e1) return handleApiError('REP_TASKS', e1);
        if (e2) return handleApiError('REP_EVENTS', e2);
        if (e3) return handleApiError('REP_INV', e3);
        if (e4) return handleApiError('REP_LOW', e4);
        if (e5) return handleApiError('REP_OUT', e5);

        console.log(`[DB] query executed: fetched report overview for tenant ${tenantId}`);

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
        return handleApiError('REPORT_OVERVIEW_ROUTE', error);
    }
}
