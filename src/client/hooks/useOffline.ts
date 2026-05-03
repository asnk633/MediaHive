"use client";
// src/hooks/useOffline.ts
// Hook for managing offline functionality

import { useState, useEffect } from 'react';
import { 
  getPendingSyncOperations, 
  getUnresolvedConflicts,
  ConflictItem
} from '@/lib/offline-db';
import { forceProcessSyncQueue } from '@/lib/offline-sync';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Check for pending sync operations
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const pending = await getPendingSyncOperations();
        setPendingSyncCount(pending.length);
      } catch (error) {
        console.error('Error getting pending sync count:', error);
      }
    };
    
    updatePendingCount();
    
    // Update periodically
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check for conflicts
  useEffect(() => {
    const updateConflicts = async () => {
      try {
        const unresolvedConflicts = await getUnresolvedConflicts();
        setConflicts(unresolvedConflicts);
      } catch (error) {
        console.error('Error getting conflicts:', error);
      }
    };
    
    updateConflicts();
    
    // Update periodically
    const interval = setInterval(updateConflicts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Process sync queue manually
  const processSyncQueue = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await forceProcessSyncQueue();
      
      // Update counts after processing
      const pending = await getPendingSyncOperations();
      setPendingSyncCount(pending.length);
      
      const unresolvedConflicts = await getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isOnline,
    pendingSyncCount,
    conflicts,
    isProcessing,
    processSyncQueue
  };
}
