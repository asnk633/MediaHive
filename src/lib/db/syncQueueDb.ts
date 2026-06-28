import Dexie, { type Table } from 'dexie';

export interface TaskPayload {
  [key: string]: any;
}

export interface SyncQueueItem {
  id: string;            // UUID (idempotency key)
  entity: 'task';
  entityId: string;
  mutation: 'create' | 'update' | 'delete';
  payload: TaskPayload;
  clientTimestamp: string; // ISO
  queuedAt: string;        // ISO
  retryCount: number;
  nextRetryAt: string;     // ISO
  status: 'pending' | 'syncing' | 'failed' | 'conflict' | 'done';
  serverSnapshot?: TaskPayload;
  conflictedFields?: string[];
}

export interface SyncNotification {
  taskId: string;
  notifiedAt: string;
}

export class SyncQueueDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, string>;
  syncNotifications!: Table<SyncNotification, string>;

  constructor() {
    super('MediaHiveSyncQueue');
    
    // Schema version 1
    this.version(1).stores({
      syncQueue: 'id, entityId, status, nextRetryAt, queuedAt'
    });

    // Schema version 2
    this.version(2).stores({
      syncQueue: 'id, entityId, status, nextRetryAt, queuedAt',
      syncNotifications: 'taskId'
    });
  }
}

export const syncQueueDb = new SyncQueueDatabase();
