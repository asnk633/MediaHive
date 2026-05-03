/**
 * devMonitor.ts
 * 
 * Centralized state manager for performance metrics and system health.
 * Used to power the observability dashboard and track aggregate performance data.
 */

interface PerfMetric {
    label: string;
    duration: number;
    timestamp: number;
}

class DevMonitor {
    private static instance: DevMonitor;
    private metrics: PerfMetric[] = [];
    private apiTimings: Map<string, number[]> = new Map();
    private realtimeLatency: number[] = [];
    private activeChannels: Set<string> = new Set();

    private constructor() { }

    public static getInstance(): DevMonitor {
        if (!DevMonitor.instance) {
            DevMonitor.instance = new DevMonitor();
        }
        return DevMonitor.instance;
    }

    /**
     * Record a general performance metric.
     */
    public recordMetric(label: string, duration: number) {
        this.metrics.push({ label, duration, timestamp: Date.now() });
        // Keep only last 100 metrics
        if (this.metrics.length > 100) this.metrics.shift();
    }

    /**
     * Record API latency for a specific endpoint.
     */
    public recordApiLatency(endpoint: string, duration: number) {
        const timings = this.apiTimings.get(endpoint) || [];
        timings.push(duration);
        if (timings.length > 20) timings.shift();
        this.apiTimings.set(endpoint, timings);
        this.recordMetric(`API: ${endpoint}`, duration);
    }

    /**
     * Record realtime payload latency (server -> client).
     */
    public recordRealtimeLatency(latency: number) {
        this.realtimeLatency.push(latency);
        if (this.realtimeLatency.length > 50) this.realtimeLatency.shift();
        this.recordMetric('Realtime Latency', latency);
    }

    /**
     * Track active realtime channels.
     */
    public setChannelStatus(name: string, active: boolean) {
        if (active) this.activeChannels.add(name);
        else this.activeChannels.delete(name);
    }

    /**
     * Get summary for the dev dashboard.
     */
    public getSnapshot() {
        const apiSummary = Array.from(this.apiTimings.entries()).map(([endpoint, times]) => ({
            endpoint,
            avg: times.reduce((a, b) => a + b, 0) / times.length,
            count: times.length
        }));

        return {
            activeChannels: Array.from(this.activeChannels),
            avgRealtimeLatency: this.realtimeLatency.length
                ? this.realtimeLatency.reduce((a, b) => a + b, 0) / this.realtimeLatency.length
                : 0,
            apiSummary,
            recentMetrics: this.metrics.slice(-10).reverse()
        };
    }
}

export const devMonitor = DevMonitor.getInstance();

// Expose to window for easy debugging in the console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).devMonitor = devMonitor;
    console.log('%c[DEV] Observability Layer active. Type `devMonitor.getSnapshot()` to see metrics.', 'color: #8b5cf6; font-weight: bold;');
}
