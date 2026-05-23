import { NextRequest, NextResponse } from 'next/server';

// Temporary mock endpoint to prevent 404s until the database schema is ready
export async function GET(request: NextRequest) {
  return NextResponse.json({ comments: [] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ id: 'mock-comment-id', success: true }, { status: 200 });
}
