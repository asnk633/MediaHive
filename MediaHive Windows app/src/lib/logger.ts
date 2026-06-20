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
    const safeMetadata = this.redact(event.metadata);

    const fullEvent: SystemEvent = {
      ...event,
      metadata: safeMetadata,
      timestamp: new Date().toISOString()
    };

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

export const logEvent = (type: string, metadata?: any, level: LogLevel = 'info') => {
  logger.log({ type, metadata, level });
};
