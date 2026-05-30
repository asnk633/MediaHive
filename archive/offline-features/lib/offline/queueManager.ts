import { atom } from 'jotai';

// Jotai atoms for UI state - Stubbed out to inactive states
export const syncPendingCountAtom = atom(0);
export const isSyncingAtom = atom(false);
export const syncProgressAtom = atom({ current: 0, total: 0 });
export const syncConflictsAtom = atom<{ mutation: any; serverData: any; table: string; conflictFields?: string[] }[]>([]);
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

// Stubbed out SyncEngine that does nothing
class SyncEngine {
  async enqueueMutation(type: string, payload: any, baseUpdatedAt?: string, baseVersion?: number): Promise<string> {
    console.warn(`[SyncEngine] enqueueMutation called for ${type}, but queueManager is disabled in online-first architecture.`);
    return "disabled";
  }

  async processQueue(force = false) {
    // Disabled
  }

  incrementConflictsResolved() {
    // Disabled
  }

  getMetrics() {
    return {
      queueLength: 0,
      avgSyncTime: 0,
      totalProcessed: 0,
      totalFailed: 0,
      conflictsResolved: 0,
      retries: 0,
      lastError: null,
      lastSyncAt: null,
      circuitBreakerActive: false,
      circuitBreakerResumesAt: null,
      tabId: "disabled",
      isPrimary: true
    } as any;
  }

  async clearQueue() {
    // Disabled
  }
}

export const syncEngine = new SyncEngine();
