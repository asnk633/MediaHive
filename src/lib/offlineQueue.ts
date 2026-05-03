import { Task } from '@/features/tasks/types/task';

// Setup IndexedDB
const DB_NAME = 'mediahive_offline_tasks';
const DB_VERSION = 1;
const STORE_NAME = 'mutation_queue';

export type QueuedMutation = {
    id: string; // unique UUID for the mutation
    timestamp: number;
    mutationType: string; // 'updateTask', 'deleteTask', 'restoreTask'
    taskIds: string[];
    payload: Partial<Task>;
    snapshot: Record<string, Partial<Task>>; // pre-mutation fields
    status: 'pending' | 'failed';
    args?: any[];
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') return Promise.reject(new Error('IndexedDB not supported on server'));
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }
    return dbPromise;
}

export const OfflineQueue = {
    async enqueue(mutation: QueuedMutation): Promise<void> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).add(mutation);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async put(mutation: QueuedMutation): Promise<void> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(mutation);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getAll(): Promise<QueuedMutation[]> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).getAll();
            request.onsuccess = () => resolve(request.result as QueuedMutation[]);
            request.onerror = () => reject(request.error);
        });
    },

    async remove(id: string): Promise<void> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async getById(id: string): Promise<QueuedMutation | null> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(id);
            request.onsuccess = () => resolve((request.result as QueuedMutation) || null);
            request.onerror = () => reject(request.error);
        });
    },

    async clear(): Promise<void> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};
