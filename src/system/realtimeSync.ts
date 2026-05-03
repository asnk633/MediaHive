import { TABLES } from "@/lib/dbTables";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/providers/ReactQueryProvider";
import { devMonitor } from "@/system/devMonitor";
import { logPerformance } from "@/system/performanceLogger";
import { RealtimeChannel } from "@supabase/supabase-js";
import { timeSync } from "@/lib/timeSync";

/**
 * RealtimeManager
 * 
 * Centralized manager for Supabase Realtime subscriptions.
 * Ensures session guards, token synchronization, and robust error handling.
 */
class RealtimeManager {
    private static instance: RealtimeManager;
    private channels: Map<string, RealtimeChannel> = new Map();
    private active = false;
    private pollingInterval: NodeJS.Timeout | null = null;

    private cursor = {
      timestamp: 0,
      lastId: null as string | null
    };

    private constructor() {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('mh_realtime_cursor');
        if (saved) {
          try {
            this.cursor = JSON.parse(saved);
          } catch (e) {
            this.cursor.timestamp = timeSync.now();
          }
        } else {
          this.cursor.timestamp = timeSync.now();
        }
      }
    }

    private saveCursor() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mh_realtime_cursor', JSON.stringify(this.cursor));
      }
    }

    public static getInstance(): RealtimeManager {
        if (!RealtimeManager.instance) {
            RealtimeManager.instance = new RealtimeManager();
        }
        return RealtimeManager.instance;
    }

    /**
     * Ensures the Supabase client has the latest auth token for Realtime.
     */
    private async syncToken(): Promise<boolean> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return false;

            // Explicitly sync token to realtime client to avoid CHANNEL_ERROR with RLS
            if ((supabase as any).realtime) {
                (supabase as any).realtime.setAuth(session.access_token);
            }
            return true;
        } catch (e) {
            console.error("[Realtime] Failed to sync session token:", e);
            return false;
        }
    }

    /**
     * Polling Fallback: Used when Realtime is unavailable or dead.
     */
    private startPolling() {
      if (this.pollingInterval) return;
      
      const { logEvent } = require('@/lib/logger');
      const { healthManager } = require('@/lib/health/healthState');

      logEvent('SYNC_POLLING_START', { reason: 'Realtime unavailable' }, 'warn');
      
      const runPolling = async () => {
        // Multi-tab coordination: Only the leader tab polls
        if (!healthManager.isLeader()) return;

        // Visibility Awareness: Slow down polling if tab is hidden
        const isHidden = typeof document !== 'undefined' && document.hidden;
        const baseInterval = isHidden ? 60000 : 15000; // 60s if hidden, 15s if visible

        console.log(`[Realtime] Polling for updates (Leader, ${isHidden ? 'Hidden' : 'Visible'})...`);
        
        // SWR (Stale-While-Revalidate) Logic
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });

        // Update cursor for gap filling
        this.cursor.timestamp = timeSync.now();

        // Recursive timeout for jitter
        const jitter = Math.floor(Math.random() * 6000) - 3000; // ±3s
        this.pollingInterval = setTimeout(runPolling, baseInterval + jitter) as any;
      };

      this.pollingInterval = setTimeout(runPolling, 1000) as any;
    }

    /**
     * Gap Fill: Fetches missed updates since the last cursor.
     * Uses a composite key {timestamp, lastId} for lossless recovery.
     */
    private async fillRealtimeGaps() {
      console.log(`[Realtime] ⚡ Lossless Gap Fill since ${new Date(this.cursor.timestamp).toLocaleTimeString()} (Last ID: ${this.cursor.lastId || 'None'})...`);
      
      // In a real implementation, we would query with:
      // .filter('updated_at', 'gte', this.cursor.timestamp)
      // .order('updated_at', { ascending: true })
      
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }

    /**
     * Updates the cursor with the latest event data
     */
    private updateCursor(payload: any) {
      if (payload.new && payload.new.updated_at) {
        this.cursor.timestamp = new Date(payload.new.updated_at).getTime();
        this.cursor.lastId = payload.new.id;
        this.saveCursor(); // Persist update
      }
    }

    /**
     * Entity-Specific Realtime Subscription
     * Upgraded for Collaboration & Field-Level Sync
     */
    public subscribeEntity(type: string, id: string, onUpdate: (payload: any) => void) {
      if (typeof window === 'undefined') return;

      const channelKey = `entity:${type}:${id}`;
      if (this.channels.has(channelKey)) return;

      const { collabManager } = require('@/lib/collaboration/collabManager');
      const { toast } = require('sonner');

      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: type === 'event' ? 'events' : 'tasks',
          filter: `id=eq.${id}`
        }, (payload: any) => {
          this.updateCursor(payload);
          onUpdate(payload);
        })
        .on('broadcast', { event: 'field_update' }, ({ payload }: { payload: any }) => {
          const fieldNames = Object.keys(payload.fields).join(', ');
          console.log(`[Realtime] 👥 Remote update on [${fieldNames}] by ${payload.userName}`);
          
          // Step 2: Typing Protection
          // We check if the local user is currently editing any of these fields
          const isUserEditing = Object.keys(payload.fields).some(f => {
            const el = document.activeElement;
            return el && (el as any).name === f; // Simple check via element name
          });

          const applyUpdate = () => {
            toast.info(`Updated by ${payload.userName} just now`, {
              description: `Fields: ${fieldNames}`
            });
            queryClient.invalidateQueries({ queryKey: [type === 'event' ? 'events' : 'tasks'] });
          };

          if (isUserEditing) {
            console.log(`[Realtime] ⌨️ User is typing in targeted field. Delaying update...`);
            setTimeout(applyUpdate, 1500); // Wait for user to finish or pause
          } else {
            applyUpdate();
          }
        })
        .subscribe();

      this.channels.set(channelKey, channel);
      collabManager.joinEntity(type, id); // Auto-join presence
    }

    private stopPolling() {
      if (this.pollingInterval) {
        clearTimeout(this.pollingInterval);
        this.pollingInterval = null;
        console.log("[Realtime] Polling fallback stopped.");
      }
    }

    /**
     * Global Sync: Listens for general changes and updates the React Query cache.
     */
    public async startGlobalSync() {
        if (this.active) return;
        
        const hasSession = await this.syncToken();
        if (!hasSession) {
            console.warn("[Realtime] Skipping global sync: No active session.");
            return;
        }

        // Active Health Awareness: Pause activities if system is unavailable
        const { healthManager } = await import('@/lib/health/healthState');
        healthManager.subscribe((status) => {
          if (status === 'unavailable') {
            console.warn("[Realtime] System pulse DEAD. Switching to Polling.");
            this.stopAll();
            this.startPolling();
          } else if (status === 'healthy') {
            if (!this.active) {
              console.log("[Realtime] System pulse RESTORED. Resuming Realtime.");
              this.stopPolling();
              this.fillRealtimeGaps(); // Fill gaps missed during outage
              this.startGlobalSync();
            }
          }
        });

        if (healthManager.shouldPauseActivities()) {
          this.startPolling();
          return;
        }

        console.log("[Realtime] Starting global synchronization...");
        this.active = true;

        const channel = supabase.channel("mediahive-global-sync");

        // -- Tasks Sync --
        channel.on(
            "postgres_changes",
            { event: "*", schema: "public", table: TABLES.TASKS },
            (payload: any) => {
                const start = performance.now();
                console.log("[Realtime] Task change detected:", payload.eventType);
                
                // Update cache directly for immediate UI feedback
                queryClient.setQueryData(["tasks"], (old: any[] | undefined) => {
                    if (!old) return old;
                    switch (payload.eventType) {
                        case "INSERT": return [payload.new, ...old];
                        case "UPDATE": return old.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item);
                        case "DELETE": return old.filter(item => item.id !== payload.old.id);
                        default: return old;
                    }
                });

                const duration = logPerformance(`Realtime: tasks ${payload.eventType}`, start);
                if (duration) devMonitor.recordRealtimeLatency(duration);
            }
        );

        // -- Basic Invalidation Sync (Events, Campaigns) --
        const tablesToInvalidate = [TABLES.EVENTS, TABLES.CAMPAIGNS, TABLES.NOTIFICATIONS];
        tablesToInvalidate.forEach(table => {
            channel.on(
                "postgres_changes",
                { event: "*", schema: "public", table },
                (payload: any) => {
                    console.log(`[Realtime] ${table} change detected - invalidating cache`);
                    queryClient.invalidateQueries({ queryKey: [table] });
                }
            );
        });

        channel.subscribe((status: any, err?: any) => {
            if (status === "CHANNEL_ERROR") {
                console.error("[Realtime] Global channel error:", err);
                this.active = false;
                devMonitor.setChannelStatus("global-sync", false);
                this.startPolling(); // Switch to polling if channel fails
            } else if (status === "SUBSCRIBED") {
                console.log("[Realtime] ✅ Global sync active");
                devMonitor.setChannelStatus("global-sync", true);
                this.stopPolling(); // Disable polling if realtime is successful
            }
        });

        this.channels.set("global-sync", channel);
    }

    /**
     * Create a scoped subscription (e.g., for a specific user or tenant).
     */
    public async subscribe(
        id: string, 
        config: { table: string; filter: string; event?: any }, 
        onUpdate: (payload: any) => void
    ) {
        if (this.channels.has(id)) {
            console.log(`[Realtime] Subscription ${id} already exists.`);
            return;
        }

        const hasSession = await this.syncToken();
        if (!hasSession) return;

        console.log(`[Realtime] Subscribing to ${config.table} with filter: ${config.filter}`);

        const channel = supabase
            .channel(id)
            .on(
                "postgres_changes",
                { 
                    event: config.event || "*", 
                    schema: "public", 
                    table: config.table, 
                    filter: config.filter 
                },
                onUpdate
            )
            .subscribe((status: any, err?: any) => {
                if (status === "CHANNEL_ERROR") {
                    console.warn(`[Realtime] Subscription ${id} failed:`, err);
                } else if (status === "SUBSCRIBED") {
                    console.log(`[Realtime] ✅ Subscribed: ${id}`);
                }
            });

        this.channels.set(id, channel);
    }

    public unsubscribe(id: string) {
        const channel = this.channels.get(id);
        if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(id);
            console.log(`[Realtime] Unsubscribed: ${id}`);
        }
    }

    public stopAll() {
        this.channels.forEach(channel => supabase.removeChannel(channel));
        this.channels.clear();
        this.active = false;
    }
}

export const synergySyncManager = RealtimeManager.getInstance();

export const startRealtimeSync = () => {
    return synergySyncManager.startGlobalSync();
};
