
import { NextResponse } from 'next/server';
import { ServerNotification } from '@/lib/server-notification';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
    // Basic authorization check (e.g., using a secret header if planned, but for now simple open or admin check)
    // Since this is internal/cron, we often rely on Vercel Cron protection or a secret.
    // For now, we'll allow it but log. Ideally checks 'Authorization: Bearer CRON_SECRET'.

    try {
        const authHeader = request.headers.get('authorization');
        // Uncomment if secret is set
        // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const result = await ServerNotification.checkInventoryStatus();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('Inventory Cron Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
