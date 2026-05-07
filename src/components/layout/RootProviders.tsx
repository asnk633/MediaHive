'use client';

import { ReactNode, useRef, useEffect } from 'react';
import { AuthProvider } from "@/contexts/AuthContextProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import BootGate from '@/components/layout/BootGate';
import Diagnostics from '@/components/Diagnostics';
import { networkMonitor } from '@/utils/networkMonitor';
import { toast } from 'sonner';
import { MissingApiBanner } from '@/components/debug/MissingApiBanner';
import { WorkspaceProvider } from "@/system/workspace/WorkspaceProvider";
import { runSchemaCheck } from '@/lib/health/schemaCheck';
import { ConflictResolutionModal } from '@/components/system/ConflictResolutionModal';
import { SyncIndicator } from '@/components/system/SyncIndicator';
import { SyncDevPanel } from '@/components/system/SyncDevPanel';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';


// --- GLOBAL BUFFER FOR DIAGNOSTICS ---
export const LOG_BUFFER: string[] = [];
const MAX_LOGS = 50;

/**
 * RootProviders handles global state, theme, auth, and boot-time diagnostics.
 */
export default function RootProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  const bootStartTime = useRef(Date.now());
  const telemetryEmitted = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. P0 EMERGENCY: Detect and block RSC streaming artifacts in native builds
    if (window.location.href.includes('_rsc')) {
      console.error('[FATAL] RSC request detected in Android environment. Streaming payloads are forbidden for static export.');
    }

    // 2. Global Error Handlers
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    window.onerror = (msg, src, line, col, err) => {
      // Silence benign layout warnings before they hit originalError
      if (typeof msg === 'string' && (
        msg.includes('ResizeObserver') || 
        msg.includes('undelivered notifications')
      )) return;
      
      originalError("GLOBAL ERROR", msg, src, line, col, err);
    };
    window.onunhandledrejection = (e) => {
      if (e.reason?.message?.includes('ResizeObserver')) return;
      originalError("UNHANDLED PROMISE", e.reason);
    };

    // 3. Console Patching for Diagnostics
    const addToBuffer = (type: string, args: any[]) => {
      const timestamp = new Date().toISOString();
      const msg = `[${timestamp}][${type}] ${args.map(a =>
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' ')}`;
      LOG_BUFFER.push(msg);
      if (LOG_BUFFER.length > MAX_LOGS) LOG_BUFFER.shift();
    };

    console.log = (...args) => { addToBuffer('LOG', args); originalLog.apply(console, args); };
    console.error = (...args) => {
      // Suppress benign MOCK_KEY offline errors and ResizeObserver loop warnings
      const isSuppressedError = args.some(arg => {
        if (typeof arg !== 'string') return false;
        return (
          (arg.includes('Could not reach Cloud Firestore backend') && arg.includes('offline mode')) ||
          arg.includes('ResizeObserver loop completed with undelivered notifications') ||
          arg.includes('ResizeObserver loop limit exceeded')
        );
      });

      if (isSuppressedError) {
        addToBuffer('WARN', ['[Suppressed Benign Error]', ...args]);
        return;
      }

      addToBuffer('ERROR', args);
      originalError.apply(console, args);
    };
    console.warn = (...args) => { addToBuffer('WARN', args); originalWarn.apply(console, args); };

    // 4. Telemetry Helper (Must use originalLog/Error to avoid infinite recursion)
    const emitBootTelemetry = (status: 'success' | 'timeout' | 'retry' | 'anr_warning') => {
      if (telemetryEmitted.current && status !== 'anr_warning') return;
      if (!(window as any).Capacitor) return;

      const duration = Date.now() - bootStartTime.current;
      const payload = {
        event: `boot_${status}`,
        duration_ms: duration,
        platform: (window as any).Capacitor?.platform,
        timestamp: new Date().toISOString()
      };
      originalLog('[TELEMETRY] Boot Event:', payload);
      if (status !== 'anr_warning') telemetryEmitted.current = true;
    };

    // 5. ANR Prevention Watchdog
    let lastTick = Date.now();
    const watchdogInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick;
      if (delta > 2000) {
        originalWarn(`[WATCHDOG] Main thread stalled for ${delta}ms. Potential ANR imminent.`);
        emitBootTelemetry('anr_warning');
      }
      lastTick = now;
    }, 1000);

    // 6. Network Monitor Notifications
    const handleNetworkChange = (isOnline: boolean) => {
      if (!isOnline) {
        toast.error('You are currently offline. Changes will be synced later.', { id: 'offline-toast' });
      } else {
        toast.success('Connection restored. Syncing data...', { id: 'offline-toast' });
      }
    };
    networkMonitor.addListener(handleNetworkChange);

    // 8. Capacitor Deep Link Listener
    if ((window as any).Capacitor?.isNative) {
      App.addListener('appUrlOpen', data => {
        const url = new URL(data.url);
        // data.url is the full URL (e.g. https://thaibagarden.media/tasks/123)
        // We want to extract the pathname and navigate
        const path = url.pathname;
        if (path) {
          router.push(path);
          toast.info(`Navigating to shared content...`);
        }
      });
    }

    return () => {
      clearInterval(watchdogInterval);
      networkMonitor.removeListener(handleNetworkChange);
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <MissingApiBanner />
          <Diagnostics />
          <ConflictResolutionModal />
          <SyncIndicator />
          <SyncDevPanel />
          <BootGate>
            {children}
          </BootGate>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
