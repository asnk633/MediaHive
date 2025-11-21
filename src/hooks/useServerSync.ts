// src/hooks/useServerSync.ts
// Hook for server-side synchronization using SSE/WebSocket

import { useState, useEffect } from 'react';

interface ServerEvent {
  type: string;
  [key: string]: any;
}

export function useServerSync(channel: string, callback: (data: ServerEvent) => void) {
  useEffect(() => {
    // In a real implementation, this would connect to the server
    // For now, we'll just simulate the connection
    
    // Create EventSource for SSE
    const eventSource = new EventSource(`/api/${channel}/subscribe`);
    
    // Add event listener
    eventSource.addEventListener(channel, (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error(`Error parsing ${channel} event:`, error);
      }
    });
    
    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error(`SSE connection error for ${channel}:`, error);
    };
    
    // Cleanup function
    return () => {
      eventSource.close();
    };
  }, [channel, callback]);
}