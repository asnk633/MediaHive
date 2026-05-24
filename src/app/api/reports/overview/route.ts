import { NextResponse } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { db, tenantId, user } = await withTenant();

        // 1. Robust Role Extraction
        // Checking app_metadata (synced) and user_metadata (session-based)
        const role = (user.app_metadata?.role || user.user_metadata?.role || user.role)?.toLowerCase();
        
        console.log(`[REPORTS] Access check - User: ${user.id}, Role: ${role}, Tenant: ${tenantId}`);

        // 2. Permission Check
        const authorizedRoles = ['admin', 'manager', 'team', 'super', 'owner'];
        if (!role || !authorizedRoles.includes(role)) {
            console.warn(`[REPORTS] ⚠️ Access Denied: User ${user.id} has insufficient role: ${role}`);
            return NextResponse.json({ 
                error: 'Forbidden: Insufficient permissions',
                userRole: role,
                required: authorizedRoles.join('/')
            }, { status: 403 });
        }

        // 3. Institution Filtering
        const { searchParams } = new URL(req.url);
        const rawInstitutionId = searchParams.get('institution_id');
        
        // Validate if rawInstitutionId is a valid UUID
        const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const institutionId = rawInstitutionId && isUuid(rawInstitutionId) ? rawInstitutionId : null;

        if (rawInstitutionId && !institutionId) {
            console.warn(`[REPORTS] ⚠️ Invalid institution_id format (not a UUID): "${rawInstitutionId}". Ignoring filter.`);
        }

        const headers = {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        };

        // Parallel aggregation queries using Supabase count
        const buildBaseQuery = (table: string) => {
            let q = db.from(table).select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
            if (institutionId) q = q.eq('institution_id', institutionId);
            return q;
        };

        const [
            { count: totalTasks, error: e1 },
            { count: totalEvents, error: e2 },
            { count: totalInventory, error: e3 },
            { count: lowStock, error: e4 },
            { count: outOfStock, error: e5 }
        ] = await Promise.all([
            buildBaseQuery('tasks'),
            buildBaseQuery('events'),
            buildBaseQuery('inventory'),
            buildBaseQuery('inventory').eq('status', 'low'),
            buildBaseQuery('inventory').eq('status', 'out')
        ]);

        if (e1 || e2 || e3 || e4 || e5) {
            const firstError = e1 || e2 || e3 || e4 || e5;
            console.error('[REPORTS] Supabase query error:', firstError);
            if (process.env.NODE_ENV === 'development') {
                console.warn('[REPORTS] Returning safe defaults due to Supabase error in dev mode.');
                return NextResponse.json({
                    overview: {
                        totalTasks: 0,
                        totalEvents: 0,
                        totalInventory: 0,
                        lowStock: 0,
                        outOfStock: 0,
                        generatedAt: new Date().toISOString()
                    }
                }, { headers });
            }
            if (e1) return handleApiError('REP_TASKS', e1);
            if (e2) return handleApiError('REP_EVENTS', e2);
            if (e3) return handleApiError('REP_INV', e3);
            if (e4) return handleApiError('REP_LOW', e4);
            return handleApiError('REP_OUT', e5);
        }

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
        console.error('[REPORTS] Uncaught error in route:', error);
        if (process.env.NODE_ENV === 'development') {
            console.warn('[REPORTS] Returning safe defaults due to uncaught error in dev mode.');
            return NextResponse.json({
                overview: {
                    totalTasks: 0,
                    totalEvents: 0,
                    totalInventory: 0,
                    lowStock: 0,
                    outOfStock: 0,
                    generatedAt: new Date().toISOString()
                }
            });
        }
        return handleApiError('REPORT_OVERVIEW_ROUTE', error);
    }
}
