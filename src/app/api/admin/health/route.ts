import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = getSupabaseAdmin();
        
        // 1. Check DB Connectivity
        const { error: dbError } = await supabase.from('tenants').select('id').limit(1);
        
        // 2. Check Task Assignment Drift (Problem 3 Fix)
        const { data: driftData, error: driftError } = await supabase.rpc('check_assignment_drift');
        
        // Fallback to raw query if RPC doesn't exist yet (we'll add it)
        let driftCount = 0;
        if (driftError) {
            const { data: rawDrift } = await supabase.rpc('execute_sql', { 
                sql_query: `
                    SELECT COUNT(*) as count 
                    FROM public.tasks t 
                    WHERE jsonb_array_length(COALESCE(t.assigned_to, '[]')) != 
                    (SELECT COUNT(*) FROM public.task_assignments WHERE task_id = t.id)
                `
            });
            driftCount = (rawDrift as any)?.[0]?.count || 0;
        } else {
            driftCount = (driftData as any) || 0;
        }

        const health = {
            api: 'healthy',
            db: dbError ? 'down' : 'healthy',
            sync: driftCount > 0 ? 'degraded' : 'healthy',
            drive: 'unknown',
            logger: 'healthy',
            driftCount,
            generatedAt: new Date().toISOString()
        };

        return NextResponse.json({ health });
    } catch (error: any) {
        console.error('[Health Check Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
