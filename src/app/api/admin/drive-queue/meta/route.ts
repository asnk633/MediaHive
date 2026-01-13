import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { DriveScannerService } from '@/lib/drive-scanner';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const info = await DriveScannerService.getIncomingFolderInfo();

        return NextResponse.json(info);

    } catch (error: any) {
        console.error('Failed to get folder info:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch metadata' }, { status: 500 });
    }
}
