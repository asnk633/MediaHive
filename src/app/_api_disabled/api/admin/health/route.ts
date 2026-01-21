import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { adminDb } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const now = new Date();
        const stats: any = {
            api: 'healthy',
            db: 'unknown',
            drive: 'unknown',
            logger: 'unknown',
            lastScan: null,
            lastLog: null,
            generatedAt: now.toISOString()
        };

        // 1. Database Check (Ping)
        try {
            await adminDb.collection('system_settings').doc('global').get();
            stats.db = 'healthy';
        } catch (e) {
            stats.db = 'down';
        }

        // 2. Drive Integration Check
        // Check for last 'drive_scan' or 'file_uploaded' action in logs
        try {
            const scanSnap = await adminDb.collection('system_activity')
                .where('action', 'in', ['drive_scan', 'file_processed', 'file_uploaded'])
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (!scanSnap.empty) {
                const lastScan = scanSnap.docs[0].data().createdAt;
                stats.lastScan = lastScan;

                // Compare time (if > 24h ago? maybe just inform status)
                // Let's say if > 24 hours, maybe degraded or just idle. 
                // For now, strict 'down' if never.
                stats.drive = 'healthy';
            } else {
                stats.drive = 'unknown'; // No logs yet
            }
        } catch (e) {
            console.error('Drive health check failed:', e);
            stats.drive = 'degraded';
        }

        // 3. Logger Check
        // Check for ANY recent log
        try {
            const logSnap = await adminDb.collection('system_activity')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (!logSnap.empty) {
                const lastLog = logSnap.docs[0].data().createdAt;
                stats.lastLog = lastLog;
                stats.logger = 'healthy';
            } else {
                stats.logger = 'unknown';
            }
        } catch (e) {
            stats.logger = 'down';
        }

        return NextResponse.json({ health: stats });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
