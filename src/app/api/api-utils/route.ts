import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'api-utils',
    timestamp: new Date().toISOString()
  });
}
