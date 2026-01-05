import { NextResponse } from 'next/server';
import { ServerNotification } from '@/lib/server-notification';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        // Simple secret protection
        if (key !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result: any = {
            reminders: await ServerNotification.checkReminders(),
            overdue: await ServerNotification.checkOverdue()
        };

        // Check stale tasks if feature is enabled
        if (FEATURE_FLAGS.STALE_TASK_ALERTS) {
            result.staleTasks = await ServerNotification.checkStaleTasks();
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Error running reminders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
