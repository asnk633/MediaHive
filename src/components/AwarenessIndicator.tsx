/**
 * Phase 8A: Awareness Indicator Component
 * 
 * Non-blocking UI element that shows real-time awareness updates
 * without interfering with user workflow.
 */

'use client';

import React from 'react';
import { Bell, X, Eye, Users } from 'lucide-react';
import { useAwareness } from '@/hooks/useAwareness';
import { useAuth } from '@/contexts/AuthContextProvider';
import { awarenessService } from '@/lib/awarenessService';

export function AwarenessIndicator() {
  const { updates, hasNewUpdates, processBufferedUpdates } = useAwareness();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = React.useState(false);

  // Phase 8A: Set user context for echo detection
  React.useEffect(() => {
    if (user?.uid) {
      awarenessService.setUserContext(user.uid);
    }
  }, [user?.uid]);

  // Phase 8A: Show indicator when there are new updates
  React.useEffect(() => {
    if (hasNewUpdates && updates.length > 0) {
      setIsVisible(true);
    }
  }, [hasNewUpdates, updates.length]);

  // Phase 8A: Process buffered updates when coming online
  React.useEffect(() => {
    const handleOnline = () => {
      // Small delay to ensure connectivity is stable
      setTimeout(() => {
        processBufferedUpdates();
      }, 1000);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processBufferedUpdates]);

  // Phase 8A: Close indicator
  const handleClose = () => {
    setIsVisible(false);
    awarenessService.markUpdatesAsSeen();
  };

  // Phase 8A: Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isVisible || updates.length === 0) {
    return null;
  }

  // Phase 8A: Show only the most recent update
  const latestUpdate = updates[updates.length - 1];

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground/20 dark:text-foreground">
                Activity Update
              </h3>
              <button
                onClick={handleClose}
                className="text-foreground/60 hover:text-foreground/40 dark:hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="mt-1 text-sm text-foreground/40 dark:text-foreground">
              <span className="font-medium">{latestUpdate.updated_by.name}</span> updated "
              <span className="font-medium text-blue-600 dark:text-blue-400">{latestUpdate.title}</span>"
            </p>
            
            <div className="mt-2 flex items-center text-xs text-foreground/50 dark:text-foreground/60">
              <span>{formatTimeAgo(latestUpdate.updated_at)}</span>
              {updates.length > 1 && (
                <span className="ml-2">• {updates.length - 1} more updates</span>
              )}
            </div>
          </div>
        </div>
        
        {updates.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Dismiss all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
