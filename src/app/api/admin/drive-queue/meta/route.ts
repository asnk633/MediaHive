import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { DriveScannerService } from '@/lib/drive-scanner';

/**
 * GET /api/admin/drive-queue/meta
 * Returns metadata about the incoming drive folder.
 */
export async function GET(req: NextRequest) {
    const user = await verifyUser(req);
    if (!user || user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const info = await DriveScannerService.getIncomingFolderInfo();
        return NextResponse.json(info);
    } catch (e: any) {
        console.error('[DRIVE_QUEUE_META] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
