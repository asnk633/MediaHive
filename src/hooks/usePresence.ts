// src/hooks/usePresence.ts
// Hook to track user presence status

import { useState, useEffect } from 'react';
import { useServerSync } from '@/hooks/useServerSync';

export function usePresence(userId: number): boolean {
  const [isOnline, setIsOnline] = useState(false);
  
  // Subscribe to presence updates
  useServerSync('presence', (data) => {
    if (data.userId === userId) {
      setIsOnline(data.online);
    }
  });
  
  return isOnline;
}