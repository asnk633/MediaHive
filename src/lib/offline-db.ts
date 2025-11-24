// src/lib/offline-db.ts
// IndexedDB implementation for offline-first data layer

// Database configuration
const DB_NAME = 'ThaibaGardenMediaManagerOffline';
const DB_VERSION = 2; // Increment when schema changes

// Store names
const STORES = {
  TASKS: 'tasks',
  TASKS_QUEUE: 'tasks_queue',
  EVENTS: 'events',
  EVENTS_QUEUE: 'events_queue',
  SYNC_QUEUE: 'sync_queue',
  CONFLICTS: 'conflicts'
};

// Open IndexedDB connection
export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // Create tasks store
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        tasksStore.createIndex('status', 'status', { unique: false });
        tasksStore.createIndex('assignedToId', 'assignedToId', { unique: false });
        tasksStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create tasks queue store for offline mutations
      if (!db.objectStoreNames.contains(STORES.TASKS_QUEUE)) {
        const tasksQueueStore = db.createObjectStore(STORES.TASKS_QUEUE, { keyPath: 'id', autoIncrement: true });
        tasksQueueStore.createIndex('taskId', 'taskId', { unique: false });
        tasksQueueStore.createIndex('operation', 'operation', { unique: false });
        tasksQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create events store
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const eventsStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        eventsStore.createIndex('startTime', 'startTime', { unique: false });
        eventsStore.createIndex('createdById', 'createdById', { unique: false });
      }

      // Create events queue store for offline mutations
      if (!db.objectStoreNames.contains(STORES.EVENTS_QUEUE)) {
        const eventsQueueStore = db.createObjectStore(STORES.EVENTS_QUEUE, { keyPath: 'id', autoIncrement: true });
        eventsQueueStore.createIndex('eventId', 'eventId', { unique: false });
        eventsQueueStore.createIndex('operation', 'operation', { unique: false });
        eventsQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create sync queue store for all offline mutations
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncQueueStore.createIndex('endpoint', 'endpoint', { unique: false });
        syncQueueStore.createIndex('method', 'method', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncQueueStore.createIndex('status', 'status', { unique: false }); // pending, syncing, completed, failed
      }

      // Create conflicts store for conflict resolution
      if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
        const conflictsStore = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id', autoIncrement: true });
        conflictsStore.createIndex('taskId', 'taskId', { unique: false });
        conflictsStore.createIndex('timestamp', 'timestamp', { unique: false });
        conflictsStore.createIndex('resolved', 'resolved', { unique: false });
      }
    };
  });
}

// Task interface
export interface OfflineTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedToId?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lastSyncedAt?: string;
}

// Task queue item interface
export interface TaskQueueItem {
  id?: number;
  taskId: number;
  operation: 'create' | 'update' | 'delete';
  data: Partial<OfflineTask>;
  timestamp: number;
  syncAttempts: number;
  lastAttempt?: number;
}

// Sync queue item interface
export interface SyncQueueItem {
  id?: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  syncAttempts: number;
  lastAttempt?: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

// Conflict item interface
export interface ConflictItem {
  id?: number;
  taskId: number;
  localVersion: OfflineTask;
  serverVersion: any;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'manual';
  manualResolution?: OfflineTask;
}

// Helper to validate IDB keys
function isValidKey(key: any): boolean {
  return (
    typeof key === 'number' ||
    typeof key === 'string' ||
    key instanceof Date ||
    key instanceof ArrayBuffer ||
    Array.isArray(key)
  );
}

// Save task to local database
export async function saveTaskToLocalDB(task: OfflineTask): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.TASKS, 'readwrite');
    const store = transaction.objectStore(STORES.TASKS);

    await store.put(task);
  } catch (error) {
    console.error('Failed to save task to local DB:', error);
    throw error;
  }
}

// Get task from local database
export async function getTaskFromLocalDB(taskId: number): Promise<OfflineTask | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.TASKS, 'readonly');
    const store = transaction.objectStore(STORES.TASKS);

    return new Promise((resolve, reject) => {
      const request = store.get(taskId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get task from local DB:', error);
    return null;
  }
}

// Get all tasks from local database
export async function getAllTasksFromLocalDB(): Promise<OfflineTask[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.TASKS, 'readonly');
    const store = transaction.objectStore(STORES.TASKS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get tasks from local DB:', error);
    return [];
  }
}

// Queue task operation for sync
export async function queueTaskOperation(
  taskId: number,
  operation: 'create' | 'update' | 'delete',
  data: Partial<OfflineTask>
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.TASKS_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.TASKS_QUEUE);

    const queueItem: TaskQueueItem = {
      taskId,
      operation,
      data,
      timestamp: Date.now(),
      syncAttempts: 0
    };

    await store.add(queueItem);
  } catch (error) {
    console.error('Failed to queue task operation:', error);
    throw error;
  }
}

// Queue generic sync operation
export async function queueSyncOperation(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any
): Promise<number> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const queueItem: SyncQueueItem = {
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      syncAttempts: 0,
      status: 'pending'
    };

    const request = await store.add(queueItem);
    return request.result as number;
  } catch (error) {
    console.error('Failed to queue sync operation:', error);
    throw error;
  }
}

// Get pending sync operations
export async function getPendingSyncOperations(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get pending sync operations:', error);
    return [];
  }
}

// Update sync operation status
export async function updateSyncOperationStatus(
  id: number,
  status: 'pending' | 'syncing' | 'completed' | 'failed'
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const request = store.get(id);
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.status = status;
        if (status === 'syncing' || status === 'failed') {
          item.lastAttempt = Date.now();
          item.syncAttempts = (item.syncAttempts || 0) + 1;
        }
        store.put(item);
      }
    };
  } catch (error) {
    console.error('Failed to update sync operation status:', error);
    throw error;
  }
}

// Add conflict for resolution
export async function addConflict(
  taskId: number,
  localVersion: OfflineTask,
  serverVersion: any
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.CONFLICTS, 'readwrite');
    const store = transaction.objectStore(STORES.CONFLICTS);

    const conflictItem: ConflictItem = {
      taskId,
      localVersion,
      serverVersion,
      timestamp: Date.now(),
      resolved: false
    };

    await store.add(conflictItem);
  } catch (error) {
    console.error('Failed to add conflict:', error);
    throw error;
  }
}

// Get unresolved conflicts
export async function getUnresolvedConflicts(): Promise<ConflictItem[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.CONFLICTS, 'readonly');
    const store = transaction.objectStore(STORES.CONFLICTS);
    const index = store.index('resolved');

    return new Promise((resolve, reject) => {
      // Guard against invalid keys
      // Boolean keys are valid in IDB 2.0, but some environments might be strict.
      // We use a try-catch to be safe.
      try {
        const range = IDBKeyRange.only(false);
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (e) {
        console.warn('IDBKeyRange.only(false) failed, falling back or returning empty', e);
        resolve([]);
      }
    });
  } catch (error) {
    console.error('Failed to get unresolved conflicts:', error);
    return [];
  }
}

// Resolve conflict
export async function resolveConflict(
  conflictId: number,
  resolution: 'local' | 'server' | 'manual',
  manualResolution?: OfflineTask
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.CONFLICTS, 'readwrite');
    const store = transaction.objectStore(STORES.CONFLICTS);

    const request = store.get(conflictId);
    request.onsuccess = () => {
      const conflict = request.result;
      if (conflict) {
        conflict.resolved = true;
        conflict.resolution = resolution;
        conflict.manualResolution = manualResolution;
        store.put(conflict);
      }
    };
  } catch (error) {
    console.error('Failed to resolve conflict:', error);
    throw error;
  }
}

// Clear completed sync operations
export async function clearCompletedSyncOperations(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');

    const request = index.getAllKeys('completed');
    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach(key => store.delete(key));
    };
  } catch (error) {
    console.error('Failed to clear completed sync operations:', error);
    throw error;
  }
}