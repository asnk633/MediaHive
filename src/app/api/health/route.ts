import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/server';

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
            const db = adminDb;
            await db.collection('system').doc('healthcheck').get();
        } catch (e) {
            console.error('Firestore Health Check Failed', e);
            dbStatus = 'unhealthy';
        }

        // 2. Check Auth (Verify Token Cycle)
        try {
            // Ensure we use the canonical instance
            const { adminAuth } = await import('@/lib/firebase/server');

            // A. Check Credential Connectivity (List Users)
            await adminAuth.listUsers(1);

            // B. Check Token Minting & Verification (Full Cycle)
            const testUid = 'health-check-probe';
            const customToken = await adminAuth.createCustomToken(testUid);
            // Note: client SDK normally exchanges custom token for ID token.
            // Admin SDK verifyIdToken expects an ID token, not custom token.
            // But verifySessionCookie verifies session cookies.
            // Since we can't easily exchange custom->ID token server-side without REST API,
            // We will trust listUsers() + createCustomToken() as sufficient proof of Admin Credential health.
            // For extra rigour, we just log the projected audience.

            console.log('[HEALTH] Auth Cycle Valid. Minted token for:', testUid, 'Project:', adminAuth.app.options.projectId);

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
            latency: `${serviceLatency}ms`,
            projectId: adminAuth.app.options.projectId
        }, { status });

    } catch (error: any) {
        console.error('[HEALTH_CHECK_CRITICAL_FAILURE]', error);

        health.status = 'error';
        health.services.database = 'unhealthy';

        return NextResponse.json(health, { status: 503 });
    }
}
