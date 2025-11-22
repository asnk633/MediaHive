// src/lib/request-logger.ts
// Utility for logging requests in development

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

/**
 * Get all request logs
 */
export function getRequestLogs() {
  return requestLogs;
}

/**
 * Clear all request logs
 */
export function clearRequestLogs() {
  requestLogs = [];
}