import { tenantContext } from './auth/tenantContext';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    userId?: string;
    tenantId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    duration?: number;
    metadata?: Record<string, any>;
}

/**
 * MediaHive Structured Logger
 * Provides consistent observability for database operations, auth events, and errors.
 */
export const logger = {
    log: async (level: LogLevel, message: string, context: LogContext = {}) => {
        // Only resolve context if not provided
        let { userId, tenantId } = context;
        if (!userId || !tenantId) {
            try {
                const auth = await tenantContext();
                userId = userId || auth.userId;
                tenantId = tenantId || auth.tenantId;
            } catch {
                // Silent fail for auth resolution in non-auth contexts
            }
        }

        const payload = {
            timestamp: new Date().toISOString(),
            level,
            message,
            userId,
            tenantId,
            ...context
        };

        // In a production environment, this would send to a logging service (ELK, CloudWatch, Datadog)
        // For now, we use a structured JSON log in the console
        const logMethod = level === 'debug' ? 'debug' : level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'info';
        console[logMethod](JSON.stringify(payload));

        // If it's an error, we might also want to log to an audit table in the future
        if (level === 'error' && tenantId) {
            // Future: await supabase.from('audit_logs').insert(...)
        }
    },

    info: (message: string, context?: LogContext) => logger.log('info', message, context),
    warn: (message: string, context?: LogContext) => logger.log('warn', message, context),
    error: (message: string, context?: LogContext) => logger.log('error', message, context),
    debug: (message: string, context?: LogContext) => logger.log('debug', message, context),
};
