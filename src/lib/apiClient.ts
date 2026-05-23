import { getApiBaseUrl } from './api-utils';
import { Capacitor } from '@capacitor/core';
import { COPY } from '@/lib/copy';
import { logPerformance } from '@/system/performanceLogger';
import { devMonitor } from '@/system/devMonitor';

// Request deduplication cache
const inflightRequests = new Map<string, Promise<any>>();

// Rate limit toast burst detection (prevent spam)
let last429Toast = 0;
const TOAST_COOLDOWN_MS = 5000; // Only show toast once per 5 seconds

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s exponential backoff
const isDev = process.env.NODE_ENV === 'development';

// Global AbortController for killing all requests on logout
let globalAbortController = new AbortController();

/**
 * Force-kills all in-flight API requests.
 * Called during logout to prevent post-auth retry loops.
 */
export const cancelAllRequests = () => {
  console.warn('[API Client] 🛑 Killing all in-flight requests');
  globalAbortController.abort();
  globalAbortController = new AbortController(); // Reset for next session
};

interface ApiOptions extends RequestInit {
  url?: string;
  skipDedup?: boolean;
  silent?: boolean;
  signal?: AbortSignal | null | undefined;
  timeout?: number;
  token?: string | null;
}

// Helper: Sleep for specified milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Determine if error should be retried
function isRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't retry if the request was intentionally aborted (logout)
  if (message.includes('aborted') || message.includes('abort')) {
    return false;
  }

  // Retry rate limiting
  if (message.includes('429') || message.includes('too many requests')) {
    return true;
  }

  // Retry network failures
  if (message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout')) {
    return true;
  }

  // Don't retry auth/permission errors (unless it's a potential race condition we want to 1-tap retry)
  if (message.includes('403') ||
    message.includes('404') ||
    message.includes('forbidden')) {
    return false;
  }

  // ALLOW a single retry for 401/Unauthorized on the client
  if (message.includes('401') || message.includes('unauthorized')) {
    return typeof window !== 'undefined'; // Only retry on client
  }

  // Default: don't retry
  return false;
}

// Core retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;

      // Kill loop if auth was lost
      if (lastError.message === 'AUTH_ABORT') throw lastError;

      // Limit 401 retries to 1 attempt to avoid infinite loops on genuinely bad credentials
      const isAuthError = lastError.message.toLowerCase().includes('401') ||
        lastError.message.toLowerCase().includes('unauthorized');
      if (isAuthError && attempt >= 1) {
        if (isDev) console.warn(`[API Client] Auth retry failed for ${context}. Stopping retries.`);
        throw lastError;
      }

      // Don't retry if error is not retryable
      if (!isRetryable(lastError)) {
        throw lastError;
      }

      // Don't retry if max attempts reached
      if (attempt === MAX_RETRIES) {
        if (isDev) {
          console.log(`[API Client] Max retries (${MAX_RETRIES}) reached for ${context}`);
        }
        throw lastError;
      }

      // Wait before retry
      const delay = RETRY_DELAYS[attempt];
      if (isDev) {
        console.log(`[API Client] Retry ${attempt + 1}/${MAX_RETRIES} for ${context} after ${delay}ms`);
      }
      await sleep(delay);
    }
  }

  throw lastError!;
}

// Show 429 toast (with burst detection)
function show429Toast() {
  const now = Date.now();
  if (now - last429Toast > TOAST_COOLDOWN_MS) {
    last429Toast = now;

    // Dynamically import toast to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('sonner').then(({ toast }) => {
        toast.error(COPY.toasts.rateLimit, {
          duration: 5000,
          id: 'rate-limit-429' // Prevent duplicate toasts
        });
      });
    }
  }
}

// Main API client function
export const apiClient = async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  // --- LOCAL DEV GUARD (Static in-memory mocks) ---
  if (process.env.NEXT_PUBLIC_DEV_NO_API === 'true') {
    if (!options.silent) {
      console.log(`[DEV] API call skipped (BACKEND DISABLED) -> ${endpoint}`);
    }

    // Static mock responses — in-memory only, no persistence
    if (endpoint.includes('/notifications')) {
      return {
        notifications: [
          {
            id: 'mock-notif-1',
            title: 'Welcome to MediaHive',
            message: 'You are running in local bypass mode.',
            type: 'system',
            created_at: new Date().toISOString(),
            read: false,
          },
          {
            id: 'mock-notif-2',
            title: 'Task Assigned',
            message: 'A new sample task has been assigned to you.',
            type: 'task_assigned',
            created_at: new Date().toISOString(),
            read: false,
          },
        ],
        unreadCount: 2,
      } as any;
    }

    if (endpoint.includes('/trash/restore')) {
      return { restored: 1 } as any;
    }

    if (endpoint.includes('/trash')) {
      if (options.method === 'DELETE') {
        return { purged: 1 } as any;
      }
      // Static trash items (seed only, no persistence)
      const now = new Date();
      const mockTrashedTasks = [
        {
          id: 'mock-trash-1',
          title: 'Old Campaign Draft',
          description: 'Stale campaign from Q3.',
          status: 'todo',
          priority: 'low',
          deleted: true,
          deletedAt: new Date(now.getTime() - 86400000).toISOString(),
          due_date: new Date(now.getTime() - 259200000).toISOString(),
          assigned_to: [{ uid: 'dev-mock-admin', name: 'Local Admin' }],
          created_by: { uid: 'dev-mock-admin', name: 'Local Admin', role: 'admin' },
          created_at: { seconds: Math.floor(now.getTime() / 1000) - 604800, nanoseconds: 0 },
          institution_id: '1',
        },
        {
          id: 'mock-trash-2',
          title: 'Duplicate Media Log',
          description: 'Auto-generated duplicate, safe to delete.',
          status: 'done',
          priority: 'low',
          deleted: true,
          deletedAt: new Date(now.getTime() - 172800000).toISOString(),
          due_date: new Date(now.getTime() - 432000000).toISOString(),
          assigned_to: [{ uid: 'dev-mock-admin', name: 'Local Admin' }],
          created_by: { uid: 'dev-mock-admin', name: 'Local Admin', role: 'admin' },
          created_at: { seconds: Math.floor(now.getTime() / 1000) - 1209600, nanoseconds: 0 },
          institution_id: '1',
        },
      ];
      return { tasks: mockTrashedTasks, total: mockTrashedTasks.length } as any;
    }

    // All task mutations (bulk, single update) return success — state is managed by useOptimisticTasks
    if (endpoint.includes('/tasks/bulk') || (endpoint.includes('/tasks') && (options.method === 'PUT' || options.method === 'PATCH' || options.method === 'DELETE'))) {
      return { success: true, results: [], errors: [], message: 'Mock operation complete' } as any;
    }

    if (endpoint.includes('/tasks')) {
      const now = new Date();
      const mockTasks = [
        {
          id: 'mock-task-1',
          title: 'Immediate Production Review',
          description: 'Review final edits for the upcoming product launch.',
          status: 'in_progress',
          priority: 'high',
          due_date: now.toISOString(),
          assigned_to: [{ uid: 'dev-mock-admin', name: 'Local Admin' }],
          created_by: { uid: 'dev-mock-admin', name: 'Local Admin', role: 'admin' },
          created_at: { seconds: Math.floor(now.getTime() / 1000) - 86400, nanoseconds: 0 },
          institution_id: '1',
        },
        {
          id: 'mock-task-2',
          title: 'Capture Campus Event',
          description: 'Photography for the annual garden symposium.',
          status: 'todo',
          priority: 'medium',
          due_date: new Date(now.getTime() + 172800000).toISOString(),
          assigned_to: [{ uid: 'dev-mock-admin', name: 'Local Admin' }],
          created_by: { uid: 'dev-mock-admin', name: 'Local Admin', role: 'admin' },
          created_at: { seconds: Math.floor(now.getTime() / 1000) - 43200, nanoseconds: 0 },
          institution_id: '1',
        },
        {
          id: 'mock-task-3',
          title: 'Archived Footage Cleanup',
          description: 'Organize files from last season.',
          status: 'done',
          priority: 'low',
          due_date: new Date(now.getTime() - 172800000).toISOString(),
          assigned_to: [{ uid: 'dev-mock-admin', name: 'Local Admin' }],
          created_by: { uid: 'dev-mock-admin', name: 'Local Admin', role: 'admin' },
          created_at: { seconds: Math.floor(now.getTime() / 1000) - 259200, nanoseconds: 0 },
          completed_at: { seconds: Math.floor(now.getTime() / 1000) - 86400, nanoseconds: 0 },
          institution_id: '1',
        },
      ];
      return { tasks: mockTasks, total: mockTasks.length } as any;
    }

    if (endpoint.includes('/events')) {
      const now = new Date();
      const mockEvents = [
        {
          id: 'mock-event-1',
          title: 'Strategic Planning Session',
          description: 'Quarterly review of media assets.',
          date: new Date(now.getTime() + 86400000).toISOString(),
          startAt: new Date(now.getTime() + 86400000).toISOString(),
          location: 'Conference Room A',
          type: 'meeting',
          institution_id: '1',
        },
        {
          id: 'mock-event-2',
          title: 'Garden Tour Live Stream',
          description: 'Social media broadcast.',
          date: new Date(now.getTime() + 432000000).toISOString(),
          startAt: new Date(now.getTime() + 432000000).toISOString(),
          location: 'Outdoor Garden',
          type: 'production',
          institution_id: '1',
        },
      ];
      return { events: mockEvents, total: mockEvents.length } as any;
    }

    if (endpoint.includes('/campaigns')) {
      return {
        campaigns: [
          {
            id: 'mock-campaign-1',
            title: 'Spring Season Launch',
            status: 'active',
            phase: 'production',
            description: 'Primary marketing campaign for Spring.',
            institution_id: '1',
            created_at: new Date().toISOString(),
          },
        ],
      } as any;
    }

    if (endpoint.includes('/users/me')) {
      return {
        user: {
          uid: 'dev-mock-admin',
          email: 'admin@local.dev',
          name: 'Local Admin',
          role: 'admin',
          isAdmin: true,
          institution_id: '1',
        },
      } as any;
    }

    if (endpoint.includes('/inventory/stats')) {
      return { total: 156, inUse: 42, unavailable: 12, utilization: 27 } as any;
    }

    // Generic success for any other endpoint
    return { success: true, data: {} } as any;
  }



  // ✅ ENFORCED INVARIANT: Mobile = absolute only, Web = relative allowed
  const envBaseUrl = getApiBaseUrl();

  // 🔍 IMPROVED NATIVE DETECTION: Use Capacitor.isNativePlatform() instead of protocol
  const isOnMobile = typeof window !== 'undefined' &&
    ((window as any).Capacitor?.isNativePlatform?.() || Capacitor.isNativePlatform());

  let url: string;

  // 🔒 MOBILE: Must have absolute URL
  // 🔒 MOBILE: Must have absolute URL
  if (isOnMobile) {
    // If endpoint is already absolute, use it directly
    if (endpoint.startsWith('http')) {
      url = endpoint;
    } else if (!envBaseUrl || envBaseUrl === '') {
      // Fallback for safety - arguably should come from config
      url = `https://thaiba-garden-media-manager.vercel.app${endpoint}`;
      console.warn(`[API] Native platform detected but no NEXT_PUBLIC_API_URL. Defaulting to: ${url}`);
    } else if (envBaseUrl.startsWith('http')) {
      url = `${envBaseUrl}${endpoint}`;
    } else {
      // If envBaseUrl is malformed or relative, we must fallback to a known hardcoded prod (or throw)
      // But let's try to construct it.
      console.error(`[API] Native platform detected but API_URL is relative: ${envBaseUrl}. usage likely fails.`);
      url = `https://thaiba-garden-media-manager.vercel.app${endpoint}`;
    }
  }
  // 🌐 WEB or SERVER context
  else {
    const isServer = typeof window === 'undefined';
    const isInternalApi = endpoint.startsWith('/api/');

    if (endpoint.startsWith('http')) {
      url = endpoint;
    } 
    // On the web, if it's an internal API route, use relative path to avoid DNS issues with external domains
    else if (!isServer && isInternalApi) {
      url = endpoint;
    }
    else if (envBaseUrl && envBaseUrl.startsWith('http')) {
      url = `${envBaseUrl}${endpoint}`;
    } else if (isServer) {
      // Node.js fetch requires absolute URLs. If no env var, use production fallback.
      url = `https://thaiba-garden-media-manager.vercel.app${endpoint}`;
      console.warn(`[API] Server-side fetch detected with no NEXT_PUBLIC_API_URL. Defaulting to: ${url}`);
    } else {
      url = endpoint;
    }
  }

  // --- WORKSPACE INJECTION ---
  if (typeof window !== 'undefined') {
    const savedWorkspaceId = localStorage.getItem('mediahive_workspace');
    if (savedWorkspaceId && !url.includes('institution_id=') && !url.includes('/api/auth')) {
      const separator = url.includes('?') ? '&' : '?';
      // Only inject if it's an internal API call
      if (url.startsWith('/') || url.includes('api/')) {
        url = `${url}${separator}institution_id=${savedWorkspaceId}`;
      }
    }
  }

  const requestKey = `${options.method || 'GET'}:${url}`;
  console.log('[API_CLIENT] Request:', options.method || 'GET', url);

  // Return existing promise if in-flight and not skipped
  if (!options.skipDedup && inflightRequests.has(requestKey)) {
    return inflightRequests.get(requestKey) as Promise<T>;
  }

  // Wrap the request in retry logic
  const requestPromise = retryWithBackoff(async () => {
    // --- HEADER NORMALIZATION ---
    const normalizeHeaders = (h?: HeadersInit): Record<string, string> => {
      const result: Record<string, string> = {};
      if (!h) return result;
      if (h instanceof Headers) {
        h.forEach((v, k) => { result[k] = v; });
      } else if (Array.isArray(h)) {
        h.forEach(([k, v]) => { result[k] = v; });
      } else {
        Object.assign(result, h);
      }
      return result;
    };

    const headers: Record<string, string> = {
      ...normalizeHeaders(options.headers),
    };

    // ONLY set application/json if not explicitly overridden and NOT FormData
    // Browser must set boundary for multipart/form-data automatically
    if (!headers['Content-Type'] && !headers['content-type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // --- SESSION REINFORCEMENT (Rule 2) ---
    const isServer = typeof window === 'undefined';

    if (!headers['Authorization'] && !headers['authorization']) {
      // 🌐 CLIENT: Pulse check for Bearer token fallback
      if (!isServer) {
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            if (isDev) {
              const masked = `${session.access_token.substring(0, 5)}...${session.access_token.substring(session.access_token.length - 5)}`;
              console.log(`[API TRACE] Injected Client Bearer token fallback: ${masked}`);
            }
          }
        } catch (err) {
          if (isDev) console.warn("[API TRACE] Client Bearer token injection failed", err);
        }
      }
      // 🖥️ SERVER: Pulse check for SSR prefetching
      else {
        try {
          // Dynamic imports because next/headers is only available on server
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const { createServerClient } = await import('@supabase/ssr');

          const allCookies = cookieStore.getAll();
          if (isDev) {
            console.log(`[API TRACE][SERVER] 🍪 Cookies count: ${allCookies.length}`, allCookies.map(c => c.name));
          }

          // 🍪 MANDATORY: Forward cookies to the internal API call
          // Without this, the server-to-server fetch has no session context.
          if (allCookies.length > 0) {
            headers['Cookie'] = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
            if (isDev) console.log(`[API TRACE][SERVER] 📤 Forwarded Cookies: ${headers['Cookie'].substring(0, 50)}...`);
          }

          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                getAll() {
                  return cookieStore.getAll();
                },
              },
            }
          );

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            if (isDev) {
              const masked = `${session.access_token.substring(0, 5)}...${session.access_token.substring(session.access_token.length - 5)}`;
              console.log(`[API TRACE][SERVER] ✅ Injected Bearer token: ${masked}`);
            }
          } else {
            if (isDev) console.log("[API TRACE][SERVER] 🛑 No session found in cookies");
          }
        } catch (err) {
          // Silent - next/headers might not be available in some edge runtimes or middleware/proxy contexts
          if (isDev) console.warn("[API TRACE][SERVER] 🛑 Injection failed:", (err as Error).message);
        }
      }
    }

    const timelineEnabled = isDev || endpoint.includes('/me') || endpoint.includes('/stats') || endpoint.includes('/reports');
    const apiStart = Date.now();

    // Create local controller for 10s timeout management (Rule 5)
    const localController = new AbortController();
    const TIMEOUT_MS = options.timeout ?? 10000;
    const timeoutId = setTimeout(() => {
      console.warn(`[API] Timeout reached for ${endpoint} (10s) - Aborting`);
      localController.abort();
    }, TIMEOUT_MS);

    // Listen to global signal to kill this request on logout
    const globalAbortHandler = () => {
      console.warn(`[API] Global abort detected - Killing ${endpoint}`);
      localController.abort();
    };
    globalAbortController.signal.addEventListener('abort', globalAbortHandler);

    try {
      if (isDev) {
        console.log(`[API TRACE] -> fetch('${url}') [${options.method || 'GET'}]`);
        console.log(`[API TRACE] Headers keys:`, Object.keys(headers));
        console.log(`[API TRACE] Context: ${typeof window === 'undefined' ? 'Server' : 'Client'}`);
      }

      const apiStart = performance.now();
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: options.signal || localController.signal
      });

      const duration = logPerformance(`API: ${options.method || 'GET'} ${endpoint}`, apiStart);
      if (duration) {
        devMonitor.recordApiLatency(endpoint.split('?')[0], duration);
      }

      clearTimeout(timeoutId);
      globalAbortController.signal.removeEventListener('abort', globalAbortHandler);

      console.log("[API TRACE] response received:", url)

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = null;
        }

        const errorMessage =
          errorBody?.error ||
          errorBody?.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        console.error(`[API CLIENT ERROR] ${options.method || 'GET'} ${url}: Status ${response.status}`, {
          message: errorMessage,
          body: errorBody,
          url: url
        });

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).body = errorBody;

        if (response.status === 429) {
          show429Toast();
        }

        throw error;
      }

      const text = await response.text();
      let data: any;

      try {
        data = text ? JSON.parse(text) : {};

        // --- AUTO UNWRAP STANDARDIZED RESPONSES ---
        // If the response follows the MediaHive standard { success: true, data: ... },
        // we unwrap it so that legacy components receive the raw data they expect.
        if (data && typeof data === 'object' && data.success === true && 'data' in data) {
          if (isDev && !options.silent) {
            console.log(`[API CLIENT] 🎁 Unwrapping response for ${endpoint}`);
          }
          return data.data as T;
        }
      } catch (parseError) {
        return (text as unknown) as T;
      }

      return data as T;

    } catch (err: any) {
      clearTimeout(timeoutId);
      globalAbortController.signal.removeEventListener('abort', globalAbortHandler);
      if (err.name === 'AbortError') {
        if (globalAbortController.signal.aborted) {
          throw new Error('AUTH_ABORT');
        }
        throw new Error(`Request timeout for ${endpoint}`);
      }
      throw err;
    }

  }, endpoint); // Pass endpoint as context for logging

  // Cache the promise
  if (!options.skipDedup) {
    inflightRequests.set(requestKey, requestPromise);

    // Clean up after request completes
    requestPromise
      .finally(() => {
        inflightRequests.delete(requestKey);
      })
      .catch(() => {
        // Ignore errors here, they're handled by the caller
      });
  }

  return requestPromise;
};

// Convenience methods for common HTTP operations
export const apiGet = <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
};

export const apiPost = <T = any>(endpoint: string, body: any, options: ApiOptions = {}): Promise<T> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const apiPut = <T = any>(endpoint: string, body: any, options: ApiOptions = {}): Promise<T> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const apiDelete = <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
};
