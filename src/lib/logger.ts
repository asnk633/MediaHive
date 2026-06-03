export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_FIELDS = ['password', 'token', 'key', 'secret', 'authorization'];

export interface SystemEvent {
  type: string;
  endpoint?: string;
  retryCount?: number;
  timestamp: string;
  metadata?: any;
  level: LogLevel;
}

class SystemLogger {
  private logs: SystemEvent[] = [];
  private readonly MAX_LOGS = 200;
  private readonly TELEMETRY_SAMPLE_RATE = 0.1; // 10% of logs

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('system_telemetry_logs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  log(event: Omit<SystemEvent, 'timestamp'>) {
    // 1. Redaction
    const safeMetadata = this.redact(event.metadata);

    const fullEvent: SystemEvent = {
      ...event,
      metadata: safeMetadata,
      timestamp: new Date().toISOString()
    };

    // 2. Local Buffer Pruning
    this.logs.unshift(fullEvent);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('system_telemetry_logs', JSON.stringify(this.logs));
      } catch (e) {
        // Ignore quota errors
      }
    }

    // 3. Telemetry (Sampled)
    if (Math.random() < this.TELEMETRY_SAMPLE_RATE || event.level === 'error') {
      this.sendToRemote(fullEvent);
    }

    // 4. Console output with structured formatting
    const color = this.getColor(event.level);
    console.log(
      `%c[${fullEvent.timestamp}] [${event.level.toUpperCase()}] [${event.type}]`, 
      `color: ${color}; font-weight: bold;`,
      safeMetadata || ''
    );
  }

  private redact(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const result = { ...obj };
    for (const key in result) {
      if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = this.redact(result[key]);
      }
    }
    return result;
  }

  private async sendToRemote(event: SystemEvent) {
    // Mock: Send to Supabase 'system_logs' table
    // supabase.from('system_logs').insert([event]);
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'error': return '#f87171';
      case 'warn': return '#fbbf24';
      case 'info': return '#60a5fa';
      case 'debug': return '#94a3b8';
      default: return 'white';
    }
  }

  getLogs() {
    return this.logs;
  }
}

export const logger = new SystemLogger();

/**
 * Convenience helper for event logging
 */
export const logEvent = (type: string, metadata?: any, level: LogLevel = 'info') => {
  logger.log({ type, metadata, level });
};

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: any[]) => {
    logger.log({ type: 'console_error', level: 'error', metadata: { args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) } });
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    logger.log({ type: 'console_warn', level: 'warn', metadata: { args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) } });
    originalWarn.apply(console, args);
  };
}
