import { supabase } from '../supabaseClient';
import { atom, getDefaultStore } from 'jotai';
import * as Sentry from "@sentry/nextjs";
import { ActivityHistory, ActivityAction, buildActivityLabel } from '../activityHistory';
import { getCurrentUser } from '../auth/verifyUser';
import { validateMutationPayload } from './preEnqueueValidator';
import { toast } from 'sonner';
import { MonitoringService } from '@/services/monitoringService';
import { v4 as uuidv4 } from 'uuid';
import { offlineDB, db, QueuedMutation } from './db';

// Jotai atoms for UI state
export const syncPendingCountAtom = atom(0);
export const isSyncingAtom = atom(false);
export const syncProgressAtom = atom({ current: 0, total: 0 });
export const syncConflictsAtom = atom<{ mutation: QueuedMutation; serverData: any; table: string; conflictFields?: string[] }[]>([]);
export const circuitBreakerAtom = atom<{ tripped: boolean; resumeAt: number | null }>({ tripped: false, resumeAt: null });
export const syncMetricsAtom = atom({
  queueLength: 0,
  avgSyncTime: 0,
  totalProcessed: 0,
  totalFailed: 0,
  conflictsResolved: 0,
  retries: 0,
  lastError: null as string | null,
  lastSyncAt: null as string | null,
  circuitBreakerActive: false,
  circuitBreakerResumesAt: null as number | null,
});

export class ConflictError extends Error {
  serverData: any;
  table: string;
  conflictFields: string[];
  constructor(message: string, serverData: any, table: string, conflictFields: string[] = []) {
    super(message);
    this.name = 'ConflictError';
    this.serverData = serverData;
    this.table = table;
    this.conflictFields = conflictFields;
  }
}

const store = getDefaultStore();

// --- Sync engine constants (single source of truth) ---
const SYNC_CONFIG = {
  LOCK_KEY: 'mediahive_sync_lock',
  LOCK_TTL: 30000,    // 30s
  GRACE_PERIOD: 5000, // 5s grace before another tab can steal the lock
} as const;

class SyncEngine {
  private processing = false;
  private maxRetries = 5;
  private batchSize = 50;
  private baseDelay = 2000;
  private tabId: string;
  private consecutiveFailures = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_COOLDOWN = 30000; // 30s
  private circuitBreakerUntil: number | null = null;
  private metrics = {
    queueLength: 0,
    avgSyncTime: 0,
    totalProcessed: 0,
    totalFailed: 0,
    conflictsResolved: 0,
    retries: 0,
    lastError: null as string | null,
    lastSyncAt: null as string | null,
    history: [] as { type: string; duration: number; timestamp: string }[],
  };
  private lastInstitutionId: string | null = null;

  constructor() {
    this.tabId = typeof window !== 'undefined' ? (sessionStorage.getItem('mediahive_tab_id') || uuidv4()) : uuidv4();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mediahive_tab_id', this.tabId);
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('load', () => {
        offlineDB.resetProcessing().then(() => {
          this.updatePendingCount();
          this.processQueue();
        });
      });
      window.addEventListener('beforeunload', () => {
        this.releaseFallbackLock();
      });
      // Fast failover: when tab becomes visible or comes online, probe for stale leader
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.processQueue();
        }
      });
      // Visibility-aware polling: slow when hidden, normal when visible
      setInterval(() => {
        const interval = document.hidden ? 60000 : 30000;
        // Only process if enough time has passed (crude but effective without a timer ref)
        this.processQueue();
      }, 30000);
      // Metrics logger + telemetry export
      setInterval(() => {
        this.updateUIState();
        const snapshot = { ...this.getMetrics(), timestamp: new Date().toISOString() };
        if (process.env.NODE_ENV === 'development' || this.metrics.queueLength > 0) {
          console.log('[SyncEngine] Metrics Snapshot:', snapshot);
        }
        try { localStorage.setItem('mediahive_last_telemetry', JSON.stringify(snapshot)); } catch {}
      }, 60000); // 1 minute
    }
  }

  private updateUIState() {
    store.set(syncMetricsAtom, this.getMetrics());
  }

  async enqueueMutation(type: string, payload: any, baseUpdatedAt?: string, baseVersion?: number): Promise<string> {
    // 0. Pre-Enqueue Validation Gate
    validateMutationPayload(type, payload);

    const id = payload.id || uuidv4();
    const entityId = payload.id || payload.task_id || payload.event_id;

    // --- Field-Safe Mutation Compaction ---
    // Only merge if we are updating the same fields, to prevent a single invalid field from blocking others
    if (entityId && type.startsWith('UPDATE_')) {
      const existingMutations = await db.queue
        .where('[status+type]')
        .equals(['pending', type])
        .filter(m => (m.payload.id || m.payload.task_id || m.payload.event_id) === entityId)
        .toArray();

      const newFields = Object.keys(payload).filter(k => k !== 'id' && k !== 'updated_at');
      
      const existing = existingMutations.find(m => {
        const existingFields = Object.keys(m.payload).filter(k => k !== 'id' && k !== 'updated_at');
        // Merge only if there's an intersection in fields (i.e., we are updating the same thing again)
        return newFields.some(nf => existingFields.includes(nf));
      });

      if (existing) {
        console.log(`[SyncEngine] 🔄 Compacting ${type} for entity ${entityId} (Overlapping fields)`);
        const mergedPayload = { ...existing.payload, ...payload };
        await db.queue.update(existing.id, { 
          payload: mergedPayload, 
          createdAt: new Date().toISOString() 
        });
        return existing.id;
      }
    }

    const mutation: QueuedMutation = {
      id,
      type,
      payload: { ...payload, id },
      status: 'pending',
      retries: 0,
      createdAt: new Date().toISOString(),
      baseUpdatedAt,
      baseVersion
    };

    await offlineDB.enqueue(mutation);
    await this.updatePendingCount();
    
    // Trigger sync immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
    
    return id;
  }

  private async updatePendingCount() {
    const pending = await offlineDB.getPending();
    this.metrics.queueLength = pending.length;
    store.set(syncPendingCountAtom, pending.length);
    this.updateUIState();
  }

  // Double-guard for critical section
  private checkLockIntact(LOCK_KEY: string): boolean {
    if (!('locks' in navigator)) {
      const lockData = localStorage.getItem(LOCK_KEY);
      if (lockData) {
        try {
          const { owner } = JSON.parse(lockData);
          if (owner !== this.tabId) return false;
        } catch { return true; }
      }
    }
    return true;
  }

  private releaseFallbackLock = () => {
    const lockData = localStorage.getItem(SYNC_CONFIG.LOCK_KEY);
    if (lockData) {
      try {
        const { owner } = JSON.parse(lockData);
        if (owner === this.tabId) {
          localStorage.removeItem(SYNC_CONFIG.LOCK_KEY);
        }
      } catch { /* ignore parse error */ }
    }
  };

  async processQueue(force = false) {
    if (this.processing || !navigator.onLine || typeof window === 'undefined') return;

    // Circuit breaker guard (skipped if force=true, e.g. manual "Sync Now")
    if (!force && this.circuitBreakerUntil && Date.now() < this.circuitBreakerUntil) {
      console.log('[SyncEngine] Circuit breaker active. Sync paused.');
      return;
    }
    // Half-open probe: if cooldown has elapsed, reset and try
    if (this.circuitBreakerUntil && Date.now() >= this.circuitBreakerUntil) {
      this.circuitBreakerUntil = null;
      this.consecutiveFailures = 0;
      store.set(circuitBreakerAtom, { tripped: false, resumeAt: null });
    }

    window.dispatchEvent(new CustomEvent('mediahive_sync_start'));

    const runSync = async () => {
      this.processing = true;
      store.set(isSyncingAtom, true);

      // Safety timeout for the entire sync run (5 minutes max)
      const syncTimeout = setTimeout(() => {
        if (this.processing) {
          console.error('[SyncEngine] 🛑 Sync run timed out (5m). Force resetting.');
          this.processing = false;
          store.set(isSyncingAtom, false);
        }
      }, 300000);

      try {
        const pending = await offlineDB.getPending(this.batchSize);
        const hasMore = pending.length === this.batchSize;
        
        store.set(syncProgressAtom, { current: 0, total: pending.length });
        
        let i = 0;
        const failedMutationsPerEntity = new Map<string, Set<string>>();

        /**
         * Checks if a mutation should be skipped due to a previous failure in the same batch
         */
        const isBlockedByPreviousFailure = (mutation: QueuedMutation, entityId: string): boolean => {
          const failedTypes = failedMutationsPerEntity.get(entityId);
          if (!failedTypes) return false;

          // Rule 1: Always preserve order for the SAME mutation type on the SAME entity
          if (failedTypes.has(mutation.type)) return true;

          // Rule 2: Critical Dependencies
          // If creation failed, everything else for this entity must be skipped
          if (mutation.type.startsWith('UPDATE_') && failedTypes.has(mutation.type.replace('UPDATE_', 'CREATE_'))) return true;
          if (mutation.type === 'ASSIGN_USER' && failedTypes.has('CREATE_TASK')) return true;
          if (mutation.type === 'UNASSIGN_USER' && failedTypes.has('CREATE_TASK')) return true;
          if (mutation.type === 'DELETE_TASK' && failedTypes.has('CREATE_TASK')) return true;

          return false;
        };

        for (const mutation of pending) {
          i++;
          store.set(syncProgressAtom, { current: i, total: pending.length });
          
          if (!navigator.onLine || !this.checkLockIntact(SYNC_CONFIG.LOCK_KEY)) break;

          const entityId = mutation.payload?.id || mutation.payload?.task_id || mutation.payload?.event_id;
          
          // Dependency-Aware FIFO Guard: Skip only if a dependent mutation failed previously
          if (entityId && isBlockedByPreviousFailure(mutation, entityId)) {
            console.warn(`[SyncEngine] ⏭️ Skipping ${mutation.type} (Mutation ID: ${mutation.id}) for entity ${entityId} due to dependent failure.`);
            continue;
          }

          const startTime = Date.now();
          try {
            await offlineDB.updateStatus(mutation.id, 'processing');
            await this.executeMutation(mutation);
            await offlineDB.delete(mutation.id); // Success! Remove from queue

            // --- Update Bounded History ---
            const duration = Date.now() - startTime;
            this.metrics.history.push({ type: mutation.type, duration, timestamp: new Date().toISOString() });
            if (this.metrics.history.length > 100) this.metrics.history.shift();

            // 3. ROLLING AVERAGE
            const recentHistory = this.metrics.history.slice(-10);
            this.metrics.avgSyncTime = recentHistory.length > 0 
              ? recentHistory.reduce((acc, h) => acc + h.duration, 0) / recentHistory.length 
              : duration;

            // Reset circuit breaker on success
            this.consecutiveFailures = 0;
            this.metrics.lastSyncAt = new Date().toISOString();
            this.updateUIState();
            
            Sentry.addBreadcrumb({
              category: 'sync',
              message: `Successfully synced ${mutation.type}`,
              level: 'info',
              data: { mutationId: mutation.id, duration }
            });

            // 4. LOG ACTIVITY (Timeline)
            this.logActivityForMutation(mutation);
          } catch (error: any) {
            // Enhanced logging for Supabase/PostgREST errors
            const serializableError = {
              message: error?.message || 'Unknown error',
              code: error?.code,
              details: error?.details,
              hint: error?.hint,
              status: error?.status,
              name: error?.name,
              type: mutation.type,
              id: mutation.id
            };
            console.error(`[SyncEngine] ❌ Failed to sync ${mutation.type}:`, serializableError);
            
            if (error instanceof ConflictError) {
              await offlineDB.updateStatus(mutation.id, 'conflict');
              store.set(syncConflictsAtom, (prev) => [
                ...prev,
                { mutation, serverData: error.serverData, table: error.table, conflictFields: error.conflictFields }
              ]);
              
              Sentry.captureMessage(`Conflict detected: ${mutation.type}`, {
                level: 'warning',
                extra: { 
                  mutationType: mutation.type, 
                  table: error.table, 
                  fields: error.conflictFields,
                  entityId: mutation.payload.id 
                }
              });
            } else if (mutation.retries >= this.maxRetries - 1) {
              await offlineDB.updateStatus(mutation.id, 'failed');
              this.metrics.lastError = error?.message ?? 'Unknown error';
              console.error(`[SyncEngine] Mutation ${mutation.id} permanently failed after ${this.maxRetries} retries.`);
              
              Sentry.captureException(error, {
                tags: { sync_failure: 'retry_exceeded' },
                extra: { 
                  mutationType: mutation.type, 
                  retries: mutation.retries,
                  mutationId: mutation.id 
                }
              });
              this.updateUIState();
            } else {
              // Record failure for Sentry
              Sentry.addBreadcrumb({
                category: 'sync',
                message: `Retrying ${mutation.type} (Attempt ${mutation.retries + 1})`,
                level: 'warning',
                data: { error: error.message }
              });
              // Record failure for this specific mutation type on this entity
              if (entityId) {
                if (!failedMutationsPerEntity.has(entityId)) failedMutationsPerEntity.set(entityId, new Set());
                failedMutationsPerEntity.get(entityId)!.add(mutation.type);
              }

              this.metrics.retries++;
              this.metrics.lastError = error?.message ?? 'Unknown error';
              await offlineDB.updateStatus(mutation.id, 'pending');
              
              // Circuit breaker: track consecutive failures
              this.consecutiveFailures++;
              if (this.consecutiveFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
                this.circuitBreakerUntil = Date.now() + this.CIRCUIT_BREAKER_COOLDOWN;
                store.set(circuitBreakerAtom, { tripped: true, resumeAt: this.circuitBreakerUntil });
                console.warn('[SyncEngine] 🔴 Circuit breaker TRIPPED. Pausing sync for 30s.');
                this.updateUIState();
                break; // Stop processing this batch
              }

              // Exponential Backoff with Jitter
              const delay = (this.baseDelay * Math.pow(2, mutation.retries)) + (Math.random() * 1000);
              console.log(`[SyncEngine] ⏳ Mutation ${mutation.id} (${mutation.type}) will retry in ${Math.round(delay)}ms (Attempt ${mutation.retries + 1}/${this.maxRetries})`);
              this.updateUIState();
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      } finally {
        this.processing = false;
        store.set(isSyncingAtom, false);
        store.set(syncProgressAtom, { current: 0, total: 0 });
        await this.updatePendingCount();
        window.dispatchEvent(new CustomEvent('mediahive_sync_end'));

        // If we processed a full batch, there's likely more to do.
        // Schedule next batch after a breather to prevent UI freeze.
        if (navigator.onLine && !this.circuitBreakerUntil) {
          const remaining = await offlineDB.getPending(1);
          if (remaining.length > 0) {
            setTimeout(() => this.processQueue(), 500);
          }
        }
        clearTimeout(syncTimeout);
      }
    };

    // --- Fallback Lock Logic ---
    const acquireFallbackLock = (): boolean => {
      const lockData = localStorage.getItem(SYNC_CONFIG.LOCK_KEY);
      const now = Date.now();
      if (lockData) {
        try {
          const { owner, expiry } = JSON.parse(lockData);
          if (owner !== this.tabId && now < expiry + SYNC_CONFIG.GRACE_PERIOD) {
            return false; // Locked by someone else
          }
        } catch { /* ignore parse error */ }
      }
      // Take lock
      localStorage.setItem(SYNC_CONFIG.LOCK_KEY, JSON.stringify({ owner: this.tabId, expiry: now + SYNC_CONFIG.LOCK_TTL }));
      return true;
    };

    // --- Execution ---
    if ('locks' in navigator) {
      await navigator.locks.request('mediahive_sync', { ifAvailable: true }, async (lock) => {
        if (!lock) {
          console.log('[SyncEngine] Another tab is currently syncing (Web Locks).');
          return;
        }
        
        const pending = await offlineDB.getPending();
        await MonitoringService.trace(
          'sync.process_queue',
          () => runSync(),
          { queue_length: pending.length }
        );
      });
    } else {
      if (!acquireFallbackLock()) {
        console.log('[SyncEngine] Another tab is currently syncing (Fallback Lock).');
        return;
      }
      
      // Auto-refresh lock if sync takes too long
      const interval = setInterval(() => {
        if (this.processing) {
          localStorage.setItem(SYNC_CONFIG.LOCK_KEY, JSON.stringify({ owner: this.tabId, expiry: Date.now() + SYNC_CONFIG.LOCK_TTL }));
        }
      }, SYNC_CONFIG.LOCK_TTL / 2);

      try {
        const pending = await offlineDB.getPending();
        await MonitoringService.trace(
          'sync.process_queue',
          () => runSync(),
          { queue_length: pending.length }
        );
      } finally {
        clearInterval(interval);
        this.releaseFallbackLock();
      }
    }
  }

  private async executeMutation(mutation: QueuedMutation) {
    let result;
    
    const tableMap: Record<string, string> = {
      'CREATE_TASK': 'tasks',
      'UPDATE_TASK': 'tasks',
      'DELETE_TASK': 'tasks',
      'CREATE_EVENT': 'events',
      'UPDATE_EVENT': 'events',
      'DELETE_EVENT': 'events',
      'ASSIGN_USER': 'task_assignments',
      'UNASSIGN_USER': 'task_assignments',
      'ASSIGN_TASK': 'task_assignments', // Legacy
      'UNASSIGN_TASK': 'task_assignments', // Legacy
      'CREATE_INVENTORY': 'inventory',
      'UPDATE_INVENTORY': 'inventory',
      'DELETE_INVENTORY': 'inventory',
      'CREATE_EQUIPMENT_BOOKING': 'equipment_bookings',
      'UPDATE_EQUIPMENT_BOOKING': 'equipment_bookings',
      'DELETE_EQUIPMENT_BOOKING': 'equipment_bookings',
      'CREATE_INVENTORY_REQUEST': 'inventory_requests',
      'CREATE_LEAVE_REQUEST': 'leave_requests',
      'UPDATE_LEAVE_REQUEST': 'leave_requests',
      'INITIALIZE_LEAVE_BALANCE': 'user_leave_balances',
      'CREATE_INITIALIZE_LEAVE_BALANCE': 'user_leave_balances',
      'UPDATE_LEAVE_BALANCE': 'user_leave_balances',
      'ASSIGN_CREW': 'event_crew',
      'UNASSIGN_CREW': 'event_crew',
      'ASSIGN_EQUIPMENT': 'event_equipment',
      'UNASSIGN_EQUIPMENT': 'event_equipment',
    };

    const actionMap: Record<string, 'insert' | 'update' | 'delete' | 'bulk_insert' | 'bulk_update'> = {
      'CREATE_TASK': 'insert',
      'UPDATE_TASK': 'update',
      'DELETE_TASK': 'delete',
      'CREATE_EVENT': 'insert',
      'UPDATE_EVENT': 'update',
      'DELETE_EVENT': 'delete',
      'ASSIGN_USER': 'insert',
      'UNASSIGN_USER': 'delete',
      'ASSIGN_TASK': 'insert', // Legacy
      'UNASSIGN_TASK': 'delete', // Legacy
      'CREATE_INVENTORY': 'insert',
      'UPDATE_INVENTORY': 'update',
      'DELETE_INVENTORY': 'delete',
      'CREATE_EQUIPMENT_BOOKING': 'insert',
      'UPDATE_EQUIPMENT_BOOKING': 'update',
      'DELETE_EQUIPMENT_BOOKING': 'delete',
      'CREATE_INVENTORY_REQUEST': 'insert',
      'CREATE_LEAVE_REQUEST': 'insert',
      'UPDATE_LEAVE_REQUEST': 'update',
      'INITIALIZE_LEAVE_BALANCE': 'insert',
      'CREATE_INITIALIZE_LEAVE_BALANCE': 'insert',
      'UPDATE_LEAVE_BALANCE': 'update',
      'ASSIGN_CREW': 'insert',
      'UNASSIGN_CREW': 'delete',
      'ASSIGN_EQUIPMENT': 'insert',
      'UNASSIGN_EQUIPMENT': 'delete',
    };

    // Dynamic mapping for BULK operations
    let action = actionMap[mutation.type];
    if (mutation.type.startsWith('BULK_CREATE')) action = 'bulk_insert';
    if (mutation.type.startsWith('BULK_UPDATE')) action = 'bulk_update';

    const table = tableMap[mutation.type] || mutation.type.split('_')[2]?.toLowerCase() + 's' || mutation.type.split('_')[1]?.toLowerCase() + 's';

    console.log(`[SyncEngine] Executing ${mutation.type} on table: ${table} (Action: ${action})`, {
        payload: mutation.payload
    });

    if (!table || !action) {
       throw new Error(`Unknown mutation type: ${mutation.type}`);
    }

    // Schema Sanitization: Remove fields that are known to cause issues in specific tables
    if (table === 'user_leave_balances') {
        delete mutation.payload.created_at;
        delete mutation.payload.institution_id;
        delete mutation.payload.created_by;
        delete mutation.payload.updated_by;
    }
    
    // Deprecated Task Assignments Column Guard
    if (table === 'tasks') {
        delete mutation.payload.assigned_to;
        delete mutation.payload.assignedTo;

        // FK Guard: department_id must be a valid integer or null
        // Sanitize camelCase duplicates
        delete mutation.payload.departmentId;
        delete mutation.payload.institutionId;
        delete mutation.payload.dueDate;
        delete mutation.payload.createdAt;
        delete mutation.payload.updatedAt;
        delete mutation.payload.completedAt;
        delete mutation.payload.createdBy;
        delete mutation.payload.updatedBy;
        delete mutation.payload.assignedBy;

        // Ensure department_id is a valid integer or null
        const rawDeptId = mutation.payload.department_id;
        if (rawDeptId !== null && rawDeptId !== undefined) {
            if (typeof rawDeptId === 'string') {
                // Strip 'dept_' prefix if present
                const stripped = rawDeptId.replace(/^dept_/, '');
                const parsed = /^\d+$/.test(stripped) ? parseInt(stripped, 10) : null;
                mutation.payload.department_id = parsed;
            } else if (typeof rawDeptId === 'number' && !isNaN(rawDeptId)) {
                mutation.payload.department_id = rawDeptId;
            } else {
                mutation.payload.department_id = null;
            }
        }
    }

    // Bulk operations skip conflict detection for now (they are usually admin-driven or system-driven)
    if (action === 'bulk_insert') {
      result = await supabase.from(table).insert(mutation.payload.records);
      if (result.error) throw result.error;
      return;
    }

    if (action === 'bulk_update') {
      result = await supabase.from(table).upsert(mutation.payload.updates);
      if (result.error) throw result.error;
      return;
    }

    // Conflict Detection Logic (for single updates/deletes)
    if (action === 'update' || action === 'delete') {
      const payloadKeys = Object.keys(mutation.payload);
      const selectFields = Array.from(new Set(['id', 'updated_at', 'version', 'deleted', 'deleted_at', ...payloadKeys])).join(',');
      
      const { data: current, error: fetchError } = await supabase
        .from(table)
        .select(selectFields)
        .eq('id', mutation.payload.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        console.warn(`[SyncEngine] 🗑️ Record missing on server: ${table}/${mutation.payload.id}`);
        if (action === 'delete') {
          // It's already deleted, so we're done
          return;
        }
        throw new Error('Record deleted on server');
      }

      if (current && (current.deleted === true || current.deleted_at)) {
        console.warn(`[SyncEngine] 🗑️ Record is deleted on server: ${table}/${mutation.payload.id}`);
        if (action === 'update') {
          // Deletion wins - we don't update a deleted record
          console.warn('[SyncEngine] 🛑 Update aborted: Deletion wins.');
          return; 
        }
      }

      // HR Specific Conflict Resolution: Status Transition Guard
      if (table === 'leave_requests' && current && current.status !== 'pending' && action === 'update') {
        if (mutation.payload.status === 'cancelled') {
          console.warn(`[SyncEngine] 🛑 Cannot cancel leave request ${mutation.payload.id}: Already ${current.status}`);
          return; // Ignore the cancellation if already processed
        }
        
        // If an admin tries to approve/reject an already processed request, throw conflict
        if (mutation.payload.status === 'approved' || mutation.payload.status === 'rejected') {
          throw new Error(`Request has already been ${current.status}`);
        }
      }

      if (current && current.updated_at) {
        const serverTime = new Date(current.updated_at).getTime();
        const baseTime = mutation.baseUpdatedAt ? new Date(mutation.baseUpdatedAt).getTime() : 0;
        
        const serverVersion = current.version || 0;
        const baseVersion = mutation.baseVersion || 0;

        // Strict OCC: Conflict if server version is higher than our base version
        // Fallback: Conflict if server updated_at is newer than our base updated_at
        const hasConflict = (baseVersion > 0 && serverVersion > 0) 
          ? (serverVersion > baseVersion) 
          : (baseTime > 0 ? (serverTime > baseTime) : (serverTime > new Date(mutation.createdAt).getTime()));

        if (hasConflict && !mutation.payload._forceSync) {
          // 1. Smart Field-Level Merge
          // We apply our delta (mutation.payload) onto the current server state (current)
          
          const resolvedPayload = { ...current, ...mutation.payload, updated_at: new Date().toISOString() };
          let conflictFields: string[] = [];

          // Remove internal metadata and metadata that always changes from comparison
          const { 
            id, tenant_id, created_at, updated_at, _forceSync, version, updated_by, 
            assigned_to, assignedTo, institution_id, created_by,
            ...payloadFields 
          } = mutation.payload;

          for (const key in payloadFields) {
            // Only a conflict if:
            // 1. Our value is different from the server value
            // 2. AND we are not sure if the server value was what we expected
            if (JSON.stringify(current[key]) !== JSON.stringify(mutation.payload[key])) {
              
              // Special case: Arrays (e.g. tags, assigned_to) can often be merged
              if (Array.isArray(current[key]) && Array.isArray(mutation.payload[key])) {
                resolvedPayload[key] = Array.from(new Set([...current[key], ...mutation.payload[key]]));
              } else {
                // TRUE CONFLICT: Same field edited by two users
                conflictFields.push(key);
              }
            }
          }

          if (conflictFields.length > 0) {
            console.warn(`[SyncEngine] ⚔️ Field-Level Conflict: ${table}/${mutation.payload.id} on fields:`, conflictFields);
            
            Sentry.addBreadcrumb({
              category: 'sync_conflict',
              message: `Conflict detected on ${table}/${mutation.payload.id}`,
              level: 'warning',
              data: { fields: conflictFields, table, entityId: mutation.payload.id }
            });

            throw new ConflictError(`Conflict on: ${conflictFields.join(', ')}`, current, table, conflictFields);
          } else {
            console.log(`[SyncEngine] 🤝 Auto-merged delta for ${table}/${mutation.payload.id}`);
            
            Sentry.addBreadcrumb({
              category: 'sync_conflict',
              message: `Auto-merged conflict for ${table}/${mutation.payload.id}`,
              level: 'info'
            });

            mutation.payload = resolvedPayload;
          }
        }
      }
    }

    if (action === 'insert') {
      // 🤝 Inventory Integrity Guard: Double-Booking Prevention
      if (table === 'equipment_bookings') {
        const { equipment_id, start_time, end_time, units_requested } = mutation.payload;
        
        // 1. Fetch equipment total
        const { data: equip } = await supabase.from('inventory').select('quantity').eq('id', equipment_id).single();
        const total = equip?.quantity || 1;

        // 2. Fetch overlapping bookings
        const { data: overlaps } = await supabase
          .from('equipment_bookings')
          .select('units_requested')
          .eq('equipment_id', equipment_id)
          .filter('start_time', 'lt', end_time)
          .filter('end_time', 'gt', start_time);

        const overlapBooked = (overlaps || []).reduce((sum: number, b: any) => sum + (b.units_requested || 0), 0);
        const available = Math.max(0, total - overlapBooked);

        if (units_requested > available) {
          console.warn(`[SyncEngine] 🛑 Double-booking detected for ${equipment_id}. Requested: ${units_requested}, Available: ${available}`);
          throw new ConflictError(`Inventory exhausted: only ${available} units available for this period.`, { available, requested: units_requested }, table, ['units_requested']);
        }
      }

      if (mutation.type === 'ASSIGN_USER' || mutation.type === 'ASSIGN_TASK') {
        // Force correct table for assignments just in case of resolution drift
        const targetTable = 'task_assignments';
        
        // Enforce idempotency with explicit unique constraint handling
        result = await supabase.from(targetTable).upsert({
          task_id: mutation.payload.task_id || mutation.payload.taskId,
          user_id: mutation.payload.user_id || mutation.payload.userId || mutation.payload.uid,
          tenant_id: mutation.payload.tenant_id || mutation.payload.tenantId,
          role: mutation.payload.role || 'assignee'
        }, { onConflict: 'task_id,user_id' });
      } else {
        // Legacy Enrichment: Inject missing mandatory fields for older mutations
        if (action === 'insert' && (!mutation.payload.institution_id || mutation.payload.institution_id === null) && (table === 'tasks' || table === 'events' || table === 'inventory' || table === 'user_leave_balances' || table === 'equipment_bookings')) {
            if (!this.lastInstitutionId) {
                const user = await getCurrentUser();
                let instId = user?.institution_id;
                
                // If missing from metadata, check profile (matching tenantContext strategy)
                if (!instId && user?.id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('institution_id')
                        .eq('id', user.id)
                        .maybeSingle();
                    if (profile) instId = profile.institution_id;
                }

                if (instId) this.lastInstitutionId = instId;
            }

            if (this.lastInstitutionId) {
                console.log(`[SyncEngine] 💉 Injecting institution_id ${this.lastInstitutionId} into ${table} (Mutation ID: ${mutation.id})`);
                mutation.payload.institution_id = this.lastInstitutionId;
            } else {
                console.warn(`[SyncEngine] ⚠️ Could not resolve institution_id for ${table} in mutation ${mutation.id}. Insert may fail.`);
            }

            // Also ensure created_by is present for mandatory tables
            if (!mutation.payload.created_by && (table === 'tasks' || table === 'events' || table === 'inventory')) {
                const user = await getCurrentUser();
                if (user?.id) {
                    console.log(`[SyncEngine] 💉 Injecting created_by ${user.id} into ${table} (Mutation ID: ${mutation.id})`);
                    mutation.payload.created_by = user.id;
                }
            }
        }

        result = await supabase.from(table).insert([mutation.payload]);
      }
      
      if (result.error) {
          // Server-side idempotency: a 23505 unique violation means we already inserted this record
          if (result.error.code === '23505') {
            console.warn(`[SyncEngine] ✅ Idempotent: ${table}/${mutation.payload.id} already exists. Treating as success.`);
            return; 
          }
          console.error(`[SyncEngine] ❌ execution error for ${mutation.type}:`, result.error);
          throw new Error(result.error.message || JSON.stringify(result.error));
      }
    } else if (action === 'update') {
      // 1. Sanitize Payload: Remove fields that shouldn't be in the UPDATE SET clause
      const { id, startTime, endTime, institutionId, ...actualUpdates } = mutation.payload;
      
      // 2. Build Query
      let query = supabase.from(table).update(actualUpdates).eq('id', id);
      
      // Strict OCC: If we have a baseVersion, enforce it in the WHERE clause for atomic protection
      if (mutation.baseVersion) {
        query = query.eq('version', mutation.baseVersion);
      }
      
      // We use .select('id') to verify if any row was actually updated
      result = await query.select('id');
      
      // If result is successful but returns no rows, it means the version (or ID) mismatch occurred
      if (!result.error && result.data?.length === 0) {
        console.warn(`[SyncEngine] ⚔️ Strict OCC Conflict for ${table}/${mutation.payload.id}. Version mismatch.`);
        throw new ConflictError(`Version mismatch on ${table}. Data was updated by someone else.`, mutation.payload, table, []);
      }
    } else if (action === 'delete') {
      if (mutation.type === 'UNASSIGN_USER') {
        result = await supabase.from(table)
          .delete()
          .eq('task_id', mutation.payload.task_id)
          .eq('user_id', mutation.payload.user_id);
      } else if (mutation.type === 'UNASSIGN_CREW') {
        result = await supabase.from(table)
          .delete()
          .eq('event_id', mutation.payload.event_id)
          .eq('user_id', mutation.payload.user_id);
      } else if (mutation.type === 'UNASSIGN_EQUIPMENT') {
        result = await supabase.from(table)
          .delete()
          .eq('event_id', mutation.payload.event_id)
          .eq('inventory_id', mutation.payload.inventory_id);
      } else {
        result = await supabase.from(table).delete().eq('id', mutation.payload.id);
      }
    }

    if (result && result.error) {
      const err = result.error;
      // Map Postgres Integrity/Custom Errors to ConflictError for UI handling
      if (err.code === 'P0001') {
        // Custom Raise Exception (Inventory Availability)
        throw new ConflictError(err.message, {}, table, ['units_requested']);
      }
      if (err.code === '23514') {
        // Check Constraint Violation (e.g., negative quantity)
        throw new ConflictError(`Integrity Violation: ${err.message}`, {}, table);
      }
      if (err.code === '23502') {
        // NOT NULL Violation (Missing fields)
        throw new Error(`Missing required data for ${table}: ${err.message}`);
      }
      throw err;
    }
  }

  /**
   * EMERGENCY: Force reset sync state if stuck
   */
  public forceReset() {
    console.warn('[SyncEngine] ⚠️ FORCE RESET TRIGGERED');
    this.processing = false;
    this.circuitBreakerUntil = null;
    this.consecutiveFailures = 0;
    store.set(isSyncingAtom, false);
    store.set(circuitBreakerAtom, { tripped: false, resumeAt: null });
    localStorage.removeItem(SYNC_CONFIG.LOCK_KEY);
    this.processQueue(true);
  }

  public async clearQueue() {
    // Only perform confirmation if in browser
    if (typeof window !== 'undefined') {
        if (!confirm('Are you sure? This will delete ALL pending offline changes that have not synced yet.')) return;
    }
    
    await db.queue.clear();
    await this.updatePendingCount();
    this.consecutiveFailures = 0;
    this.circuitBreakerUntil = null;
    store.set(circuitBreakerAtom, { tripped: false, resumeAt: null });
    this.updateUIState();
    console.warn('[SyncEngine] 🗑️ Queue cleared.');
    try { toast.success('Offline queue cleared'); } catch (e) {}
  }
  // Expose metrics mutator for UI
  public incrementConflictsResolved() {
    this.metrics.conflictsResolved++;
  }

  // Expose live metrics snapshot for the developer panel
  public getMetrics() {
    return {
      ...this.metrics,
      tabId: this.tabId,
      circuitBreakerActive: this.circuitBreakerUntil !== null && Date.now() < (this.circuitBreakerUntil ?? 0),
      circuitBreakerResumesAt: this.circuitBreakerUntil,
    };
  }

  private async logActivityForMutation(mutation: QueuedMutation) {
    try {
      const entityId = mutation.payload.id || mutation.payload.task_id || mutation.payload.event_id;
      if (!entityId) return;

      const user = await getCurrentUser();
      const actorName = user?.full_name || 'System';
      const actorUid = user?.id || 'system';

      let action: ActivityAction | null = null;
      let value: string | undefined = undefined;

      if (mutation.type.includes('TASK')) {
        if (mutation.payload.status) {
          action = 'status_changed';
          value = mutation.payload.status;
        } else if (mutation.payload.priority) {
          action = 'priority_changed';
          value = mutation.payload.priority;
        } else if (mutation.type === 'ASSIGN_TASK') {
          action = 'assigned';
          value = mutation.payload.user_name || 'Member';
        } else if (mutation.type === 'UNASSIGN_TASK') {
          action = 'unassigned';
          value = mutation.payload.user_name || 'Member';
        }

        if (action) {
          ActivityHistory.push(entityId, {
            action,
            label: buildActivityLabel(action, value),
            actorUid,
            actorName,
            scope: 1
          });
        }
      }
    } catch (err) {
      console.warn('[SyncEngine] Failed to log activity:', err);
    }
  }
}

export const syncEngine = new SyncEngine();

