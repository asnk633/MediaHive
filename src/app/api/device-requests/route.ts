import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// STUB IMPLEMENTATION - ISOLATING RUNTIME CRASHES
// imports commented out to prove route registration works
// import { adminDb } from '@/lib/firebase/server';
// import { verifyUser } from '@/lib/server-utils';
// import { ServerNotification } from '@/lib/server-notification';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        items: [],
        meta: {
            stub: true,
            status: 'online',
            message: 'Device requests route is verified and accessible.'
        }
    });
}

export async function POST(request: NextRequest) {
    return NextResponse.json({
        message: 'Device requests POST stubbed for verification',
        stub: true
    }, { status: 200 });
}
