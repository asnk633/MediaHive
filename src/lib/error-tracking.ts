/**
 * Error Tracking Service
 * 
 * Abstraction layer for error reporting (e.g., Sentry, LogRocket, Datadog).
 * Currently logs to console in JSON format for cloud observability.
 */

// Placeholder for Sentry import
// import * as Sentry from "@sentry/nextjs";

type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface ErrorContext {
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
}

export const errorTracker = {
    /**
     * Capture an exception
     */
    captureException: (error: any, context?: ErrorContext) => {
        // 1. Log to generic logger
        console.error(JSON.stringify({
            level: 'error',
            message: error.message || 'Unknown Error',
            stack: error.stack,
            userId: context?.userId,
            tags: context?.tags,
            extra: context?.extra,
            timestamp: new Date().toISOString()
        }));

        // 2. Send to Sentry (if enabled)
        // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        //   Sentry.captureException(error, {
        //     user: { id: context?.userId },
        //     tags: context?.tags,
        //     extra: context?.extra
        //   });
        // }
    },

    /**
     * Capture a message
     */
    captureMessage: (message: string, severity: ErrorSeverity = 'info', context?: ErrorContext) => {
        console.log(JSON.stringify({
            level: severity,
            message,
            userId: context?.userId,
            tags: context?.tags,
            extra: context?.extra,
            timestamp: new Date().toISOString()
        }));

        // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        //   Sentry.captureMessage(message, {
        //     level: severity,
        //     user: { id: context?.userId },
        //     tags: context?.tags,
        //     extra: context?.extra
        //   });
        // }
    }
};
