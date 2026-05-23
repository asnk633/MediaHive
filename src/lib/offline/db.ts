import Dexie, { Table } from 'dexie';

export interface QueuedMutation {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'processing' | 'failed' | 'conflict';
  retries: number;
  createdAt: string;
  baseUpdatedAt?: string;
  baseVersion?: number;
  taskIds?: string[];
  snapshot?: any;
}

export class MediaHiveDB extends Dexie {
  tasks!: Table<any>;
  events!: Table<any>;
  inventory!: Table<any>;
  profiles!: Table<any>;
  cache!: Table<{ key: string; value: any; expiresAt?: number }>;
  queue!: Table<QueuedMutation>;

  constructor() {
    super('mediahive_db');
    // Minimal schema to satisfy Dexie
    this.version(1).stores({
      tasks: 'id',
      events: 'id',
      inventory: 'id',
      queue: 'id',
    });
  }
  
  async migrateFromLegacy() {}
}

export const db = new MediaHiveDB();

class OfflineDBWrapper {
  async purgeExpiredCache() {}
  async enqueue(mutation: QueuedMutation) { return mutation.id; }
  async getPending(limit?: number): Promise<QueuedMutation[]> { return []; }
  async resetProcessing() { return 0; }
  async updateStatus(id: string, status: QueuedMutation['status'], error?: any) {}
  async delete(id: string) {}
  async getAll(): Promise<QueuedMutation[]> { return []; }
  async setCache(key: string, value: any, ttl?: number) {}
  async getCache<T = any>(key: string): Promise<T | null> { return null; }
  async deleteCache(key: string) {}
  async updateEntityCache(table: 'tasks' | 'events' | 'inventory', id: string, data: any) {}
  async saveProfile(profile: any) {}
  async getProfile(id: string) { return null; }
  async getCurrentProfile() { return null; }
  async purgeAllData() { return true; }
}

export const offlineDB = new OfflineDBWrapper();
