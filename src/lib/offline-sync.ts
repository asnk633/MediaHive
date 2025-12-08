// src/lib/offline-sync.ts
// Offline sync implementation using BroadcastChannel and Visibility API

import { processSyncQueue } from './sync-queue';
import { isOffline } from './service-worker';

// Broadcast channel for cross-tab communication
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('offline-sync') : null;

// Visibility state tracking
let wasOffline = false;

// Initialize offline sync functionality
export function initOfflineSync(): void {
  console.log('[Offline Sync] Initializing offline sync');
  
  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Listen for page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Listen for broadcast messages
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }
  
  // Check initial state
  if (isOffline()) {
    wasOffline = true;
    console.log('[Offline Sync] App started in offline mode');
  }
}

// Handle online event
function handleOnline(): void {
  console.log('[Offline Sync] Browser went online');
  
  // If we were offline, process the sync queue
  if (wasOffline) {
    wasOffline = false;
    processSyncQueueWhenOnline();
  }
  
  // Broadcast the online status to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'ONLINE' });
  }
}

// Handle offline event
function handleOffline(): void {
  console.log('[Offline Sync] Browser went offline');
  wasOffline = true;
  
  // Broadcast the offline status to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'OFFLINE' });
  }
}

// Handle visibility change event
function handleVisibilityChange(): void {
  console.log(`[Offline Sync] Visibility changed to ${document.visibilityState}`);
  
  // When the tab becomes visible, check if we should process the sync queue
  if (document.visibilityState === 'visible') {
    processSyncQueueWhenTabVisible();
  }
}

// Handle broadcast messages from other tabs
function handleBroadcastMessage(event: MessageEvent): void {
  const { type } = event.data;
  
  switch (type) {
    case 'ONLINE':
      console.log('[Offline Sync] Received online notification from another tab');
      // If we were offline, process the sync queue
      if (wasOffline) {
        wasOffline = false;
        processSyncQueueWhenOnline();
      }
      break;
      
    case 'OFFLINE':
      console.log('[Offline Sync] Received offline notification from another tab');
      wasOffline = true;
      break;
      
    case 'SYNC_QUEUE_PROCESSED':
      console.log('[Offline Sync] Another tab processed the sync queue');
      // Could update UI or local state here
      break;
  }
}

// Process sync queue when coming online
async function processSyncQueueWhenOnline(): Promise<void> {
  console.log('[Offline Sync] Processing sync queue after coming online');
  
  try {
    await processSyncQueue();
    
    // Broadcast that we've processed the queue
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_QUEUE_PROCESSED' });
    }
  } catch (error) {
    console.error('[Offline Sync] Error processing sync queue:', error);
  }
}

// Process sync queue when tab becomes visible
async function processSyncQueueWhenTabVisible(): Promise<void> {
  // Only process if we're online
  if (!isOffline()) {
    console.log('[Offline Sync] Processing sync queue because tab became visible');
    
    try {
      await processSyncQueue();
    } catch (error) {
      console.error('[Offline Sync] Error processing sync queue:', error);
    }
  }
}

// Force process sync queue (for manual triggering)
export async function forceProcessSyncQueue(): Promise<void> {
  console.log('[Offline Sync] Force processing sync queue');
  
  try {
    await processSyncQueue();
    
    // Broadcast that we've processed the queue
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_QUEUE_PROCESSED' });
    }
  } catch (error) {
    console.error('[Offline Sync] Error force processing sync queue:', error);
    throw error;
  }
}