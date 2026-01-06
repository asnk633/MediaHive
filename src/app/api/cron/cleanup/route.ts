import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
    return NextResponse.json({
        ok: true,
        stub: true,
        message: 'Cleanup cron stubbed'
    });
}

// Explicitly handle other methods to prevent 405 errors being logged as crashes
export async function GET() { return new NextResponse(null, { status: 405 }); }
export async function PUT() { return new NextResponse(null, { status: 405 }); }
export async function DELETE() { return new NextResponse(null, { status: 405 }); }
