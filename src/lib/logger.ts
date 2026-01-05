/**
 * Structured Logger
 * 
 * Provides consistent JSON logging for easier parsing by observability tools (Datadog, CloudWatch, etc).
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  [key: string]: any;
}

export const logger = {
  log: (level: LogLevel, message: string, meta: Record<string, any> = {}) => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    // In dev, pretty print mostly; in prod, JSON line.
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, meta);
    } else {
      console.log(JSON.stringify(entry));
    }
  },

  info: (message: string, meta?: Record<string, any>) => logger.log('info', message, meta),
  warn: (message: string, meta?: Record<string, any>) => logger.log('warn', message, meta),
  error: (message: string, meta?: Record<string, any>) => logger.log('error', message, meta),
  debug: (message: string, meta?: Record<string, any>) => logger.log('debug', message, meta),
};