import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ health: { api: 'healthy', db: 'unknown', drive: 'unknown', logger: 'unknown', lastScan: null, lastLog: null, generatedAt: new Date().toISOString() } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
