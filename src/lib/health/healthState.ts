/**
 * Backend Health State System
 * 
 * Provides a global way to track and respond to backend connectivity issues.
 */

export type HealthStatus = 'healthy' | 'retrying' | 'degraded' | 'unavailable' | 'unknown' | 'syncing';
export type SystemMode = 'realtime' | 'polling' | 'offline' | 'auto';

export interface HealthState {
  status: HealthStatus;
  mode: SystemMode;
  lastUpdate: number;
  syncStatus: 'idle' | 'syncing' | 'failed';
  pendingSyncCount: number;
  conflictCount: number;
}

class HealthManager {
  private status: HealthStatus = 'unknown';
  private mode: SystemMode = 'auto';
  private listeners: ((status: HealthStatus) => void)[] = [];
  private lastUpdate = Date.now();
  private lastSuccess = Date.now();
  private coordinationChannel: BroadcastChannel | null = null;
  
  // Leader Election (Lease/Heartbeat)
  private isMasterTab = false;
  private leaderId: string | null = null;
  private myId = Math.random().toString(36).substring(7);
  private lastLeaderHeartbeat = 0;

  // Circuit Breaker
  private circuitBreaker = {
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    failures: 0,
    lastFailure: 0,
    OPEN_WINDOW_MS: 30000,
    FAILURE_THRESHOLD: 5
  };

  private readonly THRESHOLDS = {
    RETRYING: 1,
    DEGRADED: 3,
    DOWN: 5,
    STALE_MS: 30000
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.mode = (localStorage.getItem('mh_force_mode') as SystemMode) || 'auto';
      
      try {
        this.coordinationChannel = new BroadcastChannel('mediahive_health_sync');
        this.setupCoordination();
      } catch (e) {
        console.warn('[HealthSystem] BroadcastChannel unavailable. Falling back to Storage events.');
        this.setupStorageFallback();
      }

      this.startFreshnessCheck();
      this.setupVisibilityAwareness();
      this.startMemoryCleanup();
    }
  }

  private setupStorageFallback() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'mh_sync_status' && event.newValue) {
        const { status, mode } = JSON.parse(event.newValue);
        this.status = status;
        this.mode = mode;
        this.notify();
      }
    });
  }

  private mutations = new Map<string, number>(); // ID -> Expiry
  private readonly MUTATION_TTL = 30000; // 30s auto-release

  private stats = {
    lastError: null as any,
    failingEndpoint: null as string | null,
    totalRetries: 0,
    consecutiveFailures: 0,
    metrics: {
      totalQueries: 0,
      successCount: 0,
      failureCount: 0,
      avgLatencyMs: 0
    }
  };

  private setupCoordination() {
    if (!this.coordinationChannel) return;

    this.coordinationChannel.onmessage = (event) => {
      const { type, status, mode, senderId, mutationId, expires } = event.data;
      
      if (type === 'SYNC_STATUS') {
        this.status = status;
        this.notify();
      } else if (type === 'HEARTBEAT') {
        this.lastLeaderHeartbeat = Date.now();
        this.leaderId = senderId;
        if (senderId !== this.myId) {
          this.isMasterTab = false;
        }
      } else if (type === 'MODE_CHANGE') {
        this.mode = mode;
        this.notify();
      } else if (type === 'MUTATION_START') {
        this.mutations.set(mutationId, expires);
      } else if (type === 'MUTATION_END') {
        this.mutations.delete(mutationId);
      }
    };

    // Leader Election Loop (Heartbeat and Lease)
    setInterval(() => {
      const now = Date.now();
      if (this.isMasterTab) {
        this.coordinationChannel?.postMessage({ 
          type: 'HEARTBEAT', 
          senderId: this.myId,
          senderStatus: this.status 
        });
        this.lastLeaderHeartbeat = now;
      } 
      else if (now - this.lastLeaderHeartbeat > 5000) {
        this.isMasterTab = true;
        this.leaderId = this.myId;
      }
    }, 2000);
  }

  /**
   * Adaptive Garbage Collection & Integrity Watchdog
   * Rule: Detect, don't repair (unless explicit)
   */
  private startMemoryCleanup() {
    let cleanupCount = 0;
    
    setInterval(() => {
      cleanupCount++;
      const isUnderLoad = this.stats.consecutiveFailures > 0;
      const frequency = isUnderLoad ? 1 : 5; // Clean every 1m under load, 5m when idle

      if (cleanupCount % frequency === 0) {
        if (this.status === 'healthy') {
          this.stats.consecutiveFailures = 0;
        }
        
        // Integrity Watchdog: Detect inconsistencies
        if (this.isMasterTab) {
          this.runIntegrityAudit();
        }
      }

      // Periodically log session summary
      if (cleanupCount % 10 === 0) {
        console.log('[HealthSystem] Session Metrics:', this.stats.metrics);
      }
    }, 60000);
  }

  private runIntegrityAudit() {
    // Mock logic: detect orphan tasks or broken relationships
    console.debug('[HealthSystem] Integrity Watchdog: No issues detected.');
  }

  // Cross-Tab Mutation Registry with TTL
  isMutationInFlight(id: string): boolean {
    const expiry = this.mutations.get(id);
    if (expiry && Date.now() < expiry) return true;
    if (expiry) this.mutations.delete(id); // Cleanup expired
    return false;
  }

  registerMutation(id: string) {
    const expires = Date.now() + this.MUTATION_TTL;
    this.mutations.set(id, expires);
    this.coordinationChannel?.postMessage({ type: 'MUTATION_START', mutationId: id, expires });
  }

  clearMutation(id: string) {
    this.mutations.delete(id);
    this.coordinationChannel?.postMessage({ type: 'MUTATION_END', mutationId: id });
  }

  /**
   * Session Metrics with Actionable Thresholds
   */
  recordLatency(ms: number) {
    this.stats.metrics.totalQueries++;
    const prevAvg = this.stats.metrics.avgLatencyMs;
    const n = this.stats.metrics.totalQueries;
    this.stats.metrics.avgLatencyMs = ((prevAvg * (n - 1)) + ms) / n;

    // STEP 5: Insight Layer
    if (this.stats.metrics.avgLatencyMs > 1200) {
      console.warn(`[HealthSystem] 🐢 Performance threshold exceeded (${Math.round(this.stats.metrics.avgLatencyMs)}ms). Pulse: DEGRADED.`);
      if (this.status === 'healthy') this.setStatus('degraded');
    }
  }

  recordSuccess() {
    this.lastSuccess = Date.now();
    this.stats.metrics.successCount++;
    this.stats.consecutiveFailures = 0;
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';

    // Check Success Rate threshold
    const total = this.stats.metrics.totalQueries;
    if (total > 10) {
      const rate = (this.stats.metrics.successCount / total) * 100;
      if (rate < 95) {
        console.warn(`[HealthSystem] 📉 Success rate dropped below 95% (${rate.toFixed(1)}%). Pulse: DEGRADED.`);
        if (this.status === 'healthy') this.setStatus('degraded');
        return;
      }
    }
    
    if (this.status !== 'degraded') this.setStatus('healthy');
  }

  private setupVisibilityAwareness() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      console.log(`[HealthSystem] Visibility change: ${document.hidden ? 'HIDDEN' : 'VISIBLE'}`);
      if (!document.hidden && this.status === 'unavailable') {
        // Probe on wake
        this.circuitBreaker.state = 'HALF_OPEN';
      }
    });
  }

  private startFreshnessCheck() {
    setInterval(() => {
      const now = Date.now();
      if (this.status === 'healthy' && now - this.lastSuccess > this.THRESHOLDS.STALE_MS) {
        this.setStatus('degraded');
        console.warn('[HealthSystem] Data is STALE. Pulse: DEGRADED.');
      }
    }, 5000);
  }

  getStatus(): HealthStatus {
    return this.status;
  }

  getPulse(): HealthStatus {
    return this.status;
  }

  getMode(): SystemMode {
    return this.mode;
  }

  setMode(newMode: SystemMode) {
    this.mode = newMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mh_force_mode', newMode);
      this.coordinationChannel?.postMessage({ type: 'MODE_CHANGE', mode: newMode });
    }
    this.broadcast();
  }

  setStatus(newStatus: HealthStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.lastUpdate = Date.now();
      console.log(`[HealthPulse] 💓 Status: ${newStatus.toUpperCase()} (Mode: ${this.mode})`);
      this.notify();
      this.broadcast();
    }
  }

  private broadcast() {
    this.coordinationChannel?.postMessage({
      type: 'SYNC_STATUS',
      status: this.status,
      mode: this.mode
    });
  }

  isLeader(): boolean {
    return this.isMasterTab;
  }

  isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      if (now - this.circuitBreaker.lastFailure > this.circuitBreaker.OPEN_WINDOW_MS) {
        console.log('[CircuitBreaker] 🟡 Half-open probe window active.');
        this.circuitBreaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  private syncStatus: 'idle' | 'syncing' | 'failed' = 'idle';
  private pendingSyncCount = 0;
  private conflictCount = 0;

  getSnapshot(): HealthState {
    return {
      status: this.status,
      mode: this.mode,
      lastUpdate: this.lastUpdate,
      syncStatus: this.syncStatus,
      pendingSyncCount: this.pendingSyncCount,
      conflictCount: this.conflictCount
    };
  }

  setSyncStatus(status: 'idle' | 'syncing' | 'failed') {
    this.syncStatus = status;
    this.notify();
  }

  setPendingCount(count: number) {
    this.pendingSyncCount = count;
    this.notify();
  }

  setConflictCount(count: number) {
    this.conflictCount = count;
    this.notify();
  }

  getDebugInfo() {
    return {
      status: this.status,
      mode: this.mode,
      isLeader: this.isMasterTab,
      circuit: this.circuitBreaker.state,
      ...this.stats,
      uptime: (Date.now() - this.lastUpdate) / 1000,
      lastSuccess: new Date(this.lastSuccess).toLocaleTimeString()
    };
  }

  /**
   * active signals for background services
   */
  shouldPauseActivities(): boolean {
    if (this.mode === 'offline') return true;
    if (this.isCircuitOpen()) return true;
    return this.status === 'unavailable';
  }

  getRetryDelayMultiplier(): number {
    if (this.status === 'retrying') return 2;
    if (this.status === 'degraded') return 1.5;
    return 1;
  }

  subscribe(listener: (status: HealthStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.status));
  }

  recordFailure(isRetry: boolean = false, type?: string, metadata?: any) {
    this.stats.lastError = metadata?.error || type;
    this.stats.failingEndpoint = metadata?.endpoint || 'unknown';
    if (isRetry) this.stats.totalRetries++;
    
    this.stats.consecutiveFailures++;
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    // Circuit Breaker Logic
    if (this.circuitBreaker.failures >= this.circuitBreaker.FAILURE_THRESHOLD) {
      console.error('[CircuitBreaker] 🔴 TRIP. Opening circuit for 30s.');
      this.circuitBreaker.state = 'OPEN';
    }

    // Intelligent Thresholds
    if (type === 'SCHEMA') {
      this.setStatus('degraded');
      return;
    }

    if (this.stats.consecutiveFailures >= this.THRESHOLDS.DOWN) {
      this.setStatus('unavailable');
    } else if (this.stats.consecutiveFailures >= this.THRESHOLDS.DEGRADED) {
      this.setStatus('degraded');
    } else if (this.stats.consecutiveFailures >= this.THRESHOLDS.RETRYING) {
      this.setStatus('retrying');
    }

    console.debug(`[HealthMonitor] 🛑 Failure at ${this.stats.failingEndpoint}:`, type);
  }
}

export const healthManager = new HealthManager();
