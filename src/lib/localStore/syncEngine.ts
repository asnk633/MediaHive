// src/lib/localStore/syncEngine.ts
// Resolves queued mutations when online

"use client";

import { offlineQueue, OfflineMutation } from './offlineQueue';
import { localDB } from './localDB';
import { persistedQueries } from './persistedQueries';
import { apiClient } from '@/lib/apiClient';

class SyncEngine {
  private isSyncing = false;
  private onlineStatus = true;

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
    }
  }

  setOnline(online: boolean): void {
    this.onlineStatus = online;
    if (online) {
      this.flushQueue();
    }
  }

  async flushQueue(): Promise<void> {
    if (this.isSyncing || !this.onlineStatus) {
      return;
    }

    this.isSyncing = true;

    try {
      const mutations = await offlineQueue.getAll();
      
      for (const mutation of mutations) {
        try {
          await this.processMutation(mutation);
          await offlineQueue.remove(mutation.id);
        } catch (error) {
          console.warn('Failed to process mutation:', error);
          
          // Increment retries or remove if max retries reached
          if (mutation.retries < 3) {
            await offlineQueue.incrementRetries(mutation.id);
          } else {
            await offlineQueue.remove(mutation.id);
            console.warn('Mutation failed after max retries, removing:', mutation);
          }
        }
      }
      
      // After processing mutations, revalidate data and clear cache
      await this.revalidateFromServer();
      await this.clearQueryCache();
      await this.sendMergePayload();
      await this.patchOptimisticItems();
    } catch (error) {
      console.error('Error flushing offline queue:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processMutation(mutation: OfflineMutation): Promise<void> {
    const { type, endpoint, payload } = mutation;
    
    const options: RequestInit = {
      method: type === 'create' ? 'POST' : type === 'update' ? 'PATCH' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (type !== 'delete') {
      options.body = JSON.stringify(payload);
    }
    
    await apiClient(endpoint, options);
  }

  async revalidateFromServer(): Promise<void> {
    // In a real implementation, this would fetch fresh data from the server
    // and update the local cache
    console.log('Revalidating data from server...');
  }

  async sendMergePayload(): Promise<void> {
    // In a real implementation, this would send any merged data back to the server
    console.log('Sending merge payload to server...');
  }

  async patchOptimisticItems(): Promise<void> {
    // In a real implementation, this would update UI with confirmed server data
    console.log('Patching optimistic items with server data...');
  }
  
  async clearQueryCache(): Promise<void> {
    // Clear the query cache after syncing to ensure fresh data
    try {
      await persistedQueries.clear();
      console.log('Query cache cleared after sync');
    } catch (error) {
      console.warn('Failed to clear query cache:', error);
    }
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();