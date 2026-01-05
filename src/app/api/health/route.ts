import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getFirebaseAdminAuth } from '@/firebase/admin';

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
        let dbStatus = 'healthy';
        let authStatus = 'healthy';

        // 1. Check Firestore (Read a doc)
        try {
            const db = getFirebaseAdminDb();
            await db.collection('system').doc('healthcheck').get();
        } catch (e) {
            console.error('Firestore Health Check Failed', e);
            dbStatus = 'unhealthy';
        }

        // 2. Check Auth (List 1 user)
        try {
            // Just check if we can list 1 user (verifies Admin SDK creds & connectivity)
            const adminAuth = getFirebaseAdminAuth();
            await adminAuth.listUsers(1);
        } catch (e) {
            console.error('Auth Health Check Failed', e);
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

        health.status = 'error';
        health.services.database = 'unhealthy';

        return NextResponse.json(health, { status: 503 });
    }
}
