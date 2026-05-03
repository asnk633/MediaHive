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


// --- GLOBAL BUFFER FOR DIAGNOSTICS ---
export const LOG_BUFFER: string[] = [];
const MAX_LOGS = 50;

/**
 * RootProviders handles global state, theme, auth, and boot-time diagnostics.
 */
export default function RootProviders({ children }: { children: ReactNode }) {
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
      originalError("GLOBAL ERROR", msg, src, line, col, err);
    };
    window.onunhandledrejection = (e) => {
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
      // Suppress benign MOCK_KEY offline errors that trigger Next.js error overlays
      const isBenignMOCK_KEYOfflineError = args.some(arg =>
        typeof arg === 'string' &&
        arg.includes('Could not reach Cloud Firestore backend') &&
        arg.includes('offline mode')
      );
      if (isBenignMOCK_KEYOfflineError) {
        addToBuffer('WARN', ['[Suppressed MOCK_KEY Offline Error]', ...args]);
        originalWarn.apply(console, ['[MOCK_KEY]', 'Operating in offline mode.']);
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

    // 7. DB Schema Drift Guard
    runSchemaCheck().catch(err => {
      originalError('[SchemaCheck] Unexpected error:', err);
    });

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
