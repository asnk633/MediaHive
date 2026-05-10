/**
 * Phase 8A: Real-Time Awareness Service
 * 
 * Provides read-only real-time awareness of task changes without
 * compromising offline durability or user intent.
 * 
 * Invariants:
 * - Offline queue remains authoritative
 * - Replay has priority over real-time updates
 * - Auth failure halts all sync activity
 * - No silent overwrite of local state
 * - No auto-application while locally dirty
 */

import { toast } from 'sonner';
import { Task } from '@/features/tasks/types/task';

export interface TaskUpdateAwareness {
  taskId: string;
  title: string;
  updated_by: {
    name: string;
    uid: string;
  };
  updated_at: number;
  fieldChanged: string;
  oldValue: any;
  newValue: any;
}

export interface AwarenessState {
  updates: TaskUpdateAwareness[];
  hasNewUpdates: boolean;
  lastUpdateTimestamp: number;
}

class AwarenessService {
  private awarenessState: AwarenessState = {
    updates: [],
    hasNewUpdates: false,
    lastUpdateTimestamp: Date.now()
  };

  private listeners: Set<(state: AwarenessState) => void> = new Set();
  private currentUserUid: string | null = null;
  private isOffline: boolean = false;
  private isReplaying: boolean = false;
  private isPaused: boolean = false;

  // Phase 8A: Set user context
  setUserContext(uid: string | null) {
    this.currentUserUid = uid;
  }

  // Phase 8A: Set system state for proper gating
  setSystemState(options: {
    isOffline?: boolean;
    isReplaying?: boolean;
    isPaused?: boolean;
  }) {
    const { isOffline, isReplaying, isPaused } = options;

    if (isOffline !== undefined) this.isOffline = isOffline;
    if (isReplaying !== undefined) this.isReplaying = isReplaying;
    if (isPaused !== undefined) this.isPaused = isPaused;
  }

  // Phase 8A: Safe awareness update application
  handleRemoteUpdate(update: TaskUpdateAwareness, isLocallyDirty: boolean = false): 'apply' | 'buffer' | 'ignore' {
    // Echo deduplication - ignore self-updates
    if (update.updated_by.uid === this.currentUserUid) {
      console.debug('[Awareness] Ignoring self-echo update for task', update.taskId);
      return 'ignore';
    }

    // Phase 8A: Apply strict buffering rules
    if (isLocallyDirty) {
      console.debug('[Awareness] Buffering update - task is locally dirty');
      return 'buffer';
    }

    if (this.isOffline) {
      console.debug('[Awareness] Buffering update - offline mode');
      return 'buffer';
    }

    if (this.isReplaying) {
      console.debug('[Awareness] Buffering update - replay in progress');
      return 'buffer';
    }

    if (this.isPaused) {
      console.debug('[Awareness] Buffering update - sync paused');
      return 'buffer';
    }

    // If we reach here, it's safe to apply
    console.debug('[Awareness] Applying real-time update for task', update.taskId);
    return 'apply';
  }

  // Phase 8A: Process incoming task updates safely
  processTaskUpdate(task: Task, oldTask: Task | null, currentUser: any, isLocallyDirty: boolean = false) {
    // Only process if we have meaningful data
    if (!task || !task.updated_by || !task.updated_at) return;

    // Skip if this is our own update
    if (task.updated_by.uid === currentUser?.uid) {
      return;
    }

    // Create awareness update for each changed field
    const changedFields = this.getChangedFields(task, oldTask);

    changedFields.forEach(({ field, oldValue, newValue }) => {
      const awarenessUpdate: TaskUpdateAwareness = {
        taskId: task.id,
        title: task.title,
        updated_by: {
          name: task.updated_by?.name || 'Unknown user',
          uid: task.updated_by?.uid || ''
        },
        updated_at: task.updated_at?.seconds ? task.updated_at.seconds * 1000 : Date.now(),
        fieldChanged: field,
        oldValue,
        newValue
      };

      const action = this.handleRemoteUpdate(awarenessUpdate, isLocallyDirty);

      switch (action) {
        case 'apply':
          this.addAwarenessUpdate(awarenessUpdate);
          this.notifyAwareness(`"${task.title}" updated by ${task.updated_by?.name || 'someone'}`, {
            duration: 4000,
            icon: '👀'
          });
          break;

        case 'buffer':
          // Store for later processing
          this.bufferUpdate(awarenessUpdate);
          break;

        case 'ignore':
          // Self-echo, silently ignore
          break;
      }
    });
  }

  // Phase 8A: Get changed fields between task versions
  private getChangedFields(newTask: Task, oldTask: Task | null): Array<{ field: string, oldValue: any, newValue: any }> {
    if (!oldTask) {
      // New task - report all non-meta fields
      return Object.keys(newTask)
        .filter(key => !['id', 'created_at', 'created_by', 'institution_id'].includes(key))
        .map(field => ({
          field,
          oldValue: undefined,
          newValue: (newTask as any)[field]
        }));
    }

    const changes: Array<{ field: string, oldValue: any, newValue: any }> = [];

    // Check specific fields that users care about
    const watchFields = ['title', 'status', 'priority', 'due_date', 'assigned_to', 'description'];

    watchFields.forEach(field => {
      const oldValue = (oldTask as any)[field];
      const newValue = (newTask as any)[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue });
      }
    });

    return changes;
  }

  // Phase 8A: Add update to awareness state
  private addAwarenessUpdate(update: TaskUpdateAwareness) {
    this.awarenessState = {
      ...this.awarenessState,
      updates: [...this.awarenessState.updates, update],
      hasNewUpdates: true,
      lastUpdateTimestamp: Date.now()
    };

    this.notifyListeners();
  }

  // Phase 8A: Buffer updates for later processing
  private bufferUpdate(update: TaskUpdateAwareness) {
    // Store in localStorage for persistence
    try {
      const buffered = this.getBufferedUpdates();
      buffered.push(update);
      localStorage.setItem('awareness_buffer', JSON.stringify(buffered));
    } catch (e) {
      console.warn('[Awareness] Failed to buffer update:', e);
    }
  }

  // Phase 8A: Get buffered updates
  getBufferedUpdates(): TaskUpdateAwareness[] {
    try {
      const buffered = localStorage.getItem('awareness_buffer');
      return buffered ? JSON.parse(buffered) : [];
    } catch (e) {
      return [];
    }
  }

  // Phase 8A: Clear buffered updates
  clearBufferedUpdates() {
    try {
      localStorage.removeItem('awareness_buffer');
    } catch (e) {
      console.warn('[Awareness] Failed to clear buffer:', e);
    }
  }

  // Phase 8A: Process buffered updates when safe
  processBufferedUpdates() {
    if (this.isOffline || this.isReplaying || this.isPaused) {
      return;
    }

    const buffered = this.getBufferedUpdates();
    if (buffered.length === 0) return;

    console.debug(`[Awareness] Processing ${buffered.length} buffered updates`);

    buffered.forEach(update => {
      this.addAwarenessUpdate(update);
    });

    this.notifyAwareness(`${buffered.length} updates available while you were away`, {
      duration: 5000,
      icon: '📥'
    });

    this.clearBufferedUpdates();
  }

  // Phase 8A: Notify user of awareness events
  private notifyAwareness(message: string, options: any = {}) {
    toast(message, {
      ...options,
      position: 'bottom-right'
    });
  }

  // Phase 8A: Get current awareness state
  getState(): AwarenessState {
    return { ...this.awarenessState };
  }

  // Phase 8A: Mark updates as seen
  markUpdatesAsSeen() {
    this.awarenessState = {
      ...this.awarenessState,
      hasNewUpdates: false
    };
    this.notifyListeners();
  }

  // Phase 8A: Clear all awareness updates
  clearAllUpdates() {
    this.awarenessState = {
      updates: [],
      hasNewUpdates: false,
      lastUpdateTimestamp: Date.now()
    };
    this.notifyListeners();
  }

  // Phase 8A: Subscribe to awareness changes
  subscribe(listener: (state: AwarenessState) => void): () => void {
    this.listeners.add(listener);
    // Send current state immediately
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Phase 8A: Notify all listeners
  private notifyListeners() {
    const state = this.getState();
    // Use microtask to decouple from React render cycle
    Promise.resolve().then(() => {
      this.listeners.forEach(listener => {
        try {
          listener(state);
        } catch (e) {
          console.error('[Awareness] Error notifying listener:', e);
        }
      });
    });
  }

  // Phase 8A: Reset service (for testing/cleanup)
  reset() {
    this.awarenessState = {
      updates: [],
      hasNewUpdates: false,
      lastUpdateTimestamp: Date.now()
    };
    this.listeners.clear();
    this.clearBufferedUpdates();
  }
}

// Phase 8A: Export singleton instance
export const awarenessService = new AwarenessService();
