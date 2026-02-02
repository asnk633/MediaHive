// Firebase client initialization with robust WebView support
import { FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { networkMonitor, withNetworkRetry } from '@/utils/networkMonitor';
import { getFirebaseApp } from './app';

// Enable verbose logging to debug timeouts only in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Use 'warn' instead of 'debug' to avoid connection spam
  setLogLevel('warn');
} else {
  setLogLevel('error');
}

// Helper for conditional logging
const log = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') console.log(...args);
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') console.warn(...args);
  },
  error: (...args: any[]) => console.error(...args) // Errors always show
};
// Initialize Firebase with robust error handling
async function initializeFirebase() {
  try {
    const app = getFirebaseApp();
    // Use the centralized app instance
    log.info('[FIREBASE] Using centralized Firebase app with Project ID:', app.options.projectId);
    return app;
  } catch (error) {
    console.error('[FIREBASE] Failed to initialize Firebase:', error);
    throw error;
  }
}

// Global variables for Firebase services
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Promise to track initialization
let initializationPromise: Promise<void> | null = null;

// Initialize Firebase services
export async function initializeFirebaseServices() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      app = await initializeFirebase();

      // Initialize Auth with proper persistence for WebView environments
      auth = getAuth(app);

      // Use process.env directly to avoid import issues
      if (process.env.NEXT_PUBLIC_DATA_MODE === 'emulator') {
        const { connectAuthEmulator } = await import('firebase/auth');
        console.log('[FIREBASE] 🔧 Connecting to AUTH EMULATOR (localhost:9099)');
        connectAuthEmulator(auth, "http://localhost:9099");
      }

      // Detect WebView environment
      const isWebView = typeof window !== 'undefined' &&
        (window.navigator.userAgent.includes('wv') ||
          document.documentElement.classList.contains('is-android-webview'));

      // Detect Edge browser
      const isEdge = typeof window !== 'undefined' &&
        (window.navigator.userAgent.includes('Edg/') ||
          window.navigator.userAgent.includes('Edge/'));

      if (isWebView) {
        log.info('[FIREBASE] WebView environment detected, enforcing browserLocalPersistence');
      }

      if (isEdge) {
        log.info('[FIREBASE] Microsoft Edge browser detected, applying network resilience settings');
      }

      // Set persistence for Auth
      if (typeof window !== 'undefined') {
        try {
          // Force local persistence for better WebView behavior
          await setPersistence(auth, browserLocalPersistence);
          log.info('[FIREBASE] Persistence set to LOCAL (browserLocalPersistence)');

          // Set global flag for testing/debugging
          if (process.env.NODE_ENV !== 'production' || (window as any).__TEST__) {
            (window as any).__FIREBASE_READY__ = true;
          }
        } catch (e) {
          log.warn('[FIREBASE] Failed to set persistence, falling back to in-memory:', e);
          // Fallback to in-memory persistence if local fails
          try {
            await setPersistence(auth, inMemoryPersistence);
            log.info('[FIREBASE] Persistence set to IN-MEMORY (fallback)');

            // Set global flag for testing/debugging
            if (process.env.NODE_ENV !== 'production' || (window as any).__TEST__) {
              (window as any).__FIREBASE_PERSISTENCE_FALLBACK__ = true;
            }
          } catch (e2) {
            console.error('[FIREBASE] Failed to set any persistence:', e2);

            // Set error flag for testing/debugging
            if (process.env.NODE_ENV !== 'production' || (window as any).__TEST__) {
              (window as any).__FIREBASE_INIT_ERROR__ = e2;
            }
          }
        }
      }

      // Initialize Firestore with enhanced settings for cross-browser compatibility
      log.info('[FIREBASE] Initializing Firestore with network status:', networkMonitor.getIsOnline());
      db = initializeFirestore(app, {
        // Use auto-detect long polling which is more compatible
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
        cacheSizeBytes: process.env.NODE_ENV === 'production' ? 100 * 1024 * 1024 : 1 * 1024 * 1024, // 100MB prod, 1MB dev
        // Additional settings for Edge browser network issues
        experimentalForceLongPolling: false, // Explicitly disable to avoid conflicts
        // Add network resilience settings for Edge
        ...(isEdge ? {
          cacheSizeBytes: 100 * 1024 * 1024, // 100MB cache for Edge
          synchronizeTabs: false, // Disable tab synchronization for Edge
        } : {}),
        // Add network timeout settings
        experimentalTabSynchronization: false,
      } as any);

      if (process.env.NEXT_PUBLIC_DATA_MODE === 'emulator') {
        const { connectFirestoreEmulator } = await import('firebase/firestore');
        console.log('[FIREBASE] 🔧 Connecting to FIRESTORE EMULATOR (localhost:8080)');
        connectFirestoreEmulator(db, 'localhost', 8080);
      }

      // Initialize Storage with increased retry times and browser-specific settings
      storage = getStorage(app);
      // Increase retry time for slow networks
      storage.maxOperationRetryTime = 10 * 60 * 1000; // 10 minutes
      storage.maxUploadRetryTime = 20 * 60 * 1000; // 20 minutes

      log.info('[FIREBASE] Services initialized successfully');
    } catch (error) {
      console.error('[FIREBASE] Failed to initialize services:', error);

      // Set error flag for testing/debugging
      if (process.env.NODE_ENV !== 'production' || (window as any).__TEST__) {
        (window as any).__FIREBASE_INIT_ERROR__ = error;
      }
      throw error;
    }
  })();

  return initializationPromise;
}

// Services are initialized on-demand by getter functions
// This prevents side-effect initialization when the module is imported

// Getter functions that ensure services are initialized before returning them
export async function getAuthService(): Promise<Auth> {
  await initializeFirebaseServices();
  return auth;
}

export async function getDbService(): Promise<Firestore> {
  await initializeFirebaseServices();

  if (typeof window !== 'undefined' && !networkMonitor.getIsOnline()) {
    console.warn('[FIREBASE] Application is offline. Firestore will serve data from local cache.');
  }

  return db;
}

export async function getStorageService(): Promise<FirebaseStorage> {
  await initializeFirebaseServices();
  return storage;
}

// For backward compatibility, export the services directly
// but they may be undefined until initialization completes
export { auth, db, storage };

// Export initialization function for manual control if needed
export { initializeFirebase };