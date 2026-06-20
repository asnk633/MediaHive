import { syncQueueDb, SyncQueueItem, TaskPayload } from './db/syncQueueDb';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRY_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 300000;

function computeBackoff(retryCount: number): number {
  if (retryCount === 0) return 0;
  const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1);
  return Math.min(delay, MAX_DELAY_MS);
}

// 1. Enqueue mutations to Dexie
export async function enqueueMutation(
  entity: 'task',
  entityId: string,
  mutation: 'create' | 'update' | 'delete',
  payload: TaskPayload,
  clientTimestamp: string
): Promise<void> {
  const item: SyncQueueItem = {
    id: uuidv4(),
    entity,
    entityId,
    mutation,
    payload,
    clientTimestamp,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    nextRetryAt: new Date().toISOString(),
    status: 'pending'
  };

  await syncQueueDb.syncQueue.add(item);
  // Trigger processing asynchronously
  processSyncQueue().catch(console.error);
}

let isProcessing = false;

// 2. Process queue sequentially based on rules
export async function processSyncQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date().toISOString();

    // Reset any orphaned 'syncing' items
    const orphaned = await syncQueueDb.syncQueue.where('status').equals('syncing').toArray();
    for (const item of orphaned) {
      await syncQueueDb.syncQueue.update(item.id, { status: 'pending' });
    }

    while (true) {
      // 1. Fetch pending items where nextRetryAt <= now(), ordered by queuedAt ASC
      const pendingItems = await syncQueueDb.syncQueue
        .where('status')
        .equals('pending')
        .toArray();

      const eligibleItems = pendingItems
        .filter(item => item.nextRetryAt <= new Date().toISOString())
        .sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());

      if (eligibleItems.length === 0) break;

      // Group by entityId
      const groups = new Map<string, SyncQueueItem[]>();
      for (const item of eligibleItems) {
        if (!groups.has(item.entityId)) groups.set(item.entityId, []);
        groups.get(item.entityId)!.push(item);
      }

      let processedAny = false;

      // 2. Process groups
      for (const [entityId, groupItems] of Array.from(groups.entries())) {
        // Check if any item in this entity group has a conflict
        const hasConflict = await syncQueueDb.syncQueue
          .where('status').equals('conflict')
          .filter(i => i.entityId === entityId)
          .count();

        if (hasConflict > 0) {
          continue; // Skip this group entirely
        }

        // Process the oldest pending item for this group
        const itemToProcess = groupItems[0];
        
        await syncQueueDb.syncQueue.update(itemToProcess.id, { status: 'syncing' });

        try {
          // Send request
          const res = await fetch(`/api/tasks/${itemToProcess.entityId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': itemToProcess.id
            },
            body: JSON.stringify({
              ...itemToProcess.payload,
              client_timestamp: itemToProcess.clientTimestamp
            })
          });

          if (res.ok) {
            // 200 OK
            await syncQueueDb.syncQueue.update(itemToProcess.id, { status: 'done' });
            processedAny = true;
          } else if (res.status === 409) {
            // Conflict
            const data = await res.json();
            const serverSnapshot = data.serverSnapshot || {};
            const conflictedFields: string[] = data.conflicted_fields || [];

            // Attempt auto-merge on non-overlapping fields
            const localPayloadKeys = Object.keys(itemToProcess.payload);
            const overlapping = localPayloadKeys.filter(k => conflictedFields.includes(k));

            if (overlapping.length === 0 && conflictedFields.length > 0) {
              // Auto-merge succeeds: local changes don't overlap with server changes.
              // Re-enqueue as a new pending item with updated clientTimestamp
              await syncQueueDb.syncQueue.update(itemToProcess.id, { status: 'done' });
              await enqueueMutation(
                itemToProcess.entity,
                itemToProcess.entityId,
                itemToProcess.mutation,
                itemToProcess.payload, // unchanged payload, but new timestamp
                data.serverTimestamp || new Date().toISOString()
              );
              processedAny = true;
            } else {
              // True conflict
              await syncQueueDb.syncQueue.update(itemToProcess.id, {
                status: 'conflict',
                serverSnapshot,
                conflictedFields
              });
              // Custom event to trigger UI
              window.dispatchEvent(new CustomEvent('sync-conflict', { detail: itemToProcess }));
            }
          } else {
            // 5xx or other errors
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (err) {
          // Network error or 5xx
          const newRetryCount = itemToProcess.retryCount + 1;
          const nextRetryTime = new Date(Date.now() + computeBackoff(newRetryCount)).toISOString();
          
          await syncQueueDb.syncQueue.update(itemToProcess.id, {
            status: newRetryCount >= MAX_RETRY_ATTEMPTS ? 'failed' : 'pending',
            retryCount: newRetryCount,
            nextRetryAt: nextRetryTime
          });
        }
      }

      if (!processedAny) {
        break; // Stop if we didn't process anything (e.g. all groups skipped due to conflict)
      }
    }
  } finally {
    isProcessing = false;
  }
}

// Global listener for online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processSyncQueue().catch(console.error);
  });
}
