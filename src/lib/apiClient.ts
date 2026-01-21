// import { getAuth } from 'firebase/auth'; // Dynamic import used instead to prevent build-time toxicity

// Request deduplication cache
const inflightRequests = new Map<string, Promise<any>>();

// Rate limit toast burst detection (prevent spam)
let last429Toast = 0;
const TOAST_COOLDOWN_MS = 5000; // Only show toast once per 5 seconds

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s exponential backoff
const isDev = process.env.NODE_ENV === 'development';

interface ApiOptions extends RequestInit {
  url?: string;
  skipDedup?: boolean;
  silent?: boolean;
}

// Helper: Sleep for specified milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Determine if error should be retried
function isRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();

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

  // Don't retry auth/permission errors
  if (message.includes('401') ||
    message.includes('403') ||
    message.includes('404') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')) {
    return false;
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
    } catch (error) {
      lastError = error as Error;

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
        toast.error('Too many requests. Please wait a moment and try again.', {
          duration: 5000,
          id: 'rate-limit-429' // Prevent duplicate toasts
        });
      });
    }
  }
}

// Main API client function
export const apiClient = async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  // Construct the full URL
  // Priority: 1. Relative (standard web), 2. Static env var, 3. Manual fallback
  const envBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const baseUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost') && envBaseUrl ? envBaseUrl : '')
    : 'http://localhost:3000';

  // If we are on capacitor://localhost or similar, we MUST use the remote base URL
  const effectiveBaseUrl = (typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost'))
    ? (envBaseUrl || '')
    : baseUrl;

  const url = `${effectiveBaseUrl}${endpoint}`;

  const requestKey = `${options.method || 'GET'}:${url}`;

  // Return existing promise if in-flight and not skipped
  if (!options.skipDedup && inflightRequests.has(requestKey)) {
    return inflightRequests.get(requestKey) as Promise<T>;
  }

  // Wrap the request in retry logic
  const requestPromise = retryWithBackoff(async () => {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>;

    // If body is FormData, delete Content-Type to let browser set it with boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    // Automatically attach Firebase ID token if user is signed in
    // BUT: respect explicitly passed Authorization headers (e.g., from AuthContext)
    const headersRecord = options.headers as Record<string, string> | undefined;
    if (!headersRecord?.['Authorization']) {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        console.log('[API Client] auth.currentUser exists:', !!auth.currentUser, 'for endpoint:', endpoint);
        if (auth.currentUser) {
          // Force refresh if we are hitting a 401 recently? No, standard get is fine.
          const token = await auth.currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
          console.log('[API Client] Token attached for:', endpoint);
        } else {
          console.warn('[API Client] No currentUser available for:', endpoint);
        }
      } catch (error) {
        if (isDev) console.warn('[API Client] Failed to attach auth token:', error);
      }
    } else {
      // Use the explicitly provided Authorization header
      headers['Authorization'] = headersRecord?.['Authorization'] || '';
      console.log('[API Client] Using provided Authorization header for:', endpoint);
    }

    // Make the fetch request
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Changed from 'same-origin' to 'include' for better cookie handling
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (!options.silent) {
        console.warn(`[API Client] 401 Unauthorized for endpoint: ${endpoint}`);
      }
      let errorMsg = 'Unauthorized: Please sign in again';
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      // console.warn(`[API Client] 403 Forbidden for endpoint: ${endpoint}`);
      let errorMsg = 'Forbidden: Insufficient permissions';
      try {
        const errData = await response.json();
        if (errData.error) errorMsg = errData.error;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      console.warn(`[API Client] 429 Rate Limited for endpoint: ${endpoint}`);
      show429Toast(); // Show user-facing message (only once due to burst detection)
      throw new Error('HTTP 429: Too Many Requests');
    }

    // Handle 404 Not Found
    if (response.status === 404) {
      // Try to parse the error message from the body if possible
      let errorMessage = `Not Found: ${endpoint}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // ignore json parse error, use default message
      }

      console.error(`[API Client] 404 Not Found for: ${endpoint}`, errorMessage);
      throw new Error(errorMessage);
    }

    // Try to parse the response
    const text = await response.text();
    let data: any;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      // If JSON parsing fails, return a generic response or the text itself
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return text as unknown as T;
    }

    // Throw error if response is not OK and we have error data
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data as T;
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