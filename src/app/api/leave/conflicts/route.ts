import { NextResponse } from 'next/server';


export const dynamic = 'force-dynamic';

export async function GET() {
    // Stub implementation to prevent 404s
    return NextResponse.json({ conflicts: [] });
}
