"use client";
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { syncPendingCountAtom, isSyncingAtom, syncEngine } from '@/lib/offline/queueManager';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount] = useAtom(syncPendingCountAtom);
  const [isProcessing] = useAtom(isSyncingAtom);
  const [conflicts, setConflicts] = useState([]); // Currently unused in True Mutation Queue

  // Check initial online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processSyncQueue = async () => {
    if (isProcessing) return;
    await syncEngine.processQueue();
  };

  return {
    isOnline,
    pendingSyncCount,
    conflicts,
    isProcessing,
    processSyncQueue
  };
}
