/**
 * Phase 8B: Persistent Conflict Store
 * 
 * Implements durable conflict storage with explicit lifecycle states
 * and audit trail support.
 */

import type { ConflictCategory, TaskConflict } from '@/domain/conflicts/types';

export enum ConflictStatus {
  DETECTED = 'detected',
  SURFACED = 'surfaced', 
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ConflictResolution {
  LOCAL = 'local',
  SERVER = 'server',
  MERGED = 'merged',
  DEFERRED = 'deferred'
}

export interface PersistentConflict extends TaskConflict {
  id: string; // Unique identifier for the conflict
  status: ConflictStatus;
  resolution?: ConflictResolution;
  resolvedAt?: number;
  resolvedBy?: string;
  created_at: number;
  lifecycleEvents: Array<{
    status: ConflictStatus;
    timestamp: number;
    actor?: string;
    details?: string;
  }>;
}

export interface ConflictQueryOptions {
  status?: ConflictStatus[];
  taskId?: string;
  field?: string;
  category?: 'benign' | 'content' | 'structural';
  limit?: number;
  offset?: number;
}

class ConflictStore {
  private readonly STORE_KEY = 'persistent_conflicts';
  private readonly MAX_STORE_SIZE = 1000; // Maximum number of conflicts to retain
  
  // In-memory cache for performance
  private cache: Map<string, PersistentConflict> = new Map();
  private isInitialized = false;

  // Phase 8B: Initialize the store
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const stored = await this.loadFromStorage();
      stored.forEach(conflict => {
        this.cache.set(conflict.id, conflict);
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('[ConflictStore] Initialization failed:', error);
      // Continue with empty cache if storage fails
      this.isInitialized = true;
    }
  }

  // Phase 8B: Add a new conflict with proper lifecycle tracking
  async addConflict(conflict: Omit<PersistentConflict, 'id' | 'status' | 'created_at' | 'lifecycleEvents'>): Promise<string> {
    await this.ensureInitialized();
    
    const id = this.generateConflictId();
    const persistentConflict: PersistentConflict = {
      ...conflict,
      id,
      status: ConflictStatus.DETECTED,
      created_at: Date.now(),
      lifecycleEvents: [{
        status: ConflictStatus.DETECTED,
        timestamp: Date.now()
      }]
    };

    this.cache.set(id, persistentConflict);
    await this.saveToStorage();
    
    return id;
  }

  // Phase 8B: Update conflict status with audit trail
  async updateConflictStatus(id: string, status: ConflictStatus, actor?: string, details?: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const conflict = this.cache.get(id);
    if (!conflict) return false;

    const updatedConflict = {
      ...conflict,
      status,
      lifecycleEvents: [
        ...conflict.lifecycleEvents,
        {
          status,
          timestamp: Date.now(),
          actor,
          details
        }
      ]
    };

    this.cache.set(id, updatedConflict);
    await this.saveToStorage();
    
    return true;
  }

  // Phase 8B: Resolve a conflict with resolution details
  async resolveConflict(id: string, resolution: ConflictResolution, resolvedBy: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const conflict = this.cache.get(id);
    if (!conflict) return false;

    const updatedConflict = {
      ...conflict,
      status: ConflictStatus.RESOLVED,
      resolution,
      resolvedAt: Date.now(),
      resolvedBy,
      lifecycleEvents: [
        ...conflict.lifecycleEvents,
        {
          status: ConflictStatus.RESOLVED,
          timestamp: Date.now(),
          actor: resolvedBy,
          details: `Resolved with ${resolution} choice`
        }
      ]
    };

    this.cache.set(id, updatedConflict);
    await this.saveToStorage();
    
    return true;
  }

  // Phase 8B: Get conflicts by query options
  async getConflicts(query: ConflictQueryOptions = {}): Promise<PersistentConflict[]> {
    await this.ensureInitialized();
    
    let conflicts = Array.from(this.cache.values());

    // Apply filters
    if (query.status && query.status.length > 0) {
      conflicts = conflicts.filter(c => query.status!.includes(c.status));
    }
    
    if (query.taskId) {
      conflicts = conflicts.filter(c => c.taskId === query.taskId);
    }
    
    if (query.field) {
      conflicts = conflicts.filter(c => c.field === query.field);
    }
    
    if (query.category) {
      conflicts = conflicts.filter(c => c.category === query.category);
    }

    // Sort by creation time (newest first)
    conflicts.sort((a, b) => b.created_at - a.created_at);

    // Apply pagination
    if (query.offset) {
      conflicts = conflicts.slice(query.offset);
    }
    
    if (query.limit) {
      conflicts = conflicts.slice(0, query.limit);
    }

    return conflicts;
  }

  // Phase 8B: Get a specific conflict by ID
  async getConflictById(id: string): Promise<PersistentConflict | undefined> {
    await this.ensureInitialized();
    return this.cache.get(id);
  }

  // Phase 8B: Get count of unresolved conflicts
  async getUnresolvedCount(): Promise<number> {
    await this.ensureInitialized();
    return Array.from(this.cache.values())
      .filter(c => c.status === ConflictStatus.DETECTED || c.status === ConflictStatus.SURFACED)
      .length;
  }

  // Phase 8B: Get conflicts that need surfacing to user
  async getConflictsForSurfacing(): Promise<PersistentConflict[]> {
    await this.ensureInitialized();
    return Array.from(this.cache.values())
      .filter(c => c.status === ConflictStatus.DETECTED)
      .map(c => ({
        ...c,
        status: ConflictStatus.SURFACED // Return with updated status for surfacing
      }));
  }

  // Phase 8B: Mark conflicts as surfaced (presented to user)
  async markAsSurfaced(ids: string[], actor?: string): Promise<void> {
    await this.ensureInitialized();
    
    for (const id of ids) {
      const conflict = this.cache.get(id);
      if (conflict && conflict.status === ConflictStatus.DETECTED) {
        const updatedConflict = {
          ...conflict,
          status: ConflictStatus.SURFACED,
          lifecycleEvents: [
            ...conflict.lifecycleEvents,
            {
              status: ConflictStatus.SURFACED,
              timestamp: Date.now(),
              actor,
              details: 'Conflict presented to user'
            }
          ]
        };

        this.cache.set(id, updatedConflict);
      }
    }
    
    await this.saveToStorage();
  }

  // Phase 8B: Clean up old conflicts to prevent store bloat
  async cleanup(maxAgeDays: number = 30): Promise<number> {
    await this.ensureInitialized();
    
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, conflict] of this.cache.entries()) {
      // Remove resolved or dismissed conflicts that are older than cutoff
      if ((conflict.status === ConflictStatus.RESOLVED || conflict.status === ConflictStatus.DISMISSED) 
          && conflict.resolvedAt && conflict.resolvedAt < cutoffTime) {
        this.cache.delete(id);
        removedCount++;
      }
    }

    await this.saveToStorage();
    return removedCount;
  }

  // Phase 8B: Clear all conflicts (for testing/reset purposes)
  async clearAll(): Promise<void> {
    this.cache.clear();
    try {
      localStorage.removeItem(this.STORE_KEY);
    } catch (error) {
      console.error('[ConflictStore] Failed to clear storage:', error);
    }
  }

  // Phase 8B: Private helper to ensure store is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Phase 8B: Generate unique conflict ID
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Phase 8B: Load conflicts from persistent storage
  private async loadFromStorage(): Promise<PersistentConflict[]> {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem(this.STORE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[ConflictStore] Failed to load from storage:', error);
      return [];
    }
  }

  // Phase 8B: Save conflicts to persistent storage
  private async saveToStorage(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      // Maintain max store size by removing oldest conflicts
      const conflicts = Array.from(this.cache.values())
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, this.MAX_STORE_SIZE);

      this.cache.clear();
      conflicts.forEach(c => this.cache.set(c.id, c));

      const serialized = JSON.stringify(Array.from(this.cache.values()));
      localStorage.setItem(this.STORE_KEY, serialized);
    } catch (error) {
      console.error('[ConflictStore] Failed to save to storage:', error);
    }
  }
}

// Phase 8B: Export singleton instance
export const conflictStore = new ConflictStore();
