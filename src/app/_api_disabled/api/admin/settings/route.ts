import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { systemSettingsService } from '@/services/systemSettingsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const settings = await systemSettingsService.getSettings();
        return NextResponse.json({ settings });

    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        // Validate allowed keys
        const allowedKeys = ['allowGuestTasks', 'publicFilesDefault', 'driveAutoScan'];
        if (!allowedKeys.includes(key)) {
            return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
        }

        await systemSettingsService.updateSetting(key, value, user.uid, user.name || 'Admin');

        return NextResponse.json({ success: true, message: 'Setting updated' });

    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
