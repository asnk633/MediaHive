'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import { isSyncingAtom, syncProgressAtom, circuitBreakerAtom, syncEngine } from '@/lib/offline/queueManager';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export function SyncIndicator() {
  const isSyncing = useAtomValue(isSyncingAtom);
  const progress = useAtomValue(syncProgressAtom);
  const circuitBreaker = useAtomValue(circuitBreakerAtom);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Circuit breaker banner — takes priority
  if (circuitBreaker.tripped) {
    const resumeIn = circuitBreaker.resumeAt
      ? Math.max(0, Math.ceil((circuitBreaker.resumeAt - Date.now()) / 1000))
      : 30;

    return (
      <div className="fixed bottom-28 right-4 z-[999] flex flex-col items-end gap-2">
        <div className="flex items-center gap-3 bg-yellow-500/10 backdrop-blur border border-yellow-500/30 px-4 py-2.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-sm font-medium text-yellow-200/90">
            Sync paused, retrying in {resumeIn}s…
          </span>
          <button
            onClick={() => syncEngine.processQueue(true)}
            className="ml-1 text-xs text-yellow-300 hover:text-yellow-100 underline underline-offset-2 transition-colors pointer-events-auto"
          >
            Retry now
          </button>
        </div>
        
        <button
          onClick={() => syncEngine.clearQueue()}
          className="text-[10px] text-white/40 hover:text-red-400 transition-colors flex items-center gap-1 pr-2"
        >
          Discard pending changes
        </button>
      </div>
    );
  }

  // Sync progress indicator
  if (isSyncing && progress.total > 1) {
    return (
      <div className="fixed bottom-28 right-4 z-[999] flex items-center gap-3 bg-black/80 backdrop-blur border border-white/10 px-4 py-2.5 rounded-full shadow-lg pointer-events-none animate-in fade-in slide-in-from-bottom-2">
        <RefreshCcw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
        <span className="text-sm font-medium text-white/90">
          Syncing {progress.current} / {progress.total}…
        </span>
      </div>
    );
  }

  return null;
}
