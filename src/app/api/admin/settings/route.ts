import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { systemSettingsService } from '@/services/systemSettingsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/admin/settings] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const settings = await systemSettingsService.getSettings(tenantId);
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

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[POST /api/admin/settings] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        // Validate allowed keys
        const allowedKeys = ['allowMemberTasks', 'publicFilesDefault', 'driveAutoScan'];
        if (!allowedKeys.includes(key)) {
            return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
        }

        await systemSettingsService.updateSetting(key, value, user.uid, tenantId, user.name || 'Admin');

        return NextResponse.json({ success: true, message: 'Setting updated' });

    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
