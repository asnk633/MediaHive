import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function POST() {
    // Fire-and-forget audit endpoint
    // Currently just successful return to prevent 404 errors in client
    return NextResponse.json({ ok: true });
}
