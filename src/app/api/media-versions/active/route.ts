import { NextRequest, NextResponse } from 'next/server';

// Temporary mock endpoint to prevent 404s until the database schema is ready
export async function GET(request: NextRequest) {
  return NextResponse.json({ version: null, versions: [] }, { status: 200 });
}
