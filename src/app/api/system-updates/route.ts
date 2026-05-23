import { NextResponse } from 'next/server';

export async function GET() {
    // In a real implementation, this would fetch from the database.
    // For now, we return an empty array or could share state, 
    // but a mock empty response prevents the 404 crash.
    return NextResponse.json({ updates: [] });
}
