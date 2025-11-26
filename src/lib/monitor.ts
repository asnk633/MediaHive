// Lightweight monitoring abstraction - prepared for future integration with Sentry, Logflare, etc.

export function captureException(error: any, context?: Record<string, any>) {
  // For now, just log to console
  console.error('[MONITOR] Exception captured:', error, context);
  
  // TODO: Forward to external service when configured
  // Example: Sentry.captureException(error, { contexts: { app: context } });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  // For now, just log to console
  console.log(`[MONITOR] ${level.toUpperCase()}:`, message);
  
  // TODO: Forward to external service when configured
  // Example: Sentry.captureMessage(message, level);
}

// Feature flag to enable/disable monitoring (default off)
export const MONITORING_ENABLED = process.env.NEXT_PUBLIC_MONITORING_ENABLED === 'true';