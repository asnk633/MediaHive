/**
 * Phase 8A: React Hook for Awareness Service
 * 
 * Provides React integration for the awareness service with proper
 * state management and lifecycle handling.
 */

import { useState, useEffect } from 'react';
import { awarenessService, AwarenessState } from '@/lib/awarenessService';

// Phase 8A: Hook for React components
export function useAwareness() {
  const [state, setState] = useState<AwarenessState>(awarenessService.getState());
  
  useEffect(() => {
    const unsubscribe = awarenessService.subscribe(setState);
    return unsubscribe;
  }, []);
  
  return {
    ...state,
    markUpdatesAsSeen: awarenessService.markUpdatesAsSeen.bind(awarenessService),
    clearAllUpdates: awarenessService.clearAllUpdates.bind(awarenessService),
    processBufferedUpdates: awarenessService.processBufferedUpdates.bind(awarenessService)
  };
}
