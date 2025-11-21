// src/hooks/usePresence.ts
// Hook to track user presence status

import { useState, useEffect } from 'react';
import { useServerSync } from '@/hooks/useServerSync';
import { schedulePresenceUpdate } from '@/app/api/presence/ping/route';

export function usePresence(userId: number): boolean {
  const [isOnline, setIsOnline] = useState(false);
  
  // Subscribe to presence updates
  useServerSync('presence', (data) => {
    if (data.userId === userId) {
      setIsOnline(data.online);
    }
  });
  
  // Schedule periodic presence updates using low-priority scheduling
  useEffect(() => {
    const updatePresence = () => {
      schedulePresenceUpdate(async () => {
        try {
          await fetch('/api/presence/ping', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Failed to update presence:', error);
        }
      });
    };
    
    // Update presence immediately
    updatePresence();
    
    // Set up interval for periodic updates
    const interval = setInterval(updatePresence, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [userId]);
  
  return isOnline;
}