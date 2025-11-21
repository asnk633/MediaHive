// src/app/api/health/debug/route.ts
// Dev-only endpoint for debugging request logs

import { NextRequest, NextResponse } from 'next/server';

// Ensure this endpoint is only available in development
const isDevEnvironment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E === '1';

// In-memory store for request logs (ephemeral and capped)
let requestLogs: any[] = [];
const MAX_LOGS = 100;

/**
 * Add a request log entry
 * 
 * @param entry Log entry to add
 */
export function addRequestLog(entry: any) {
  // Only log in dev environment
  if (!isDevEnvironment) return;
  
  // Add timestamp
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  
  // Add to logs
  requestLogs.push(logEntry);
  
  // Cap logs
  if (requestLogs.length > MAX_LOGS) {
    requestLogs = requestLogs.slice(-MAX_LOGS);
  }
}

export async function GET(req: NextRequest) {
  // Only available in dev environment
  if (!isDevEnvironment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Return the recent request logs
    return NextResponse.json({ 
      logs: requestLogs,
      count: requestLogs.length,
      maxLogs: MAX_LOGS
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
    requestLogs = [];
    return NextResponse.json({ 
      success: true, 
      message: 'Debug logs cleared' 
    }, { status: 200 });
  } catch (error) {
    console.error('Debug logs DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear debug logs' }, { status: 500 });
  }
}