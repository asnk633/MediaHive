import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { DriveScannerService } from '@/lib/drive-scanner';
import { logSystemActivity } from '@/lib/server/activity-logger';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { count, logs } = await DriveScannerService.scanIncomingFolder();

        if (count > 0) {
            await logSystemActivity({
                actorId: user.uid,
                actorRole: user.role,
                action: 'drive_scan_completed',
                entityType: 'drive_scan',
                entityId: 'scan_' + Date.now(),
                summary: `Drive scan found ${count} new files`,
                metadata: {
                    count,
                    logs
                },
                visibility: { mode: 'admin' }
            });
        }

        return NextResponse.json({
            success: true,
            message: count > 0 ? `Scan complete. Found ${count} new files.` : 'Scan complete. No new files found.',
            count,
            logs
        });

    } catch (error: any) {
        console.error('Scan failed:', error);
        return NextResponse.json({ error: error.message || 'Scan failed' }, { status: 500 });
    }
}
