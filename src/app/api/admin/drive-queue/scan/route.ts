import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { DriveScannerService } from '@/lib/drive-scanner';
import { assertDriveEnv } from '@/lib/drive-config';
import { MonitoringService } from '@/services/monitoringService';
import { AuditService } from '@/services/auditService';

/**
 * POST /api/admin/drive-queue/scan
 * Triggers a scan of the incoming drive folder.
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Authorization Check
        const user = await verifyUser(req);
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Pre-flight Environment Check
        try {
            assertDriveEnv();
        } catch (configError: any) {
            MonitoringService.error('[DRIVE_QUEUE_SCAN] Config Error', configError);
            return NextResponse.json({ 
                error: 'Drive is not configured correctly on the server.', 
                details: configError.message 
            }, { status: 503 }); // Service Unavailable
        }

        // 3. Log the trigger
        await AuditService.logAction({
            action: 'DRIVE_SCAN_TRIGGERED',
            entityType: 'drive_queue',
            entityId: 'incoming',
            summary: `Drive scan triggered by admin: ${user.email}`,
            classification: 'OPERATIONAL',
            metadata: { actor_email: user.email }
        });

        // 4. Execute Scan
        const result = await MonitoringService.trace(
            'drive.scan_incoming_folder',
            () => DriveScannerService.scanIncomingFolder()
        );
        
        return NextResponse.json({
            message: `Scan complete. Found ${result.count} new items.`,
            count: result.count,
            logs: result.logs
        });

    } catch (e: any) {
        MonitoringService.error('[DRIVE_QUEUE_SCAN] Runtime Error', e);
        return NextResponse.json({ 
            error: 'An unexpected error occurred during the drive scan.',
            message: e.message 
        }, { status: 500 });
    }
}
