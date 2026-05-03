import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // Query logs for this request, most recent first
        const { data: logs, error } = await supabase
            .from('device_logs')
            .select('*')
            .eq('request_id', requestId)
            .order('issued_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return NextResponse.json({ logId: null });
        }

        const activeLog = logs[0];

        return NextResponse.json({ logId: activeLog.id, log: activeLog });
    } catch (error: any) {
        console.error('Error fetching active log:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch log' }, { status: 500 });
    }
}
