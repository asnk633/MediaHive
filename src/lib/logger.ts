import { captureException } from '@/lib/monitor';

export function logError(err: any, info?: any) {
  // lightweight: console for now, prepared for Sentry/Logflare integration
  console.error('[LOG] ', err, info);
  
  // Capture in monitoring system
  captureException(err, { componentStack: info?.componentStack });
  
  // TODO: forward to external service when configured
}