import { NextResponse } from 'next/server';
import { ServerNotification } from '@/lib/server-notification';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await ServerNotification.checkInventoryStatus();
        return NextResponse.json({ ok: true, message: 'Inventory Status Checked' });
    } catch (error) {
        console.error('Inventory Cron Error:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
