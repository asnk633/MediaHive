import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: 'unknown',
            auth: 'unknown'
        },
        uptime: process.uptime()
    };

    try {
        const start = performance.now();
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let dbStatus = 'healthy';
        let authStatus = 'healthy';

        // 1. Check Supabase DB
        const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
        if (dbError) {
            console.error('Supabase DB Health Check Failed', dbError);
            dbStatus = 'unhealthy';
        }

        // 2. Check Supabase Auth
        const { error: authError } = await supabase.auth.admin.listUsers({ perPage: 1 });
        if (authError) {
            console.error('Supabase Auth Health Check Failed', authError);
            authStatus = 'unhealthy';
        }

        const serviceLatency = Math.round(performance.now() - start);

        health.services.database = dbStatus;
        health.services.auth = authStatus;

        const status = (dbStatus === 'healthy' && authStatus === 'healthy') ? 200 : 503;
        if (status === 503) health.status = 'error';

        return NextResponse.json({
            ...health,
            latency: `${serviceLatency}ms`
        }, { status });

    } catch (error: any) {
        console.error('[HEALTH_CHECK_CRITICAL_FAILURE]', error);
        return NextResponse.json({
            status: 'error',
            services: { database: 'unhealthy', auth: 'unknown' }
        }, { status: 503 });
    }
}
