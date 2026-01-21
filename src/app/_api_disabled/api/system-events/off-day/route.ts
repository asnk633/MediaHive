import { NextResponse } from 'next/server';

export async function GET() {
    // Stub implementation to prevent 404s
    return NextResponse.json({ isOffDay: false });
}
