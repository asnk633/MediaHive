// src/lib/performance.ts
// Performance monitoring and timing utilities

export interface TimingMetrics {
  duration: number;
  timestamp: number;
  endpoint: string;
  userAgent?: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private timings: TimingMetrics[] = [];
  private maxTimings = 1000;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  start(label: string): number {
    return performance.now();
  }

  // End timing and record metrics
  end(label: string, startTime: number, endpoint: string): number {
    const duration = performance.now() - startTime;
    
    // Record timing metrics
    const metrics: TimingMetrics = {
      duration,
      timestamp: Date.now(),
      endpoint,
    };

    // Add to timings array
    this.timings.push(metrics);
    
    // Keep array size limited
    if (this.timings.length > this.maxTimings) {
      this.timings = this.timings.slice(-this.maxTimings);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`[PERFORMANCE] Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get timing statistics
  getStats(): { 
    avgDuration: number; 
    maxDuration: number; 
    minDuration: number; 
    totalOperations: number 
  } {
    if (this.timings.length === 0) {
      return {
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        totalOperations: 0
      };
    }

    const durations = this.timings.map(t => t.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return {
      avgDuration,
      maxDuration,
      minDuration,
      totalOperations: this.timings.length
    };
  }

  // Clear timing data
  clear(): void {
    this.timings = [];
  }

  // Get recent timings
  getRecentTimings(limit = 50): TimingMetrics[] {
    return this.timings.slice(-limit);
  }
}

// Utility function for timing async operations
export async function timeAsyncOperation<T>(
  operation: () => Promise<T>,
  label: string,
  endpoint: string
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = monitor.start(label);
  
  try {
    const result = await operation();
    monitor.end(label, startTime, endpoint);
    return result;
  } catch (error) {
    monitor.end(label, startTime, endpoint);
    throw error;
  }
}

// Utility function for timing sync operations
export function timeSyncOperation<T>(
  operation: () => T,
  label: string,
  endpoint: string
): T {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = monitor.start(label);
  
  try {
    const result = operation();
    monitor.end(label, startTime, endpoint);
    return result;
  } catch (error) {
    monitor.end(label, startTime, endpoint);
    throw error;
  }
}

// Middleware for timing HTTP requests
export function timingMiddleware(req: Request, res: any, next: Function): void {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = monitor.start(req.url);
  
  // Override res.end to capture timing when response is sent
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    monitor.end(req.url, startTime, req.url);
    return originalEnd.apply(this, args);
  };
  
  next();
}