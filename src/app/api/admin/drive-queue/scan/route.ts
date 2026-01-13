import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { DriveScannerService } from '@/lib/drive-scanner';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { count, logs } = await DriveScannerService.scanIncomingFolder();

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
