import { supabase } from '../supabaseClient';
import { healthManager } from '../health/healthState';
import { timeSync } from '../timeSync';

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  editingField?: string;
  isTyping?: boolean;
  lastActive?: number;
}

class CollaborationManager {
  private channels = new Map<string, any>();
  private listeners = new Map<string, Set<(users: PresenceUser[]) => void>>();
  private currentUser: PresenceUser | null = null;
  private presenceDebounceTimer: any = null;
  private ttlInterval: any = null;

  init(user: { id: string; name: string }) {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    this.currentUser = {
      id: user.id,
      name: user.name,
      color: colors[Math.floor(Math.random() * colors.length)],
      lastActive: Date.now()
    };
    
    // Step 3: Soft Lock Expiry (TTL Cleanup)
    if (typeof window !== 'undefined' && !this.ttlInterval) {
      this.ttlInterval = setInterval(() => this.cleanupGhostLocks(), 2000);
    }
  }

  joinEntity(type: string, id: string) {
    if (!this.currentUser) return;
    const channelKey = `${type}:${id}`;
    if (this.channels.has(channelKey)) return;

    const channel = supabase.channel(`collab:${channelKey}`, {
      config: { presence: { key: this.currentUser.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Step 4: Presence Stabilization (Debounce)
        if (this.presenceDebounceTimer) clearTimeout(this.presenceDebounceTimer);
        this.presenceDebounceTimer = setTimeout(() => {
          const state = channel.presenceState();
          const users = Object.values(state).flat() as unknown as PresenceUser[];
          this.notify(channelKey, users);
        }, 1000); // 1s debounce for sync
      })
      .on('broadcast', { event: 'field_focus' }, ({ payload }: { payload: any }) => {
        this.updateUserEditing(channelKey, payload.userId, payload.field, payload.isTyping);
      })
      .on('broadcast', { event: 'field_update' }, ({ payload }: { payload: any }) => {
        console.debug(`[Collab] Remote update on ${channelKey}:`, payload);
      })
      .subscribe(async (status: any) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ ...this.currentUser!, lastActive: Date.now() });
        }
      });

    this.channels.set(channelKey, channel);
  }

  leaveEntity(type: string, id: string) {
    const channelKey = `${type}:${id}`;
    const channel = this.channels.get(channelKey);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelKey);
    }
  }

  broadcastFocus(type: string, id: string, field: string | null, isTyping = false) {
    if (!this.currentUser) return;
    const channelKey = `${type}:${id}`;
    const channel = this.channels.get(channelKey);
    
    if (channel) {
      const payload = { userId: this.currentUser.id, field, isTyping, lastActive: Date.now() };
      channel.send({
        type: 'broadcast',
        event: 'field_focus',
        payload
      });
      
      channel.track({ ...this.currentUser, editingField: field || undefined, isTyping, lastActive: Date.now() });
    }
  }

  broadcastUpdate(type: string, id: string, fields: Record<string, any>) {
    if (!this.currentUser) return;
    const channelKey = `${type}:${id}`;
    const channel = this.channels.get(channelKey);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'field_update',
        payload: { 
          userId: this.currentUser.id, 
          userName: this.currentUser.name,
          fields, 
          timestamp: timeSync.now()
        }
      });
    }
  }

  private cleanupGhostLocks() {
    const now = Date.now();
    this.channels.forEach((channel, key) => {
      const state = channel.presenceState();
      const users = Object.values(state).flat() as unknown as PresenceUser[];
      const needsUpdate = users.some(u => u.editingField && now - (u.lastActive || 0) > 5000);
      
      if (needsUpdate) {
        // We can't easily force-untrack others, but we can notify local UI
        const activeUsers = users.map(u => {
          if (u.editingField && now - (u.lastActive || 0) > 5000) {
            return { ...u, editingField: undefined, isTyping: false };
          }
          return u;
        });
        this.notify(key, activeUsers);
      }
    });
  }

  subscribe(type: string, id: string, callback: (users: PresenceUser[]) => void) {
    const channelKey = `${type}:${id}`;
    if (!this.listeners.has(channelKey)) {
      this.listeners.set(channelKey, new Set());
    }
    this.listeners.get(channelKey)!.add(callback);
    return () => this.listeners.get(channelKey)?.delete(callback);
  }

  private notify(channelKey: string, users: PresenceUser[]) {
    this.listeners.get(channelKey)?.forEach(cb => cb(users));
  }

  private updateUserEditing(channelKey: string, userId: string, field: string | null, isTyping?: boolean) {
    // This will be picked up by the presence sync in most cases, 
    // but broadcast provides immediate feedback.
    // For now, we'll let presence sync handle the state.
  }
}

export const collabManager = new CollaborationManager();
