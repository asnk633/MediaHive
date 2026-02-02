// src/app/api/health/debug/route.ts
// Dev-only endpoint for debugging request logs

import { NextRequest, NextResponse } from 'next/server';
import { addRequestLog, getRequestLogs, clearRequestLogs } from '@/lib/request-logger';

// Ensure this endpoint is only available in development
const isDevEnvironment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E === '1';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Only available in dev environment
  if (!isDevEnvironment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Return the recent request logs
    const logs = getRequestLogs();
    return NextResponse.json({ 
      logs,
      count: logs.length,
      maxLogs: 100
    }, { status: 200 });
  } catch (error) {
    console.error('Debug logs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug logs' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Only available in dev environment
  if (!isDevEnvironment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Clear all request logs
    clearRequestLogs();
    return NextResponse.json({ 
      success: true, 
      message: 'Debug logs cleared' 
    }, { status: 200 });
  } catch (error) {
    console.error('Debug logs DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear debug logs' }, { status: 500 });
  }
}
