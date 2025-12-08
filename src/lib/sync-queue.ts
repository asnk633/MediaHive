// src/lib/sync-queue.ts
// Sync queue processor with exponential backoff

import { 
  getPendingSyncOperations, 
  updateSyncOperationStatus,
  clearCompletedSyncOperations
} from './offline-db';

// Exponential backoff configuration
const MAX_RETRY_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 300000; // 5 minutes

// Process the sync queue
export async function processSyncQueue(): Promise<void> {
  try {
    console.log('[Sync Queue] Processing sync queue');
    
    // Get pending operations
    const pendingOperations = await getPendingSyncOperations();
    
    if (pendingOperations.length === 0) {
      console.log('[Sync Queue] No pending operations');
      return;
    }
    
    console.log(`[Sync Queue] Processing ${pendingOperations.length} operations`);
    
    // Process each operation
    for (const operation of pendingOperations) {
      await processOperation(operation);
    }
    
    // Clean up completed operations
    await clearCompletedSyncOperations();
    
    console.log('[Sync Queue] Sync queue processing completed');
  } catch (error) {
    console.error('[Sync Queue] Error processing sync queue:', error);
  }
}

// Process a single operation with exponential backoff
async function processOperation(operation: any): Promise<void> {
  try {
    // Update status to syncing
    await updateSyncOperationStatus(operation.id, 'syncing');
    
    // Calculate delay based on retry attempts
    const delay = calculateExponentialBackoffDelay(operation.syncAttempts);
    
    // Wait for the calculated delay if this is a retry
    if (operation.syncAttempts > 0) {
      console.log(`[Sync Queue] Waiting ${delay}ms before retry ${operation.syncAttempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Perform the API request
    const response = await fetch(operation.endpoint, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers as needed
        // 'Authorization': `Bearer ${authToken}`
      },
      body: operation.data ? JSON.stringify(operation.data) : undefined
    });
    
    if (response.ok) {
      // Success - mark as completed
      await updateSyncOperationStatus(operation.id, 'completed');
      console.log(`[Sync Queue] Operation ${operation.id} completed successfully`);
    } else {
      // Handle HTTP errors
      await handleOperationError(operation, response.status);
    }
  } catch (error) {
    // Handle network errors
    await handleOperationError(operation, 0, error);
  }
}

// Handle operation errors with retry logic
async function handleOperationError(
  operation: any, 
  statusCode: number, 
  error?: any
): Promise<void> {
  console.error(`[Sync Queue] Operation ${operation.id} failed:`, { statusCode, error });
  
  // Check if we should retry
  if (operation.syncAttempts < MAX_RETRY_ATTEMPTS) {
    // Retry - mark as pending again
    await updateSyncOperationStatus(operation.id, 'pending');
    console.log(`[Sync Queue] Operation ${operation.id} will retry (attempt ${operation.syncAttempts + 1})`);
  } else {
    // Max retries exceeded - mark as failed
    await updateSyncOperationStatus(operation.id, 'failed');
    console.error(`[Sync Queue] Operation ${operation.id} failed permanently after ${MAX_RETRY_ATTEMPTS} attempts`);
  }
}

// Calculate exponential backoff delay
function calculateExponentialBackoffDelay(attempt: number): number {
  if (attempt === 0) return 0;
  
  // Exponential backoff: delay = base * 2^attempt
  const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
  
  // Cap the delay at the maximum
  return Math.min(delay, MAX_DELAY_MS);
}

// Export the process function for external use
export const syncQueue = {
  process: processSyncQueue
};