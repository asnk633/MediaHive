import { NextResponse } from 'next/server';

import { verifyAdmin } from '@/lib/verifyUser';

export async function GET(req: Request) {
    const { authorized, response } = await verifyAdmin(req);
    if (!authorized) return response;

    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'admin-metrics'
    });
}
