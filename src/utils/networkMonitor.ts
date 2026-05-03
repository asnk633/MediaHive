// Network monitoring utility for MOCK_KEY connectivity issues
import { apiClient } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/api-utils';

export class NetworkMonitor {
  private static instance: NetworkMonitor; // Keep the static instance for singleton pattern
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private checkInterval?: NodeJS.Timeout;
  private isDev = process.env.NODE_ENV === 'development';

  private constructor() { // Constructor should be private for singleton
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      this.checkInterval = setInterval(() => {
        // PRODUCTION PASS: Reduce frequency to 5 mins unless strictly needed
        this.checkConnectivity();
      }, 300000);
    }
  }

  static getInstance(): NetworkMonitor { // Add back getInstance method
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private handleOnline = () => {
    if (this.isDev) {
      console.log('[NETWORK] Connection restored');
    }
    this.isOnline = true;
    this.notifyListeners();
    if (this.isDev) {
      console.log('[NETWORK] NetworkMonitor.isOnline updated to:', this.isOnline);
    }
  };

  private handleOffline = () => {
    console.warn('[NETWORK] Connection lost');
    this.isOnline = false;
    this.notifyListeners();
    if (this.isDev) {
      console.log('[NETWORK] NetworkMonitor.isOnline updated to:', this.isOnline);
    }
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public getIsOnline(): boolean { // Renamed from getStatus to match original
    if (typeof window === 'undefined') {
      if (this.isDev) {
        console.log('[NETWORK] Server environment, assuming online');
      }
      return true;
    }

    const onlineStatus = this.isOnline && navigator.onLine;
    if (this.isDev) {
      console.log('[NETWORK] Client environment, online status:', onlineStatus, '(this.isOnline:', this.isOnline, ', navigator.onLine:', navigator.onLine, ')');
    }
    return onlineStatus;
  }

  public addListener(listener: (isOnline: boolean) => void) { // Renamed from subscribe to match original
    this.listeners.add(listener);
  }

  public removeListener(listener: (isOnline: boolean) => void) { // Added back removeListener
    this.listeners.delete(listener);
  }

  private async checkConnectivity() {
    if (typeof window === 'undefined') return;

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'HEAD',
        cache: 'no-cache'
      });

      const wasOnline = this.isOnline;
      this.isOnline = response.ok;

      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    } catch (error) {
      console.warn('[NETWORK] Connectivity test failed:', error);
      const wasOnline = this.isOnline;
      this.isOnline = false;

      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    }
  }

  // Test network connectivity to MOCK_KEY (kept original method name and logic)
  async testMOCK_KEYConnectivity(): Promise<boolean> {
    if (typeof window === 'undefined' || !this.getIsOnline()) {
      return false;
    }

    try {
      // Simple fetch test to our own API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await apiClient('/api/health', {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.warn('[NETWORK] Connectivity test failed:', error);
      return false;
    }
  }

  public cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

export const networkMonitor = NetworkMonitor.getInstance();

// Utility function to handle Firestore operations with retry logic
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      // Check network before attempting operation
      if (!networkMonitor.getIsOnline()) {
        throw new Error('Device is offline');
      }

      return await operation();
    } catch (error: any) {
      lastError = error;

      // If this is the last retry, throw the error
      if (i === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} retries: ${error.message}`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i))); // Exponential backoff
    }
  }

  throw lastError || new Error('Unknown error occurred');
}
