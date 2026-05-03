// Lightweight monitoring abstraction - prepared for future integration with Sentry, Logflare, etc.

import { apiClient } from '@/lib/apiClient';

export async function captureEvent(payload: any) {
  const url = process.env.MONITORING_WEBHOOK;
  if (!url) return;
  try {
    // Note: This is sending to an external webhook URL, so we can't use apiClient
    await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    console.warn('monitor failed', e);
  }
}

export function captureException(error: any, context?: Record<string, any>) {
  // For now, just log to console
  console.error('[MONITOR] Exception captured:', error, context);

  // Send to webhook if configured
  captureEvent({
    type: 'exception',
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });

  // TODO: Forward to external service when configured
  // Example: Sentry.captureException(error, { contexts: { app: context } });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  // For now, just log to console
  console.log(`[MONITOR] ${level.toUpperCase()}:`, message);

  // Send to webhook if configured
  captureEvent({
    type: 'message',
    message,
    level,
    timestamp: new Date().toISOString()
  });

  // TODO: Forward to external service when configured
  // Example: Sentry.captureMessage(message, level);
}

// Feature flag to enable/disable monitoring (default off)
export const MONITORING_ENABLED = process.env.NEXT_PUBLIC_MONITORING_ENABLED === 'true';
