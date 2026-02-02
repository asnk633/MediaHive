// src/app/api/middleware/logging.ts
// Middleware to log requests for debugging

import { NextRequest } from 'next/server';
import { addRequestLog } from '@/lib/request-logger';

/**
 * Logging middleware
 * 
 * Logs requests to the debug endpoint for troubleshooting
 */
export async function loggingMiddleware(req: NextRequest) {
  try {
    // Extract relevant information from the request
    const logEntry = {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    };
    
    // Add to request logs
    addRequestLog(logEntry);
  } catch (error) {
    // Silently ignore logging errors
    console.warn('Failed to log request:', error);
  }
}