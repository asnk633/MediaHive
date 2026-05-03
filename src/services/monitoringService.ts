import * as Sentry from '@sentry/nextjs';

/**
 * MonitoringService
 * Centralized error tracking and performance monitoring.
 * Fully integrated with Sentry.
 */
export const MonitoringService = {

  // --- Context ---
  setUserContext(user: {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    tenant_id?: string | number;
    institution_id?: string | number;
  }) {
    Sentry.setUser({ id: user.id, email: user.email, username: user.full_name });
    Sentry.setTags({
      role: user.role ?? 'unknown',
      tenant_id: user.tenant_id ?? 'unknown',
      institution_id: user.institution_id ?? 'unknown',
    });
  },

  clearUserContext() {
    Sentry.setUser(null);
    Sentry.setTags({ role: null, tenant_id: null, institution_id: null });
  },

  // --- Logging ---
  info(message: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({ level: 'info', message, data });
  },

  warn(message: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({ level: 'warning', message, data });
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    Sentry.captureException(error ?? new Error(message), {
      extra: { message, ...data },
    });
  },

  // --- Performance Tracing ---
  // Returns a finish() function. Caller must invoke it when the operation completes.
  // Usage:
  //   const finish = MonitoringService.startSpan('sync.full_flush', { queue_length: 12 });
  //   await doWork();
  //   finish({ status: 'ok', mutations_sent: 12 });
  startSpan(
    name: string,
    attributes?: Record<string, string | number | boolean>
  ): (resultAttributes?: Record<string, string | number | boolean>) => void {
    const startTime = Date.now();

    Sentry.addBreadcrumb({
      level: 'info',
      message: `[span:start] ${name}`,
      data: attributes,
    });

    return (resultAttributes?: Record<string, string | number | boolean>) => {
      const duration = Date.now() - startTime;
      Sentry.addBreadcrumb({
        level: 'info',
        message: `[span:end] ${name}`,
        data: { duration_ms: duration, ...resultAttributes },
      });

      // Surface slow operations as warnings
      if (duration > 5000) {
        Sentry.captureMessage(`Slow operation: ${name} took ${duration}ms`, {
          level: 'warning',
          extra: { duration_ms: duration, ...attributes, ...resultAttributes },
        });
      }
    };
  },

  // Convenience wrapper for async operations
  async trace<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const finish = this.startSpan(name, attributes);
    try {
      const result = await fn();
      finish({ status: 'ok' });
      return result;
    } catch (err) {
      finish({ status: 'error' });
      this.error(`${name} failed`, err);
      throw err;
    }
  },
};
