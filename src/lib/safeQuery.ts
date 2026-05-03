import { supabase } from './supabaseClient';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { healthManager } from './health/healthState';
import { timeSync } from './timeSync';
import { syncEngine } from './offline/queueManager';
import * as Sentry from "@sentry/nextjs";

export interface SafeQueryOptions {
  retries?: number;
  retryDelay?: number;
  fallbackData?: any;
  silent?: boolean;
  offlineFirst?: boolean;
  table?: string;
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  payload?: any;
}

export type SafeQueryErrorType = 'SCHEMA' | 'NETWORK' | 'AUTH' | 'RLS' | 'UNKNOWN';

export interface SafeQueryResult<T> {
  data: T | T[] | null;
  error: any;
  type: SafeQueryErrorType | null;
}

function classifyError(error: any): SafeQueryErrorType {
  if (!error) return 'UNKNOWN';
  
  const code = error.code || '';
  const message = error.message || '';
  const status = error.status;

  if (code === 'PGRST116' || message.includes('relation') || message.includes('does not exist')) {
    return 'SCHEMA';
  }
  
  if (status === 401 || status === 403 || code.startsWith('auth/')) {
    return 'AUTH';
  }

  if (code === '42501') {
    return 'RLS';
  }

  if (status === 503 || status === 404 || message.includes('fetch') || message.includes('network')) {
    return 'NETWORK';
  }

  return 'UNKNOWN';
}

/**
 * safeQuery
 * 
 * A robust wrapper for Supabase queries that adds retry logic,
 * error classification, and active health reporting.
 */
export async function safeQuery<T>(
  queryFn: () => PromiseLike<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
  options: SafeQueryOptions & { idempotencyKey?: string } = {}
): Promise<SafeQueryResult<T>> {
  const { 
    retries = 3, 
    retryDelay = 1000, 
    fallbackData = null,
    silent = false,
    idempotencyKey 
  } = options;

  // 0. Offline-First Handling
  if (options.offlineFirst && options.table && options.type && !navigator.onLine) {
    console.log(`[SafeQuery] 📶 Offline: Enqueuing ${options.type} on ${options.table}`);
    
    // Create payload for enqueue (we need to extract it from the queryFn or pass it)
    // For now, we assume the queryFn was prepared with the payload. 
    // In a real refactor, the service would pass the payload directly to syncEngine.
    // However, to keep safeQuery generic, we'll assume the caller provides payload if offlineFirst.
    const payload = (options as any).payload || {}; 
    
    const action = options.type === 'INSERT' ? 'CREATE' : options.type;
    const mutationType = `${action}_${options.table.toUpperCase().replace(/S$/, '')}`;
    await syncEngine.enqueueMutation(mutationType, payload);
    return { data: fallbackData, error: null, type: null };
  }

  // Prevent duplicate execution of the same mutation across tabs
  if (idempotencyKey) {
    if (healthManager.isMutationInFlight(idempotencyKey)) {
      console.warn(`[SafeQuery] Mutation already in flight (Sync): ${idempotencyKey}`);
      return { data: fallbackData, error: null, type: null };
    }
    healthManager.registerMutation(idempotencyKey);
  }

  let lastError: any = null;
  let attempt = 0;
  const startTime = timeSync.now();

  try {
    while (attempt <= retries) {
      try {
        const result = await queryFn();
        
        // Sync time from server headers
        if (result && (result as any).headers?.date) {
          timeSync.syncWithServer((result as any).headers.date);
        }

        const endpoint = (result as any)._table || 'supabase';

        if (!result.error) {
          healthManager.recordSuccess();
          healthManager.recordLatency(timeSync.now() - startTime);
          return { data: result.data, error: null, type: null };
        }

        lastError = result.error;
        const errorType = classifyError(lastError);
        
        if (!silent) {
          console.warn(`[SafeQuery] Attempt ${attempt + 1} failed (${errorType}):`, lastError.message);
        }

        // Fatal errors: Don't retry
        if (errorType === 'SCHEMA' || errorType === 'AUTH') {
          healthManager.recordFailure(false, errorType, { endpoint, error: lastError });
          
          Sentry.captureException(lastError, {
            tags: { query_type: options.type, error_category: errorType },
            extra: { table: options.table, options }
          });

          return { data: fallbackData, error: lastError, type: errorType };
        }

        if (attempt < retries) {
          healthManager.recordFailure(true, errorType, { endpoint, error: lastError });
          
          Sentry.addBreadcrumb({
            category: 'query',
            message: `Retrying safeQuery (Attempt ${attempt + 1})`,
            level: 'warning',
            data: { error: lastError.message, type: errorType }
          });

          // Exponential backoff with jitter, capped at 10s
          const backoff = Math.min(retryDelay * Math.pow(2, attempt), 10000);
          const jitter = (Math.random() * 2000) - 1000; // ±1s
          const delay = Math.max(100, backoff + jitter);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        
        break;
      } catch (err) {
        lastError = err;
        const errorType = classifyError(lastError);

        if (!silent) {
          console.error(`[SafeQuery] Unexpected error on attempt ${attempt + 1}:`, err);
        }
        
        if (attempt < retries) {
          healthManager.recordFailure(true, errorType, { endpoint: 'catch-block', error: lastError });
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
        break;
      }
    }

    const finalType = classifyError(lastError);
    healthManager.recordFailure(false, finalType, { endpoint: 'exhausted', error: lastError });
    
    if (!silent) {
      console.error(`[SafeQuery] ❌ Resilience threshold exceeded. Returning fallback.`);
    }

    Sentry.captureMessage(`Query threshold exceeded: ${options.table || 'unknown'}`, {
      level: 'error',
      extra: { attempt, lastError, options }
    });

    return { data: fallbackData, error: lastError, type: finalType };

  } finally {
    // Clear mutation registry globally
    if (idempotencyKey) {
      healthManager.clearMutation(idempotencyKey);
    }
  }
}
