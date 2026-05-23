import { NextRequest, NextResponse } from 'next/server';

// Temporary mock endpoint to prevent 404s until the database schema is ready
export async function GET(request: NextRequest) {
  return NextResponse.json({ versions: [] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ version: null, success: true }, { status: 200 });
}
