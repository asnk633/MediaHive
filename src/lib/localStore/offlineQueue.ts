// src/lib/localStore/offlineQueue.ts
// Queue mutations when offline

import { localDB } from './localDB';

export interface OfflineMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  payload: any;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private static readonly STORE_NAME = 'offlineQueue';
  private static readonly MAX_RETRIES = 3;

  async enqueue(mutation: Omit<OfflineMutation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const offlineMutation: OfflineMutation = {
        id: this.generateId(),
        ...mutation,
        timestamp: Date.now(),
        retries: 0
      };
      
      await localDB.put(OfflineQueue.STORE_NAME, offlineMutation);
    } catch (error) {
      console.warn('Failed to enqueue offline mutation:', error);
    }
  }

  async dequeue(): Promise<OfflineMutation | null> {
    try {
      const all = await this.getAll();
      if (all.length === 0) return null;
      
      // Get the oldest mutation
      const oldest = all.reduce((prev, current) => 
        prev.timestamp < current.timestamp ? prev : current
      );
      
      // Remove it from the queue
      await localDB.delete(OfflineQueue.STORE_NAME, oldest.id);
      
      return oldest;
    } catch (error) {
      console.warn('Failed to dequeue offline mutation:', error);
      return null;
    }
  }

  async getAll(): Promise<OfflineMutation[]> {
    try {
      return await localDB.getAll<OfflineMutation>(OfflineQueue.STORE_NAME);
    } catch (error) {
      console.warn('Failed to get offline queue:', error);
      return [];
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await localDB.delete(OfflineQueue.STORE_NAME, id);
    } catch (error) {
      console.warn('Failed to remove offline mutation:', error);
    }
  }

  async incrementRetries(id: string): Promise<void> {
    try {
      const mutation = await localDB.get<OfflineMutation>(OfflineQueue.STORE_NAME, id);
      if (mutation) {
        mutation.retries += 1;
        await localDB.put(OfflineQueue.STORE_NAME, mutation);
      }
    } catch (error) {
      console.warn('Failed to increment retries for offline mutation:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await localDB.clear(OfflineQueue.STORE_NAME);
    } catch (error) {
      console.warn('Failed to clear offline queue:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();
