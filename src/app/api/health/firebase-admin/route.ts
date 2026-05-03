import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'deprecated',
    service: 'firebase-admin-proxy',
    message: 'Firebase is legacy. Systems migrating to Supabase.',
    timestamp: new Date().toISOString()
  });
}
